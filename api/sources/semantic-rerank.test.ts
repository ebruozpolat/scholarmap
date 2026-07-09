import { describe, expect, it, vi } from "vitest";
import {
  cosineSimilarity,
  rerankBySimilarity,
  workersAiEmbedder,
  type Embedder,
} from "./semantic-rerank";
import type { LivePaper } from "./live-search";

function paper(title: string): LivePaper {
  return {
    title,
    authors: ["A"],
    year: 2020,
    abstract: title,
    url: "",
    citations: 0,
    source: "OpenAlex",
    venue: "",
  };
}

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors and 0 for orthogonal", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns 0 for mismatched or empty vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
  });
});

describe("rerankBySimilarity", () => {
  // Fake embedder: query embeds to [1,0]; papers embed by a marker so we
  // control their similarity to the query deterministically.
  const embed: Embedder = async (texts) =>
    texts.map((t) => (t.includes("MATCH") ? [1, 0] : [0, 1]));

  it("orders the most similar paper first", async () => {
    const papers = [paper("unrelated topic"), paper("a MATCH paper")];
    const { papers: out, reranked } = await rerankBySimilarity("MATCH", papers, embed);
    expect(reranked).toBe(true);
    expect(out[0].title).toBe("a MATCH paper");
    expect(out[0].similarity).toBeGreaterThan(out[1].similarity);
  });

  it("keeps original order and flags failure when the embedder throws", async () => {
    const failing: Embedder = async () => {
      throw new Error("no AI binding");
    };
    const papers = [paper("first"), paper("second")];
    const { papers: out, reranked } = await rerankBySimilarity("q", papers, failing);
    expect(reranked).toBe(false);
    expect(out.map((p) => p.title)).toEqual(["first", "second"]);
  });

  it("returns empty for no papers without calling the embedder", async () => {
    const spy = vi.fn();
    const { papers, reranked } = await rerankBySimilarity("q", [], spy as unknown as Embedder);
    expect(papers).toEqual([]);
    expect(reranked).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("workersAiEmbedder", () => {
  it("returns null when no binding is present", () => {
    expect(workersAiEmbedder(undefined)).toBeNull();
  });

  it("adapts a Workers AI binding into an Embedder", async () => {
    const ai = {
      run: vi.fn(async () => ({ data: [[0.1, 0.2]] })),
    };
    const embed = workersAiEmbedder(ai);
    expect(embed).not.toBeNull();
    const vectors = await embed!(["hello"]);
    expect(vectors).toEqual([[0.1, 0.2]]);
    expect(ai.run).toHaveBeenCalledWith("@cf/baai/bge-m3", { text: ["hello"] });
  });

  it("throws on a malformed Workers AI response", async () => {
    const ai = { run: vi.fn(async () => ({ notData: true })) };
    const embed = workersAiEmbedder(ai as never);
    await expect(embed!(["x"])).rejects.toThrow();
  });
});
