// Live academic search across external sources (arXiv + Crossref + OpenAlex).
// Uses only fetch + standard string parsing so it runs unchanged on both
// the Node server and Cloudflare Workers (no DOMParser / Node-only deps).

import { searchOpenAlexWorks } from "./openalex";
import { expandQuery, type Expansion } from "./cross-lingual";
import { rerankBySimilarity, type Embedder } from "./semantic-rerank";

export interface LivePaper {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url: string;
  citations: number;
  source: string;
  venue: string;
  topic?: string;
}

export type LiveSource = "all" | "arxiv" | "scholar" | "openalex";
export type LiveLanguage = "all" | "tr" | "en";
export type LiveDocType = "all" | "article" | "dissertation";

const ARXIV_ENDPOINT = "https://export.arxiv.org/api/query";
const CROSSREF_ENDPOINT = "https://api.crossref.org/works";
// Crossref asks callers to identify themselves for the "polite" pool.
const CONTACT = "scholarmap@alignxdigital.com";
const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, " ");
}

function clean(text: string): string {
  return decodeEntities(stripTags(text)).replace(/\s+/g, " ").trim();
}

function matchAll(source: string, regex: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source)) !== null) {
    out.push(m[1]);
  }
  return out;
}

// ── arXiv (Atom XML) ──
async function searchArxiv(query: string, limit: number): Promise<LivePaper[]> {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: "0",
    max_results: String(limit),
    sortBy: "relevance",
    sortOrder: "descending",
  });
  const resp = await fetchWithTimeout(`${ARXIV_ENDPOINT}?${params.toString()}`);
  if (!resp.ok) throw new Error(`arXiv responded ${resp.status}`);
  const xml = await resp.text();

  const entries = matchAll(xml, /<entry>([\s\S]*?)<\/entry>/g);
  return entries.map((entry) => {
    const titleRaw = /<title>([\s\S]*?)<\/title>/.exec(entry)?.[1] ?? "Untitled";
    const summaryRaw = /<summary>([\s\S]*?)<\/summary>/.exec(entry)?.[1] ?? "";
    const published = /<published>([\s\S]*?)<\/published>/.exec(entry)?.[1] ?? "";
    const authors = matchAll(entry, /<name>([\s\S]*?)<\/name>/g).map(clean);
    const idUrl = /<id>([\s\S]*?)<\/id>/.exec(entry)?.[1]?.trim() ?? "";
    const category = /<arxiv:primary_category[^>]*term="([^"]+)"/.exec(entry)?.[1];
    const year = Number(published.slice(0, 4)) || new Date().getFullYear();

    return {
      title: clean(titleRaw),
      authors: authors.length ? authors : ["Unknown"],
      year,
      abstract: clean(summaryRaw),
      url: idUrl,
      citations: 0, // arXiv does not expose citation counts
      source: "arXiv",
      venue: "arXiv",
      topic: category,
    };
  });
}

// ── Crossref (JSON) — broad cross-publisher coverage with citation counts ──
interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
}
interface CrossrefItem {
  title?: string[];
  author?: CrossrefAuthor[];
  abstract?: string;
  issued?: { "date-parts"?: number[][] };
  URL?: string;
  "is-referenced-by-count"?: number;
  "container-title"?: string[];
}

async function searchCrossref(query: string, limit: number): Promise<LivePaper[]> {
  const params = new URLSearchParams({
    query,
    rows: String(limit),
    select:
      "title,author,abstract,issued,URL,is-referenced-by-count,container-title",
    mailto: CONTACT,
  });
  const resp = await fetchWithTimeout(`${CROSSREF_ENDPOINT}?${params.toString()}`, {
    headers: { "User-Agent": `ScholarMap/1.0 (mailto:${CONTACT})` },
  });
  if (!resp.ok) throw new Error(`Crossref responded ${resp.status}`);
  const data = (await resp.json()) as { message?: { items?: CrossrefItem[] } };
  const items = data.message?.items ?? [];

  return items.map((item) => {
    const authors = (item.author ?? [])
      .map((a) => a.name ?? [a.given, a.family].filter(Boolean).join(" "))
      .filter((n): n is string => Boolean(n && n.trim()));
    const year = item.issued?.["date-parts"]?.[0]?.[0] ?? 0;

    return {
      title: clean(item.title?.[0] ?? "Untitled"),
      authors: authors.length ? authors : ["Unknown"],
      year: Number(year) || new Date().getFullYear(),
      abstract: item.abstract ? clean(item.abstract) : "No abstract available.",
      url: item.URL ?? "",
      citations: item["is-referenced-by-count"] ?? 0,
      // Labelled "Google Scholar" to match the existing UI source filter.
      source: "Google Scholar",
      venue: clean(item["container-title"]?.[0] ?? "Journal"),
    };
  });
}

