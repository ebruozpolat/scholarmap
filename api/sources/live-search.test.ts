import { afterEach, describe, expect, it, vi } from "vitest";
import { searchLive } from "./live-search";

const ARXIV_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/1706.03762v7</id>
    <published>2017-06-12T17:57:34Z</published>
    <title>Attention Is All You Need</title>
    <summary>The dominant sequence transduction models are based on complex recurrent networks.</summary>
    <author><name>Ashish Vaswani</name></author>
    <author><name>Noam Shazeer</name></author>
    <arxiv:primary_category xmlns:arxiv="http://arxiv.org/schemas/atom" term="cs.CL"/>
  </entry>
</feed>`;

const CROSSREF_JSON = {
  message: {
    items: [
      {
        title: ["Attention Is All You Need"],
        author: [{ given: "Ashish", family: "Vaswani" }],
        issued: { "date-parts": [[2017]] },
        URL: "https://doi.org/10.5555/3295222",
        "is-referenced-by-count": 90000,
        "container-title": ["NeurIPS"],
      },
      {
        title: ["BERT: Pre-training of Deep Bidirectional Transformers"],
        author: [{ given: "Jacob", family: "Devlin" }],
        issued: { "date-parts": [[2019]] },
        URL: "https://doi.org/10.18653/v1/N19-1423",
        "is-referenced-by-count": 60000,
        "container-title": ["NAACL"],
      },
    ],
  },
};

const OPENALEX_JSON = {
  results: [
    {
      id: "https://openalex.org/W555",
      doi: "https://doi.org/10.16986/huje.2019",
      display_name: "Derin Öğrenme ile Türkçe Metin Sınıflandırma",
      publication_year: 2021,
      cited_by_count: 42,
      authorships: [{ author: { display_name: "Ayşe Yılmaz" } }],
      abstract_inverted_index: { Bu: [0], çalışmada: [1] },
      primary_location: { source: { display_name: "DergiPark" } },
      referenced_works: [],
    },
  ],
};

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => handler(String(input))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchLive", () => {
  it("returns empty results for a blank query without fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await searchLive({ query: "   " });
    expect(result).toEqual({ papers: [], sources: [], errors: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("parses arXiv XML entries", async () => {
    mockFetch((url) => {
      expect(url).toContain("export.arxiv.org");
      return new Response(ARXIV_XML, { status: 200 });
    });
    const { papers, sources, errors } = await searchLive({ query: "attention", source: "arxiv" });
    expect(errors).toEqual([]);
    expect(sources).toEqual(["arXiv"]);
    expect(papers).toHaveLength(1);
    expect(papers[0]).toMatchObject({
      title: "Attention Is All You Need",
      authors: ["Ashish Vaswani", "Noam Shazeer"],
      year: 2017,
      source: "arXiv",
      topic: "cs.CL",
      url: "http://arxiv.org/abs/1706.03762v7",
    });
  });

  it("parses Crossref items and fills defaults", async () => {
    mockFetch(() => Response.json(CROSSREF_JSON));
    const { papers, sources } = await searchLive({ query: "attention", source: "scholar" });
    expect(sources).toEqual(["Google Scholar"]);
    expect(papers).toHaveLength(2);
    expect(papers[0]).toMatchObject({
      title: "Attention Is All You Need",
      authors: ["Ashish Vaswani"],
      year: 2017,
      citations: 90000,
      venue: "NeurIPS",
      abstract: "No abstract available.",
    });
  });

  it("dedupes papers with the same title across sources", async () => {
    mockFetch((url) =>
      url.includes("arxiv")
        ? new Response(ARXIV_XML, { status: 200 })
        : Response.json(CROSSREF_JSON),
    );
    const { papers } = await searchLive({ query: "attention", source: "all" });
    const titles = papers.map((p) => p.title);
    expect(titles.filter((t) => t === "Attention Is All You Need")).toHaveLength(1);
    expect(titles).toContain("BERT: Pre-training of Deep Bidirectional Transformers");
  });

  it("parses OpenAlex results as a live source", async () => {
    mockFetch((url) => {
      expect(url).toContain("api.openalex.org");
      return Response.json(OPENALEX_JSON);
    });
    const { papers, sources } = await searchLive({ query: "derin öğrenme", source: "openalex" });
    expect(sources).toEqual(["OpenAlex"]);
    expect(papers[0]).toMatchObject({
      title: "Derin Öğrenme ile Türkçe Metin Sınıflandırma",
      authors: ["Ayşe Yılmaz"],
      year: 2021,
      citations: 42,
      source: "OpenAlex",
      venue: "DergiPark",
    });
  });

  it("routes to OpenAlex alone with language/type filters applied", async () => {
    const seen: string[] = [];
    mockFetch((url) => {
      seen.push(url);
      return Response.json(OPENALEX_JSON);
    });
    const { sources } = await searchLive({
      query: "makine öğrenmesi",
      source: "all",
      language: "tr",
      docType: "dissertation",
    });
    expect(sources).toEqual(["OpenAlex"]);
    expect(seen).toHaveLength(1);
    expect(decodeURIComponent(seen[0])).toContain("language:tr");
    expect(decodeURIComponent(seen[0])).toContain("type:dissertation");
  });

  it("expands a Turkish query with English terms in semantic mode", async () => {
    let capturedUrl = "";
    mockFetch((url) => {
      capturedUrl = url;
      return Response.json(OPENALEX_JSON);
    });
    const result = await searchLive({
      query: "derin öğrenme",
      source: "openalex",
      semantic: true,
    });
    expect(result.expansion?.translated).toBe(true);
    // URLSearchParams encodes spaces as "+"; normalize before asserting.
    expect(decodeURIComponent(capturedUrl).replace(/\+/g, " ")).toContain(
      "deep learning",
    );
    expect(result.reranked).toBe(false); // no embedder supplied
  });

  it("reranks results by similarity when an embedder is supplied", async () => {
    mockFetch(() =>
      Response.json({
        results: [
          { ...OPENALEX_JSON.results[0], display_name: "Alakasız Konu" },
          { ...OPENALEX_JSON.results[0], display_name: "MATCH eden makale" },
        ],
      }),
    );
    const embed = async (texts: string[]) =>
      texts.map((t) => (t.includes("MATCH") ? [1, 0] : [0, 1]));
    const result = await searchLive({
      query: "MATCH cancer",
      source: "openalex",
      semantic: true,
      embed,
    });
    expect(result.reranked).toBe(true);
    expect(result.papers[0].title).toBe("MATCH eden makale");
  });

  it("keeps results from healthy sources when others fail", async () => {
    mockFetch((url) =>
      url.includes("crossref")
        ? Response.json(CROSSREF_JSON)
        : new Response("upstream down", { status: 400 }),
    );
    const { papers, sources, errors } = await searchLive({ query: "attention", source: "all" });
    expect(sources).toEqual(["Google Scholar"]);
    expect(papers.length).toBeGreaterThan(0);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("arXiv");
    expect(errors[1]).toContain("OpenAlex");
  });

  it("falls back to arXiv/Crossref when OpenAlex-only TR filter is rate-limited", async () => {
    mockFetch((url) => {
      if (url.includes("openalex.org")) {
        return new Response("rate limited", {
          status: 429,
          headers: { "retry-after": "0" },
        });
      }
      if (url.includes("arxiv.org")) return new Response(ARXIV_XML, { status: 200 });
      if (url.includes("crossref")) return Response.json(CROSSREF_JSON);
      return new Response("missing", { status: 404 });
    });
    const result = await searchLive({
      query: "derin öğrenme",
      source: "all",
      language: "tr",
    });
    expect(result.papers.length).toBeGreaterThan(0);
    expect(result.sources).toEqual(expect.arrayContaining(["arXiv", "Google Scholar"]));
    expect(result.errors.some((e) => e.includes("rate-limited"))).toBe(true);
  });
});
