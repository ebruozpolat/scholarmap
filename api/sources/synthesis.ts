// LLM-powered literature synthesis.
//
// Given a set of papers the user selected, produce a coherent, source-cited
// synthesis of the literature — every claim grounded ONLY in the provided
// abstracts, with inline [n] citations back to the numbered papers. This is a
// retrieval-augmented (RAG) design: the papers ARE the retrieval context, so
// the model has no license to introduce outside facts.
//
// Uses only fetch against the Anthropic Messages API, matching the rest of the
// api/sources layer (no Node-only deps), so it runs unchanged on Cloudflare
// Workers and the Node target. The API key is supplied by the caller and never
// stored.

export interface SynthesisPaper {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url?: string;
}

export interface SynthesisResult {
  /** The synthesis text (Markdown, Turkish by default) with inline [n] cites. */
  synthesis: string;
  /** 1-based indices of the papers actually cited, in ascending order. */
  citedIndices: number[];
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

// Sonnet 5: near-Opus quality on synthesis at ~half the cost. Thinking is
// disabled to keep latency and per-call cost predictable for the MVP (the
// cost model assumes no thinking tokens); can be raised to adaptive later.
export const SYNTHESIS_MODEL = "claude-sonnet-5";
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_PAPERS = 30;
const MAX_ABSTRACT_CHARS = 1400;
const MAX_OUTPUT_TOKENS = 2048;
const FETCH_TIMEOUT_MS = 45000;

const SYSTEM_PROMPT = `Sen bir akademik literatür sentezi asistanısın. Sana numaralandırılmış bir makale listesi (başlık, yazarlar, yıl, özet) verilir.

Görevin, bu makaleleri tek ve tutarlı bir literatür özetinde birleştirmek. Kurallar:
- SADECE verilen özetlerdeki bilgilere dayan. Özetlerde olmayan hiçbir olguyu, sayıyı veya iddiayı ekleme; dış bilgi veya varsayım kullanma.
- Her iddiayı, ilgili makaleye [n] biçiminde satır içi atıfla gerekçelendir (n, listedeki makale numarasıdır). Bir cümle birden çok makaleye dayanıyorsa [1][3] gibi birden çok atıf ver.
- Ortak temaları, uzlaşıları ve çelişkileri belirt; kronolojik veya kavramsal bir akış kur.
- Özetler bir sonucu desteklemek için yetersizse, bunu açıkça söyle — uydurma.
- Türkçe yaz (kullanıcı başka bir dilde soru sorduysa o dilde yaz). Akademik ama anlaşılır bir üslup kullan. Markdown başlıkları ve paragraflar kullanabilirsin.`;

interface AnthropicContentBlock {
  type: string;
  text?: string;
}
interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
  stop_reason?: string;
}

function formatPaper(paper: SynthesisPaper, index: number): string {
  const authors = paper.authors.slice(0, 6).join(", ") || "Bilinmeyen";
  const et = paper.authors.length > 6 ? " ve diğerleri" : "";
  const abstract = paper.abstract.slice(0, MAX_ABSTRACT_CHARS);
  return `[${index}] ${paper.title} (${authors}${et}, ${paper.year})\nÖzet: ${abstract}`;
}

export function buildPrompt(
  papers: SynthesisPaper[],
  question?: string,
): { system: string; user: string } {
  const list = papers.map((p, i) => formatPaper(p, i + 1)).join("\n\n");
  const focus = question?.trim()
    ? `Kullanıcının odak sorusu: "${question.trim()}"\nSentezi bu soruya cevap verecek şekilde yönlendir.\n\n`
    : "";
  return {
    system: SYSTEM_PROMPT,
    user: `${focus}Aşağıdaki ${papers.length} makaleyi sentezle:\n\n${list}`,
  };
}

/** Collect the distinct, in-range [n] citation numbers used in the text. */
export function extractCitedIndices(text: string, paperCount: number): number[] {
  const found = new Set<number>();
  const re = /\[(\d{1,3})\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = Number(m[1]);
    if (n >= 1 && n <= paperCount) found.add(n);
  }
  return [...found].sort((a, b) => a - b);
}

export async function synthesize(opts: {
  papers: SynthesisPaper[];
  apiKey: string;
  question?: string;
  model?: string;
}): Promise<SynthesisResult> {
  const papers = opts.papers.slice(0, MAX_PAPERS);
  if (papers.length < 2) {
    throw new Error("Sentez için en az 2 makale gerekli.");
  }
  const model = opts.model ?? SYNTHESIS_MODEL;
  const { system, user } = buildPrompt(papers, opts.question);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        thinking: { type: "disabled" },
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`Anthropic responded ${resp.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }

  const data = (await resp.json()) as AnthropicResponse;
  const synthesis = (data.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text as string)
    .join("")
    .trim();

  if (!synthesis) {
    throw new Error("Model boş yanıt döndürdü. Lütfen tekrar deneyin.");
  }

  return {
    synthesis,
    citedIndices: extractCitedIndices(synthesis, papers.length),
    model,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    },
  };
}
