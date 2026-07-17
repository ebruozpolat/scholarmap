// Cited literature synthesis powered by Workers AI (no external LLM API key).
//
// Flow: selected papers (title + abstract + year) → numbered source pack →
// Llama via env.AI → markdown with [n] citations → structured citation list.
//
// Hallucination controls:
//  1. Model may ONLY use the provided abstracts (no outside knowledge).
//  2. Every factual claim must cite at least one [n].
//  3. Insufficient coverage → say so rather than invent.
//
// When the AI binding is absent the completer returns null and the router
// surfaces a clean PRECONDITION_FAILED — same degrade pattern as semantic
// rerank (feature optional, never hard-crashes search).

export interface SynthesisPaper {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url: string;
}

export interface SynthesisCitation {
  /** 1-based index matching [n] markers in the markdown. */
  index: number;
  title: string;
  url: string;
  year: number;
  authors: string[];
}

export interface SynthesisResult {
  markdown: string;
  citations: SynthesisCitation[];
  model: string;
  paperCount: number;
  /** Citation markers found in the model output (for faithfulness checks). */
  citedIndices: number[];
}

/** Injected LLM call — unit tests mock this; Workers AI adapts it. */
export type ChatCompleter = (args: {
  system: string;
  user: string;
}) => Promise<string>;

/** Default Workers AI model — cheap, 32k context, no external key. */
export const SYNTHESIS_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

export const MAX_PAPERS = 12;
export const MIN_PAPERS = 2;
/** Keep prompt under context budget; abstracts dominate token cost. */
export const MAX_ABSTRACT_CHARS = 600;

export const SYSTEM_PROMPT = `You are ScholarMap, an academic literature synthesizer.
You write a concise, structured synthesis of the papers the user provides.

STRICT RULES:
1. Use ONLY the information in the numbered Sources below. Do not invent findings, methods, or citations.
2. Every factual claim MUST end with a citation marker like [1] or [1][3] referring to those sources.
3. If the sources are insufficient to answer, say so explicitly instead of guessing.
4. Prefer Turkish when the user question is in Turkish; otherwise write in English.
5. Structure: short overview paragraph, then 3–6 bullet insights, then a one-sentence open-question or gap if supported by the sources.
6. Do not invent DOIs, years, or author names beyond what appears in Sources.
7. Never claim to have read the full paper — you only have titles and abstracts.`;

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function formatAuthors(authors: string[]): string {
  if (!authors.length) return "Unknown authors";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors[0]} et al.`;
}

/** Build the numbered source pack the model is allowed to use. */
export function formatSources(papers: SynthesisPaper[]): string {
  return papers
    .map((p, i) => {
      const n = i + 1;
      const abs = truncate(p.abstract || "(no abstract)", MAX_ABSTRACT_CHARS);
      return `[${n}] ${p.title} (${p.year}) — ${formatAuthors(p.authors)}\nAbstract: ${abs}`;
    })
    .join("\n\n");
}

export function buildPrompt(
  papers: SynthesisPaper[],
  question?: string,
): { system: string; user: string } {
  const sources = formatSources(papers);
  const focus =
    question?.trim() ||
    "Summarize the main findings, methods, and how these papers relate to each other.";
  const user = `Sources:\n${sources}\n\nUser question:\n${focus}\n\nWrite the synthesis now.`;
  return { system: SYSTEM_PROMPT, user };
}

/** Extract unique 1-based citation indices mentioned as [n] in text. */
export function extractCitedIndices(text: string, paperCount: number): number[] {
  const found = new Set<number>();
  for (const m of text.matchAll(/\[(\d+)\]/g)) {
    const n = Number(m[1]);
    if (Number.isInteger(n) && n >= 1 && n <= paperCount) found.add(n);
  }
  return [...found].sort((a, b) => a - b);
}

export function buildCitationList(
  papers: SynthesisPaper[],
  citedIndices: number[],
): SynthesisCitation[] {
  // Always return the full source list so the UI can link every [n];
  // mark which ones were actually referenced via citedIndices on the result.
  return papers.map((p, i) => ({
    index: i + 1,
    title: p.title,
    url: p.url,
    year: p.year,
    authors: p.authors,
  })).filter((c) => citedIndices.length === 0 || citedIndices.includes(c.index));
}

/**
 * Run cited synthesis. Pure aside from the injected completer.
 * Caller is responsible for paper count validation.
 */
export async function synthesizeLiterature(
  papers: SynthesisPaper[],
  complete: ChatCompleter,
  options: { question?: string; model?: string } = {},
): Promise<SynthesisResult> {
  if (papers.length < MIN_PAPERS) {
    throw new Error(`Select at least ${MIN_PAPERS} papers to synthesize.`);
  }
  if (papers.length > MAX_PAPERS) {
    throw new Error(`Select at most ${MAX_PAPERS} papers per synthesis.`);
  }

  const { system, user } = buildPrompt(papers, options.question);
  const markdown = (await complete({ system, user })).trim();
  if (!markdown) {
    throw new Error("Model returned an empty synthesis.");
  }

  const citedIndices = extractCitedIndices(markdown, papers.length);
  // Prefer citations that were actually used; if the model forgot markers,
  // still expose the full source list so the UI stays honest.
  const citations =
    citedIndices.length > 0
      ? buildCitationList(papers, citedIndices)
      : papers.map((p, i) => ({
          index: i + 1,
          title: p.title,
          url: p.url,
          year: p.year,
          authors: p.authors,
        }));

  return {
    markdown,
    citations,
    model: options.model ?? SYNTHESIS_MODEL,
    paperCount: papers.length,
    citedIndices,
  };
}

// ── Workers AI adapter ──────────────────────────────────────────────────

/**
 * Structural AI binding used by both embeddings and chat.
 * Inputs/outputs vary by model; callers cast results.
 */
export interface WorkersAiLlmBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

function extractResponseText(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const r = result as Record<string, unknown>;
  if (typeof r.response === "string") return r.response;
  if (typeof r.result === "string") return r.result;
  if (r.result && typeof r.result === "object") {
    const nested = r.result as Record<string, unknown>;
    if (typeof nested.response === "string") return nested.response;
  }
  return "";
}

/** Build a ChatCompleter from Workers AI, or null when absent. */
export function workersAiChatCompleter(
  ai: WorkersAiLlmBinding | undefined,
  model: string = SYNTHESIS_MODEL,
): ChatCompleter | null {
  if (!ai || typeof ai.run !== "function") return null;
  return async ({ system, user }) => {
    const result = await ai.run(model, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    });
    const text = extractResponseText(result).trim();
    if (!text) throw new Error("unexpected Workers AI LLM response");
    return text;
  };
}
