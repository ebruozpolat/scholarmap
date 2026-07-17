import { describe, expect, it, vi } from "vitest";
import {
  buildPrompt,
  extractCitedIndices,
  formatSources,
  synthesizeLiterature,
  workersAiChatCompleter,
  SYNTHESIS_MODEL,
  type SynthesisPaper,
} from "./synthesis";

function paper(partial: Partial<SynthesisPaper> & { title: string }): SynthesisPaper {
  return {
    authors: ["Ada Lovelace"],
    year: 2020,
    abstract: "We propose a method for tumor detection using deep learning.",
    url: "https://example.com/p",
    ...partial,
  };
}

describe("formatSources / buildPrompt", () => {
  it("numbers papers and truncates long abstracts", () => {
    const long = "x".repeat(800);
    const sources = formatSources([
      paper({ title: "Paper A", abstract: long }),
      paper({ title: "Paper B", year: 2021 }),
    ]);
    expect(sources).toContain("[1] Paper A");
    expect(sources).toContain("[2] Paper B");
    expect(sources).toContain("…");
    expect(sources.length).toBeLessThan(800 * 2);
  });

  it("embeds the user question and system rules", () => {
    const { system, user } = buildPrompt(
      [paper({ title: "A" }), paper({ title: "B" })],
      "tümör tespiti nasıl ilerliyor?",
    );
    expect(system).toContain("ONLY the information");
    expect(user).toContain("tümör tespiti nasıl ilerliyor?");
    expect(user).toContain("[1] A");
    expect(user).toContain("[2] B");
  });
});

describe("extractCitedIndices", () => {
  it("collects unique in-range markers", () => {
    expect(extractCitedIndices("Findings [1] and [3][1] vs [99].", 3)).toEqual([
      1, 3,
    ]);
  });

  it("returns empty when no markers", () => {
    expect(extractCitedIndices("no citations here", 5)).toEqual([]);
  });
});

describe("synthesizeLiterature", () => {
  it("returns markdown + citations from the completer", async () => {
    const complete = vi.fn(async () => "Overview of DL tumor work [1]. Gap remains [2].");
    const papers = [
      paper({ title: "DL Tumors", url: "https://a.example" }),
      paper({ title: "MRI Seg", year: 2021, url: "https://b.example" }),
    ];
    const result = await synthesizeLiterature(papers, complete, {
      question: "summarize",
    });
    expect(complete).toHaveBeenCalledOnce();
    expect(result.markdown).toContain("[1]");
    expect(result.citedIndices).toEqual([1, 2]);
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0].url).toBe("https://a.example");
    expect(result.model).toBe(SYNTHESIS_MODEL);
    expect(result.paperCount).toBe(2);
  });

  it("exposes full source list when the model omits markers", async () => {
    const complete = async () => "A vague summary with no markers.";
    const result = await synthesizeLiterature(
      [paper({ title: "A" }), paper({ title: "B" })],
      complete,
    );
    expect(result.citedIndices).toEqual([]);
    expect(result.citations).toHaveLength(2);
  });

  it("rejects too few or too many papers", async () => {
    const complete = async () => "x";
    await expect(
      synthesizeLiterature([paper({ title: "solo" })], complete),
    ).rejects.toThrow(/at least 2/i);
    const many = Array.from({ length: 13 }, (_, i) => paper({ title: `P${i}` }));
    await expect(synthesizeLiterature(many, complete)).rejects.toThrow(/at most 12/i);
  });

  it("rejects empty model output", async () => {
    await expect(
      synthesizeLiterature(
        [paper({ title: "A" }), paper({ title: "B" })],
        async () => "   ",
      ),
    ).rejects.toThrow(/empty/i);
  });
});

describe("workersAiChatCompleter", () => {
  it("returns null when no binding is present", () => {
    expect(workersAiChatCompleter(undefined)).toBeNull();
  });

  it("adapts a Workers AI binding into a ChatCompleter", async () => {
    const ai = {
      run: vi.fn(async () => ({ response: "Cited synthesis [1]." })),
    };
    const complete = workersAiChatCompleter(ai);
    expect(complete).not.toBeNull();
    const text = await complete!({ system: "sys", user: "usr" });
    expect(text).toBe("Cited synthesis [1].");
    expect(ai.run).toHaveBeenCalledWith(
      SYNTHESIS_MODEL,
      expect.objectContaining({
        messages: [
          { role: "system", content: "sys" },
          { role: "user", content: "usr" },
        ],
      }),
    );
  });

  it("throws on a malformed Workers AI response", async () => {
    const ai = { run: vi.fn(async () => ({ notResponse: true })) };
    const complete = workersAiChatCompleter(ai);
    await expect(complete!({ system: "s", user: "u" })).rejects.toThrow();
  });
});
