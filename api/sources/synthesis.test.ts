import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPrompt,
  extractCitedIndices,
  synthesize,
  SYNTHESIS_MODEL,
  type SynthesisPaper,
} from "./synthesis";

const PAPERS: SynthesisPaper[] = [
  {
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer"],
    year: 2017,
    abstract: "The dominant sequence transduction models are based on recurrence.",
    url: "https://arxiv.org/abs/1706.03762",
  },
  {
    title: "BERT",
    authors: ["Jacob Devlin"],
    year: 2019,
    abstract: "We introduce a new language representation model called BERT.",
  },
];

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown, init?: RequestInit) => handler(String(input), init)),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildPrompt", () => {
  it("numbers papers and includes titles, years, and abstracts", () => {
    const { system, user } = buildPrompt(PAPERS);
    expect(system).toContain("[n]");
    expect(user).toContain("[1] Attention Is All You Need");
    expect(user).toContain("[2] BERT");
    expect(user).toContain("2017");
    expect(user).toContain("BERT");
  });

  it("weaves in the focus question when provided", () => {
    const { user } = buildPrompt(PAPERS, "transformer verimliliği");
    expect(user).toContain("transformer verimliliği");
  });
});

describe("extractCitedIndices", () => {
  it("collects distinct in-range citations in ascending order", () => {
    expect(extractCitedIndices("Görüş [2] ve [1], ayrıca [1] tekrar.", 2)).toEqual([1, 2]);
  });

  it("drops out-of-range citation numbers", () => {
    expect(extractCitedIndices("Geçerli [1], geçersiz [9].", 2)).toEqual([1]);
  });
});

describe("synthesize", () => {
  it("sends a well-formed Anthropic request and parses the result", async () => {
    let capturedBody: Record<string, unknown> = {};
    let capturedHeaders: Record<string, string> = {};
    mockFetch((url, init) => {
      expect(url).toContain("api.anthropic.com");
      capturedHeaders = init?.headers as Record<string, string>;
      capturedBody = JSON.parse(String(init?.body));
      return Response.json({
        content: [{ type: "text", text: "Transformer'lar [1] BERT'e [2] öncülük etti." }],
        usage: { input_tokens: 1200, output_tokens: 300 },
        stop_reason: "end_turn",
      });
    });

    const result = await synthesize({ papers: PAPERS, apiKey: "sk-test" });

    expect(capturedHeaders["x-api-key"]).toBe("sk-test");
    expect(capturedHeaders["anthropic-version"]).toBe("2023-06-01");
    expect(capturedBody.model).toBe(SYNTHESIS_MODEL);
    expect(capturedBody.thinking).toEqual({ type: "disabled" });
    expect(result.synthesis).toContain("BERT");
    expect(result.citedIndices).toEqual([1, 2]);
    expect(result.usage).toEqual({ inputTokens: 1200, outputTokens: 300 });
  });

  it("rejects fewer than two papers without calling the API", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await expect(
      synthesize({ papers: [PAPERS[0]], apiKey: "sk-test" }),
    ).rejects.toThrow(/en az 2 makale/);
    expect(spy).not.toHaveBeenCalled();
  });

  it("surfaces upstream API errors", async () => {
    mockFetch(() => new Response("rate limited", { status: 429 }));
    await expect(
      synthesize({ papers: PAPERS, apiKey: "sk-test" }),
    ).rejects.toThrow(/429/);
  });

  it("throws on an empty model response", async () => {
    mockFetch(() => Response.json({ content: [], usage: {} }));
    await expect(
      synthesize({ papers: PAPERS, apiKey: "sk-test" }),
    ).rejects.toThrow(/boş yanıt/);
  });
});
