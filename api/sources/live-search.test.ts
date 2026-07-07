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

  it("keeps results from healthy sources when one source fails", async () => {
    mockFetch((url) =>
      url.includes("arxiv")
        ? new Response("upstream down", { status: 503 })
        : Response.json(CROSSREF_JSON),
    );
    const { papers, sources, errors } = await searchLive({ query: "attention", source: "all" });
    expect(sources).toEqual(["Google Scholar"]);
    expect(papers.length).toBeGreaterThan(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("arXiv");
  });
});
