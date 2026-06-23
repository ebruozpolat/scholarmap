// Live academic search across external sources (arXiv + Crossref).
// Uses only fetch + standard string parsing so it runs unchanged on both
// the Node server and Cloudflare Workers (no DOMParser / Node-only deps).

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

export type LiveSource = "all" | "arxiv" | "scholar";

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

export async function searchLive(opts: {
  query: string;
  source?: LiveSource;
  limit?: number;
}): Promise<{ papers: LivePaper[]; sources: string[]; errors: string[] }> {
  const query = opts.query.trim();
  const source = opts.source ?? "all";
  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 50);

  if (!query) return { papers: [], sources: [], errors: [] };

  const tasks: { name: string; run: Promise<LivePaper[]> }[] = [];
  if (source === "all" || source === "arxiv") {
    tasks.push({ name: "arXiv", run: searchArxiv(query, limit) });
  }
  if (source === "all" || source === "scholar") {
    tasks.push({ name: "Google Scholar", run: searchCrossref(query, limit) });
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

  return { papers: dedupeByTitle(collected), sources, errors };
}
