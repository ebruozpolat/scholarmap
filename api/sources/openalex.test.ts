import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildEdges,
  extractDoi,
  fetchCitationGraph,
  reconstructAbstract,
  resolveWork,
  shortWorkId,
  toMapPaper,
  type MapPaper,
} from "./openalex";

const CENTER_WORK = {
  id: "https://openalex.org/W2741809807",
  doi: "https://doi.org/10.48550/arxiv.1706.03762",
  display_name: "Attention Is All You Need",
  publication_year: 2017,
  cited_by_count: 100000,
  authorships: [
    { author: { display_name: "Ashish Vaswani" } },
    { author: { display_name: "Noam Shazeer" } },
  ],
  abstract_inverted_index: {
    The: [0],
    dominant: [1],
    models: [2],
    are: [3],
    recurrent: [4],
  },
  primary_location: {
    landing_page_url: "https://arxiv.org/abs/1706.03762",
    source: { display_name: "arXiv" },
  },
  referenced_works: ["https://openalex.org/W100", "https://openalex.org/W200"],
};

const REF_WORK = {
  id: "https://openalex.org/W100",
  display_name: "Neural Machine Translation",
  publication_year: 2014,
  cited_by_count: 30000,
  authorships: [{ author: { display_name: "Dzmitry Bahdanau" } }],
  referenced_works: [],
};

const CITING_WORK = {
  id: "https://openalex.org/W300",
  display_name: "BERT",
  publication_year: 2019,
  cited_by_count: 80000,
  authorships: [{ author: { display_name: "Jacob Devlin" } }],
  referenced_works: ["https://openalex.org/W2741809807", "https://openalex.org/W100"],
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

describe("shortWorkId", () => {
  it("shortens OpenAlex URLs and passes short ids through", () => {
    expect(shortWorkId("https://openalex.org/W123")).toBe("W123");
    expect(shortWorkId("W456")).toBe("W456");
    expect(shortWorkId("w789")).toBe("W789");
  });
});

describe("extractDoi", () => {
  it("finds bare DOIs, DOI URLs, and strips trailing punctuation", () => {
    expect(extractDoi("10.1038/nature14539")).toBe("10.1038/nature14539");
    expect(extractDoi("https://doi.org/10.1038/nature14539.")).toBe(
      "10.1038/nature14539",
    );
    expect(extractDoi("attention is all you need")).toBeNull();
  });
});

describe("reconstructAbstract", () => {
  it("rebuilds text from an inverted index", () => {
    expect(
      reconstructAbstract({ world: [1], Hello: [0], again: [2, 3] }),
    ).toBe("Hello world again again");
  });

  it("returns empty string for missing input", () => {
    expect(reconstructAbstract(null)).toBe("");
    expect(reconstructAbstract(undefined)).toBe("");
  });
});

describe("toMapPaper", () => {
  it("maps an OpenAlex work to a MapPaper", () => {
    const paper = toMapPaper(CENTER_WORK);
    expect(paper).toMatchObject({
      id: "W2741809807",
      title: "Attention Is All You Need",
      authors: ["Ashish Vaswani", "Noam Shazeer"],
      year: 2017,
      citations: 100000,
      venue: "arXiv",
      url: "https://doi.org/10.48550/arxiv.1706.03762",
      referencedWorks: ["W100", "W200"],
    });
    expect(paper.abstract).toBe("The dominant models are recurrent");
  });

  it("fills defaults for sparse works", () => {
    const paper = toMapPaper({ id: "https://openalex.org/W1" });
    expect(paper).toMatchObject({
      id: "W1",
      title: "Untitled",
      authors: ["Unknown"],
      abstract: "No abstract available.",
      citations: 0,
      referencedWorks: [],
    });
  });
});

describe("buildEdges", () => {
  it("only draws edges between papers present in the graph", () => {
    const nodes: MapPaper[] = [
      toMapPaper(CENTER_WORK),
      toMapPaper(REF_WORK),
      toMapPaper(CITING_WORK),
    ];
    const edges = buildEdges(nodes);
    expect(edges).toContainEqual({ source: "W2741809807", target: "W100" });
    expect(edges).toContainEqual({ source: "W300", target: "W2741809807" });
    expect(edges).toContainEqual({ source: "W300", target: "W100" });
    // W200 is referenced but not in the node set.
    expect(edges.some((e) => e.target === "W200")).toBe(false);
  });
});

describe("resolveWork", () => {
  it("resolves a DOI directly", async () => {
    mockFetch((url) => {
      expect(url).toContain("/works/doi:10.48550");
      return Response.json(CENTER_WORK);
    });
    const paper = await resolveWork("https://doi.org/10.48550/arxiv.1706.03762");
    expect(paper?.id).toBe("W2741809807");
  });

  it("falls back to title search for free text", async () => {
    mockFetch((url) => {
      expect(url).toContain("search=");
      return Response.json({ results: [CENTER_WORK] });
    });
    const paper = await resolveWork("attention is all you need");
    expect(paper?.title).toBe("Attention Is All You Need");
  });

  it("returns null when nothing matches", async () => {
    mockFetch(() => Response.json({ results: [] }));
    expect(await resolveWork("zzz no such paper")).toBeNull();
  });
});

describe("fetchCitationGraph", () => {
  it("assembles center, references, and citing works with edges", async () => {
    mockFetch((url) => {
      if (url.includes("filter=cites")) {
        return Response.json({ results: [CITING_WORK] });
      }
      expect(url).toContain("filter=openalex");
      return Response.json({ results: [REF_WORK] });
    });
    const graph = await fetchCitationGraph({ center: toMapPaper(CENTER_WORK) });
    expect(graph.center).toBe("W2741809807");
    expect(graph.nodes.map((n) => n.id).sort()).toEqual([
      "W100",
      "W2741809807",
      "W300",
    ]);
    expect(graph.edges).toContainEqual({ source: "W2741809807", target: "W100" });
    expect(graph.errors).toEqual([]);
  });

  it("keeps partial results when one request fails", async () => {
    mockFetch((url) => {
      if (url.includes("filter=cites")) {
        return new Response("upstream down", { status: 503 });
      }
      return Response.json({ results: [REF_WORK] });
    });
    const graph = await fetchCitationGraph({ center: toMapPaper(CENTER_WORK) });
    expect(graph.nodes.map((n) => n.id)).toContain("W100");
    expect(graph.errors).toHaveLength(1);
    expect(graph.errors[0]).toContain("citations");
  });
});