// ── OpenAlex — 250M+ works incl. Turkish journals (DergiPark) and theses ──
async function searchOpenAlex(
  query: string,
  limit: number,
  language: LiveLanguage,
  docType: LiveDocType,
): Promise<LivePaper[]> {
  const works = await searchOpenAlexWorks({
    query,
    limit,
    language,
    type: docType,
  });
  return works.map((w) => ({
    title: w.title,
    authors: w.authors,
    year: w.year || new Date().getFullYear(),
    abstract: w.abstract,
    url: w.url,
    citations: w.citations,
    source: "OpenAlex",
    venue: w.venue || "Journal",
  }));
}

function dedupeByTitle(papers: LivePaper[]): LivePaper[] {
  const seen = new Set<string>();
  const out: LivePaper[] = [];
  for (const p of papers) {
    const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

export interface SearchLiveResult {
  papers: LivePaper[];
  sources: string[];
  errors: string[];
  /** Cross-lingual expansion applied to the query (semantic mode only). */
  expansion?: Expansion;
  /** Whether embedding-based reranking actually ran. */
  reranked?: boolean;
}

export async function searchLive(opts: {
  query: string;
  source?: LiveSource;
  limit?: number;
  language?: LiveLanguage;
  docType?: LiveDocType;
  /** Enable cross-lingual query expansion (TR → EN) and optional rerank. */
  semantic?: boolean;
  /** Optional embedder (Workers AI). When present, results are reranked. */
  embed?: Embedder;
}): Promise<SearchLiveResult> {
  const rawQuery = opts.query.trim();
  const source = opts.source ?? "all";
  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 50);
  const language = opts.language ?? "all";
  const docType = opts.docType ?? "all";
  const semantic = opts.semantic ?? false;

  if (!rawQuery) return { papers: [], sources: [], errors: [] };

  // In semantic mode, expand a Turkish query with English academic terms so
  // OpenAlex returns cross-lingual matches. English queries pass through.
  const expansion = semantic ? expandQuery(rawQuery) : undefined;
  const query = expansion?.expandedQuery || rawQuery;

  // Language and document-type filters are best served by OpenAlex
  // (DergiPark / theses). Prefer OpenAlex alone first; if it fails
  // (common 429 from shared Worker IPs), fall back to arXiv + Crossref
  // so the dashboard is never empty solely due to rate limits.
  const filtered = language !== "all" || docType !== "all";
  const wantOpenAlex = filtered || source === "all" || source === "openalex";
  const wantArxiv = !filtered && (source === "all" || source === "arxiv");
  const wantScholar = !filtered && (source === "all" || source === "scholar");

  const tasks: { name: string; run: Promise<LivePaper[]> }[] = [];
  if (wantArxiv) {
    tasks.push({ name: "arXiv", run: searchArxiv(query, limit) });
  }
  if (wantScholar) {
    tasks.push({ name: "Google Scholar", run: searchCrossref(query, limit) });
  }
  if (wantOpenAlex) {
    tasks.push({
      name: "OpenAlex",
      run: searchOpenAlex(query, limit, language, docType),
    });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.run));
  const collected: LivePaper[] = [];
  const sources: string[] = [];
  const errors: string[] = [];

  settled.forEach((res, i) => {
    if (res.status === "fulfilled") {
      collected.push(...res.value);
      sources.push(tasks[i].name);
    } else {
      errors.push(`${tasks[i].name}: ${String(res.reason?.message ?? res.reason)}`);
    }
  });

  // OpenAlex-only path (Türkçe / tez / OpenAlex filter) failed → broaden.
  if (
    collected.length === 0 &&
    filtered &&
    source !== "openalex" &&
    errors.some((e) => e.startsWith("OpenAlex:"))
  ) {
    const fallbackTasks: { name: string; run: Promise<LivePaper[]> }[] = [
      { name: "arXiv", run: searchArxiv(query, limit) },
      { name: "Google Scholar", run: searchCrossref(query, limit) },
    ];
    const fallbackSettled = await Promise.allSettled(fallbackTasks.map((t) => t.run));
    fallbackSettled.forEach((res, i) => {
      if (res.status === "fulfilled" && res.value.length > 0) {
        collected.push(...res.value);
        sources.push(fallbackTasks[i].name);
      } else if (res.status === "rejected") {
        errors.push(
          `${fallbackTasks[i].name}: ${String(res.reason?.message ?? res.reason)}`,
        );
      }
    });
    if (collected.length > 0) {
      errors.push(
        "OpenAlex rate-limited — showing arXiv/Crossref results without language/thesis filter.",
      );
    }
  }

  let papers = dedupeByTitle(collected);
  let reranked = false;

  // When an embedder is supplied, reorder by semantic similarity to the
  // original (user-typed) query — that carries the true intent, not the
  // keyword-expanded string. Falls back to keyword order on any failure.
  if (semantic && opts.embed && papers.length > 0) {
    const result = await rerankBySimilarity(rawQuery, papers, opts.embed);
    papers = result.papers;
    reranked = result.reranked;
  }

  return { papers, sources, errors, expansion, reranked };
}
