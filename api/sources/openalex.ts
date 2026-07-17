// OpenAlex citation-graph client (https://docs.openalex.org).
// Powers the "Map" feature: resolve a paper by DOI/title, then fetch its
// references and citing works to build an interactive citation graph.
// Uses only fetch so it runs unchanged on Node and Cloudflare Workers.

export interface MapPaper {
  /** Short OpenAlex work id, e.g. "W2741809807". */
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url: string;
  doi: string | null;
  citations: number;
  venue: string;
  /** Short ids of works this paper cites (used to draw intra-graph edges). */
  referencedWorks: string[];
}

export interface MapEdge {
  /** Citing work (short id). */
  source: string;
  /** Cited work (short id). */
  target: string;
}

export interface CitationGraph {
  /** Short id of the paper the graph is centered on. */
  center: string;
  nodes: MapPaper[];
  edges: MapEdge[];
  errors: string[];
}

const OPENALEX_ENDPOINT = "https://api.openalex.org";
// OpenAlex asks callers to identify themselves for the "polite" pool.
const CONTACT = "scholarmap@alignxdigital.com";
const FETCH_TIMEOUT_MS = 10000;
// OpenAlex allows at most 50 values in one OR-filter.
const MAX_IDS_PER_FILTER = 50;

const WORK_FIELDS = [
  "id",
  "doi",
  "display_name",
  "publication_year",
  "cited_by_count",
  "authorships",
  "abstract_inverted_index",
  "primary_location",
  "referenced_works",
].join(",");

interface OpenAlexWork {
  id?: string;
  doi?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  cited_by_count?: number | null;
  authorships?: { author?: { display_name?: string | null } }[];
  abstract_inverted_index?: Record<string, number[]> | null;
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  referenced_works?: string[];
}

const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch OpenAlex JSON with polite-pool identity and retries.
 * Cloudflare Worker egress IPs are often rate-limited (429); honor
 * Retry-After and fall back to exponential backoff before failing.
 */
async function fetchJson<T>(path: string, params: URLSearchParams): Promise<T> {
  params.set("mailto", CONTACT);
  const url = `${OPENALEX_ENDPOINT}${path}?${params.toString()}`;
  const headers = { "User-Agent": `ScholarMap/1.0 (mailto:${CONTACT})` };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const resp = await fetch(url, { headers, signal: controller.signal });
      if (resp.status === 429 || resp.status >= 500) {
        lastError = new Error(`OpenAlex responded ${resp.status}`);
        const retryAfterHeader = resp.headers.get("retry-after");
        const retryAfter = retryAfterHeader != null ? Number(retryAfterHeader) : NaN;
        const delayMs = Number.isFinite(retryAfter)
          ? Math.max(0, retryAfter * 1000)
          : 400 * 2 ** attempt;
        await sleep(delayMs);
        continue;
      }
      if (!resp.ok) throw new Error(`OpenAlex responded ${resp.status}`);
      return (await resp.json()) as T;
    } catch (err) {
      // Non-retryable HTTP errors (already thrown above for non-429/5xx) rethrow.
      if (err instanceof Error && err.message.startsWith("OpenAlex responded")) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      await sleep(400 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error("OpenAlex request failed");
}

/** "https://openalex.org/W123" → "W123" (already-short ids pass through). */
export function shortWorkId(id: string): string {
  const m = /(W\d+)$/i.exec(id.trim());
  return m ? m[1].toUpperCase() : id.trim();
}

/**
 * OpenAlex stores abstracts as an inverted index ({ word: [positions] })
 * for legal reasons; rebuild the plain text from it.
 */
export function reconstructAbstract(
  inverted: Record<string, number[]> | null | undefined,
): string {
  if (!inverted) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.filter(Boolean).join(" ").trim();
}

/** Extract a bare DOI ("10.xxxx/yyy") from raw text, DOI URLs, etc. */
export function extractDoi(input: string): string | null {
  const m = /\b(10\.\d{4,9}\/[^\s"'<>]+)/i.exec(input.trim());
  if (!m) return null;
  return m[1].replace(/[.,;)\]]+$/, "");
}

export function toMapPaper(work: OpenAlexWork): MapPaper {
  const authors = (work.authorships ?? [])
    .map((a) => a.author?.display_name ?? "")
    .filter(Boolean);
  const location = work.primary_location;
  return {
    id: shortWorkId(work.id ?? ""),
    title: work.display_name?.trim() || "Untitled",
    authors: authors.length ? authors : ["Unknown"],
    year: work.publication_year ?? 0,
    abstract:
      reconstructAbstract(work.abstract_inverted_index) || "No abstract available.",
    url: work.doi ?? location?.landing_page_url ?? location?.pdf_url ?? "",
    doi: work.doi ?? null,
    citations: work.cited_by_count ?? 0,
    venue: location?.source?.display_name ?? "",
    referencedWorks: (work.referenced_works ?? []).map(shortWorkId),
  };
}

/**
 * Resolve free-form input (DOI, DOI URL, OpenAlex id, or title text) to a
 * single work. Returns null when nothing matches.
 */
export async function resolveWork(input: string): Promise<MapPaper | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const doi = extractDoi(trimmed);
  const asId = /^(?:https?:\/\/openalex\.org\/)?W\d+$/i.test(trimmed)
    ? shortWorkId(trimmed)
    : null;

  if (doi || asId) {
    try {
      const work = await fetchJson<OpenAlexWork>(
        `/works/${asId ?? `doi:${doi}`}`,
        new URLSearchParams({ select: WORK_FIELDS }),
      );
      return toMapPaper(work);
    } catch {
      // Fall through to title search — the DOI may not be indexed.
    }
  }

  const data = await fetchJson<{ results?: OpenAlexWork[] }>(
    "/works",
    new URLSearchParams({
      search: trimmed,
      per_page: "1",
      select: WORK_FIELDS,
    }),
  );
  const first = data.results?.[0];
  return first ? toMapPaper(first) : null;
}

