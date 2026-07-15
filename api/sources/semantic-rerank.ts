// Optional semantic reranking of search results using multilingual
// embeddings. This is the "true" semantic layer: it scores each paper by
// cosine similarity between the query embedding and the paper's
// title+abstract embedding, so conceptually-related work surfaces even when
// the keywords differ.
//
// The embedder is injected (an `Embedder`), so this module is pure and
// unit-testable without any network. On Cloudflare Workers the embedder is
// backed by Workers AI (@cf/baai/bge-m3, multilingual); when no AI binding
// is present the caller simply skips reranking and keeps keyword order.

import type { LivePaper } from "./live-search";

/** Maps a batch of texts to unit-comparable embedding vectors. */
export type Embedder = (texts: string[]) => Promise<number[][]>;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function paperText(p: LivePaper): string {
  // Keep it bounded — embedding models truncate, and abstracts vary wildly.
  return `${p.title}. ${p.abstract}`.slice(0, 1200);
}

export interface RerankedPaper extends LivePaper {
  similarity: number;
}

/**
 * Reorder papers by semantic similarity to the query. Embeds the query and
 * all papers in a single batch, then sorts descending by cosine similarity.
 * On any embedder failure the original order is returned unchanged (with
 * similarity 0) so search never hard-fails on the optional path.
 */
export async function rerankBySimilarity(
  query: string,
  papers: LivePaper[],
  embed: Embedder,
): Promise<{ papers: RerankedPaper[]; reranked: boolean }> {
  if (papers.length === 0) {
    return { papers: [], reranked: false };
  }
  try {
    const vectors = await embed([query, ...papers.map(paperText)]);
    const queryVec = vectors[0];
    if (!queryVec || vectors.length !== papers.length + 1) {
      throw new Error("embedding count mismatch");
    }
    const scored = papers.map((p, idx) => ({
      ...p,
      similarity: cosineSimilarity(queryVec, vectors[idx + 1]),
    }));
    scored.sort((a, b) => b.similarity - a.similarity);
    return { papers: scored, reranked: true };
  } catch {
    return {
      papers: papers.map((p) => ({ ...p, similarity: 0 })),
      reranked: false,
    };
  }
}

// ── Workers AI adapter ──────────────────────────────────────────────────
// Minimal structural type for the Workers AI binding so this compiles
// against Node lib types without pulling in @cloudflare/workers-types.
/**
 * Structural Workers AI binding. Inputs/outputs vary by model
 * (embeddings vs chat); callers narrow the response shape.
 */
export interface WorkersAiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

export const EMBEDDING_MODEL = "@cf/baai/bge-m3";

/** Build an Embedder from a Workers AI binding, or null when absent. */
export function workersAiEmbedder(ai: WorkersAiBinding | undefined): Embedder | null {
  if (!ai || typeof ai.run !== "function") return null;
  return async (texts: string[]) => {
    const result = await ai.run(EMBEDDING_MODEL, { text: texts });
    const data = (result as { data?: number[][] } | null)?.data;
    if (!Array.isArray(data)) throw new Error("unexpected Workers AI response");
    return data;
  };
}
