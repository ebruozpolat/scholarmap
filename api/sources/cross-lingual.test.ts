import { describe, expect, it } from "vitest";
import { expandQuery, looksTurkish, normalizeTr } from "./cross-lingual";

describe("normalizeTr", () => {
  it("strips common inflectional suffixes", () => {
    expect(normalizeTr("öğrenmeyi")).toBe("öğrenme");
    expect(normalizeTr("ağlar")).toBe("ağ");
    expect(normalizeTr("tümörler")).toBe("tümör");
  });

  it("leaves short words untouched", () => {
    expect(normalizeTr("ve")).toBe("ve");
    expect(normalizeTr("ağ")).toBe("ağ");
  });
});

describe("looksTurkish", () => {
  it("detects Turkish by special characters", () => {
    expect(looksTurkish("derin öğrenme")).toBe(true);
    expect(looksTurkish("tümör tespiti")).toBe(true);
  });

  it("detects Turkish by stopwords", () => {
    expect(looksTurkish("kanser ve tedavi")).toBe(true);
  });

  it("treats plain English as non-Turkish", () => {
    expect(looksTurkish("deep learning tumor detection")).toBe(false);
  });
});

describe("expandQuery", () => {
  it("translates a Turkish query and prepends English terms", () => {
    const result = expandQuery("derin öğrenme ile tümör tespiti");
    expect(result.translated).toBe(true);
    expect(result.expandedQuery).toContain("deep learning");
    expect(result.expandedQuery).toContain("tumor detection");
    // Original query is retained so Turkish matches still surface.
    expect(result.expandedQuery).toContain("derin öğrenme");
    const en = result.translations.map((t) => t.en);
    expect(en).toContain("deep learning");
    expect(en).toContain("tumor detection");
  });

  it("prefers the longest phrase match", () => {
    const result = expandQuery("meme kanseri teşhisi");
    const en = result.translations.map((t) => t.en);
    expect(en).toContain("breast cancer");
    // Should NOT also emit the single-word "cancer" for the same span.
    expect(en).not.toContain("cancer");
  });

  it("dedupes repeated English terms", () => {
    const result = expandQuery("kanser ve kanser tedavisi");
    const cancerHits = result.translations.filter((t) => t.en === "cancer");
    expect(cancerHits).toHaveLength(1);
  });

  it("passes English queries through unchanged", () => {
    const result = expandQuery("deep learning tumor detection");
    expect(result.translated).toBe(false);
    expect(result.expandedQuery).toBe("deep learning tumor detection");
    expect(result.translations).toEqual([]);
  });

  it("does not translate when no dictionary term matches", () => {
    const result = expandQuery("İzmir'de yerel tarih");
    expect(result.translated).toBe(false);
  });

  it("handles inflected forms via normalization", () => {
    const result = expandQuery("yapay zeka uygulamaları");
    const en = result.translations.map((t) => t.en);
    expect(en).toContain("artificial intelligence");
  });

  it("covers newer ML / IR terms from the expanded dictionary", () => {
    const result = expandQuery("çok dilli bilgi erişimi ve duygu analizi");
    const en = result.translations.map((t) => t.en);
    expect(en).toContain("multilingual");
    expect(en).toContain("information retrieval");
    expect(en).toContain("sentiment analysis");
  });
});