/**
 * Full-text search over OpenAlex works with optional language and
 * document-type filters (e.g. language:"tr", type:"dissertation").
 * This is what lets ScholarMap surface Turkish journal articles
 * (DergiPark DOIs are indexed by OpenAlex) and theses.
 */
export async function searchOpenAlexWorks(opts: {
  query: string;
  limit?: number;
  language?: string;
  type?: string;
}): Promise<MapPaper[]> {
  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 50);
  const params = new URLSearchParams({
    search: opts.query,
    per_page: String(limit),
    select: WORK_FIELDS,
  });
  const filters: string[] = [];
  if (opts.language && opts.language !== "all") filters.push(`language:${opts.language}`);
  if (opts.type && opts.type !== "all") filters.push(`type:${opts.type}`);
  if (filters.length > 0) params.set("filter", filters.join(","));

  const data = await fetchJson<{ results?: OpenAlexWork[] }>("/works", params);
  return (data.results ?? []).map(toMapPaper);
}

async function fetchWorksByIds(ids: string[], limit: number): Promise<MapPaper[]> {
  if (ids.length === 0) return [];
  const batch = ids.slice(0, MAX_IDS_PER_FILTER);
  const data = await fetchJson<{ results?: OpenAlexWork[] }>(
    "/works",
    new URLSearchParams({
      filter: `openalex:${batch.join("|")}`,
      sort: "cited_by_count:desc",
      per_page: String(Math.min(limit, MAX_IDS_PER_FILTER)),
      select: WORK_FIELDS,
    }),
  );
  return (data.results ?? []).map(toMapPaper);
}

async function fetchCitingWorks(id: string, limit: number): Promise<MapPaper[]> {
  const data = await fetchJson<{ results?: OpenAlexWork[] }>(
    "/works",
    new URLSearchParams({
      filter: `cites:${id}`,
      sort: "cited_by_count:desc",
      per_page: String(limit),
      select: WORK_FIELDS,
    }),
  );
  return (data.results ?? []).map(toMapPaper);
}

/** Draw an edge for every citation between two papers that are both in the graph. */
export function buildEdges(nodes: MapPaper[]): MapEdge[] {
  const present = new Set(nodes.map((n) => n.id));
  const edges: MapEdge[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    for (const ref of node.referencedWorks) {
      const key = `${node.id}->${ref}`;
      if (present.has(ref) && ref !== node.id && !seen.has(key)) {
        seen.add(key);
        edges.push({ source: node.id, target: ref });
      }
    }
  }
  return edges;
}

/**
 * Build a citation graph around one paper: the paper itself, its most-cited
 * references, and the most-cited works that cite it.
 */
export async function fetchCitationGraph(opts: {
  center: MapPaper;
  refLimit?: number;
  citedByLimit?: number;
}): Promise<CitationGraph> {
  const { center } = opts;
  const refLimit = Math.min(Math.max(opts.refLimit ?? 20, 1), MAX_IDS_PER_FILTER);
  const citedByLimit = Math.min(Math.max(opts.citedByLimit ?? 20, 0), MAX_IDS_PER_FILTER);

  const errors: string[] = [];
  const [refsResult, citingResult] = await Promise.allSettled([
    fetchWorksByIds(center.referencedWorks, refLimit),
    citedByLimit > 0 ? fetchCitingWorks(center.id, citedByLimit) : Promise.resolve([]),
  ]);

  const refs = refsResult.status === "fulfilled" ? refsResult.value : [];
  if (refsResult.status === "rejected") {
    errors.push(`references: ${String(refsResult.reason?.message ?? refsResult.reason)}`);
  }
  const citing = citingResult.status === "fulfilled" ? citingResult.value : [];
  if (citingResult.status === "rejected") {
    errors.push(`citations: ${String(citingResult.reason?.message ?? citingResult.reason)}`);
  }

  const byId = new Map<string, MapPaper>();
  for (const paper of [center, ...refs, ...citing]) {
    if (!byId.has(paper.id)) byId.set(paper.id, paper);
  }
  const nodes = [...byId.values()];

  return { center: center.id, nodes, edges: buildEdges(nodes), errors };
}
