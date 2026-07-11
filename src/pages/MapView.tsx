import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import {
  ExternalLink,
  Loader2,
  Maximize2,
  Network,
  Search,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  CitationGraph,
  MapPaper,
} from "../../api/sources/openalex";

type NodeRole = "center" | "reference" | "citing";

interface GraphNode extends MapPaper {
  role: NodeRole;
}

interface GraphState {
  nodes: Map<string, GraphNode>;
  edges: Map<string, { source: string; target: string }>;
}

const ROLE_COLORS: Record<NodeRole, string> = {
  center: "#6366F1",
  reference: "#22C55E",
  citing: "#F59E0B",
};

const ROLE_LABELS: Record<NodeRole, string> = {
  center: "Searched paper",
  reference: "References (cited by it)",
  citing: "Citing papers",
};

const EXAMPLES = [
  "Attention Is All You Need",
  "10.1038/nature14539",
  "AlphaFold protein structure prediction",
];

function emptyGraph(): GraphState {
  return { nodes: new Map(), edges: new Map() };
}

/** Merge a fetched graph fragment into local state, assigning roles to new nodes. */
function mergeGraph(prev: GraphState, fragment: CitationGraph, isInitial: boolean): GraphState {
  const nodes = new Map(prev.nodes);
  const edges = new Map(prev.edges);

  // Which side of the expanded/center node is each new paper on?
  const referenceIds = new Set(
    fragment.edges.filter((e) => e.source === fragment.center).map((e) => e.target),
  );

  for (const paper of fragment.nodes) {
    if (nodes.has(paper.id)) continue;
    const role: NodeRole =
      isInitial && paper.id === fragment.center
        ? "center"
        : referenceIds.has(paper.id)
          ? "reference"
          : "citing";
    nodes.set(paper.id, { ...paper, role });
  }
  for (const edge of fragment.edges) {
    edges.set(`${edge.source}->${edge.target}`, edge);
  }
  return { nodes, edges };
}

function nodeSize(citations: number): number {
  return 9 + Math.log10(citations + 1) * 3.5;
}

/** Fit the whole graph, but never zoom in so far that nodes look huge. */
function fitGraph(cy: Core) {
  if (cy.elements().length === 0) return;
  cy.fit(undefined, 40);
  if (cy.zoom() > 1.2) {
    cy.zoom(1.2);
    cy.center();
  }
}

function toElements(graph: GraphState): ElementDefinition[] {
  const nodes: ElementDefinition[] = [...graph.nodes.values()].map((n) => ({
    data: {
      id: n.id,
      label: n.title.length > 42 ? `${n.title.slice(0, 40)}…` : n.title,
      color: ROLE_COLORS[n.role],
      size: nodeSize(n.citations),
      isCenter: n.role === "center" ? 1 : 0,
    },
  }));
  const edges: ElementDefinition[] = [...graph.edges.values()].map((e) => ({
    data: { id: `${e.source}->${e.target}`, source: e.source, target: e.target },
  }));
  return [...nodes, ...edges];
}

export default function MapView() {
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [graph, setGraph] = useState<GraphState>(emptyGraph);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [expandError, setExpandError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const utils = trpc.useUtils();

  const graphQuery = trpc.map.graph.useQuery(
    { query: submittedQuery },
    {
      enabled: submittedQuery.length > 0,
      staleTime: 10 * 60 * 1000,
      retry: 1,
    },
  );

  // Reset and load local graph state whenever a new search resolves.
  useEffect(() => {
    if (graphQuery.data) {
      setGraph(mergeGraph(emptyGraph(), graphQuery.data, true));
      setSelectedId(graphQuery.data.center);
      setExpandedIds(new Set([graphQuery.data.center]));
      setExpandError(null);
    }
  }, [graphQuery.data]);

  // Create the Cytoscape instance once.
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.3,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            width: "data(size)",
            height: "data(size)",
            label: "data(label)",
            color: "#8A8A98",
            "font-size": 9,
            "text-valign": "bottom",
            "text-margin-y": 6,
            "text-wrap": "wrap",
            "text-max-width": "120px",
            "border-width": 0,
          },
        },
        {
          selector: "node[isCenter = 1]",
          style: {
            "border-width": 3,
            "border-color": "#A5B4FC",
            color: "#F0F0F5",
            "font-weight": "bold",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#F0F0F5",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.2,
            "line-color": "#2E2E3A",
            "target-arrow-color": "#2E2E3A",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.8,
            "curve-style": "bezier",
          },
        },
      ],
    });
    cy.on("tap", "node", (event) => {
      setSelectedId(event.target.id() as string);
    });
    cy.on("tap", (event) => {
      if (event.target === cy) setSelectedId(null);
    });
    cyRef.current = cy;
    // Cytoscape doesn't watch its container: re-fit when the side panel
    // opens/closes or the window changes size.
    const observer = new ResizeObserver(() => {
      cy.resize();
      fitGraph(cy);
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // Sync local graph state into the Cytoscape canvas.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().remove();
    cy.add(toElements(graph));
    if (graph.nodes.size > 0) {
      cy.layout({
        name: "cose",
        animate: false,
        padding: 40,
        nodeRepulsion: () => 400000,
        idealEdgeLength: () => 110,
        nodeOverlap: 12,
      }).run();
      fitGraph(cy);
    }
  }, [graph]);

  const selected = selectedId ? (graph.nodes.get(selectedId) ?? null) : null;

  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setSearchInput(trimmed);
      setSelectedId(null);
      if (trimmed === submittedQuery) {
        // Same query again: the cached result won't re-trigger the load
        // effect, so rebuild the initial graph from it directly.
        if (graphQuery.data) {
          setGraph(mergeGraph(emptyGraph(), graphQuery.data, true));
          setSelectedId(graphQuery.data.center);
          setExpandedIds(new Set([graphQuery.data.center]));
        }
        return;
      }
      setGraph(emptyGraph());
      setSubmittedQuery(trimmed);
    },
    [submittedQuery, graphQuery.data],
  );

  const handleExpand = useCallback(
    async (id: string) => {
      setExpandingId(id);
      setExpandError(null);
      try {
        const fragment = await utils.map.expand.fetch({ id });
        setGraph((prev) => mergeGraph(prev, fragment, false));
        setExpandedIds((prev) => new Set(prev).add(id));
      } catch {
        setExpandError("Could not expand this paper. Please try again.");
      } finally {
        setExpandingId(null);
      }
    },
    [utils],
  );

  const hasGraph = graph.nodes.size > 0;
  const isLoading = submittedQuery.length > 0 && graphQuery.isFetching;

  const stats = useMemo(
    () => ({ papers: graph.nodes.size, links: graph.edges.size }),
    [graph],
  );

  return (
    <div className="flex h-full bg-[#08080C]">
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-8 py-3 border-b border-[#23232D] bg-[#08080C]/80 backdrop-blur-md h-14">
          <div>
            <h1 className="text-lg font-semibold text-[#F0F0F5]">Citation Map</h1>
            <p className="text-[11px] text-[#5A5A68]">
              Paste a DOI or title to map a paper's citation network
            </p>
          </div>
          {hasGraph && (
            <div className="flex items-center gap-2 text-[11px] text-[#5A5A68] font-mono">
              <span>{stats.papers} papers</span>
              <span>·</span>
              <span>{stats.links} citations</span>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="shrink-0 px-8 pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchInput);
            }}
            className="bg-[#0F0F14] border border-[#23232D] rounded-2xl p-4 hover:border-[#2E2E3A] focus-within:border-[#6366F1] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all"
          >
            <div className="flex items-center gap-3">
              <Search className="size-5 text-[#5A5A68] shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter a paper DOI or title, e.g. 10.1038/nature14539"
                className="flex-1 bg-transparent text-base text-[#F0F0F5] placeholder-[#5A5A68] outline-none"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !searchInput.trim()}
                className="h-8 bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs"
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Network className="size-3.5" />
                )}
                Map it
              </Button>
            </div>
          </form>
        </div>

        {/* Graph canvas */}
        <div className="flex-1 relative mx-8 my-4 rounded-2xl border border-[#23232D] bg-[#0F0F14] overflow-hidden">
          <div ref={containerRef} className="absolute inset-0" />

          {/* Legend */}
          {hasGraph && (
            <div className="absolute bottom-3 left-3 bg-[#16161D]/90 backdrop-blur border border-[#23232D] rounded-lg px-3 py-2 space-y-1 pointer-events-none">
              {(Object.keys(ROLE_COLORS) as NodeRole[]).map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: ROLE_COLORS[role] }}
                  />
                  <span className="text-[10px] text-[#8A8A98]">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              ))}
              <div className="text-[10px] text-[#5A5A68] pt-0.5">
                Arrow: cites → cited · Click a node for details
              </div>
            </div>
          )}

          {/* Empty / loading / error states */}
          {!hasGraph && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none">
              {isLoading ? (
                <>
                  <Loader2 className="size-10 text-[#6366F1] animate-spin mb-4" />
                  <p className="text-sm text-[#8A8A98]">
                    Building the citation map from OpenAlex…
                  </p>
                </>
              ) : graphQuery.isError && submittedQuery ? (
                <>
                  <X className="size-10 text-[#EF4444] opacity-60 mb-4" />
                  <p className="text-sm text-[#8A8A98] mb-1">
                    {graphQuery.error.message || "Could not build the map."}
                  </p>
                  <p className="text-xs text-[#5A5A68]">
                    Check the DOI or try a more specific title.
                  </p>
                </>
              ) : (
                <>
                  <Network className="size-12 text-[#5A5A68] opacity-50 mb-4" />
                  <p className="text-sm text-[#8A8A98] mb-1">
                    Map any paper's citation network
                  </p>
                  <p className="text-xs text-[#5A5A68] mb-4 max-w-md">
                    The searched paper sits in the center; its references and
                    the papers citing it orbit around it. Click any node to
                    read it or expand the map further.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pointer-events-auto">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        onClick={() => handleSearch(example)}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#8A8A98] bg-[#16161D] border border-[#23232D] hover:bg-[#1E1E28] hover:text-[#F0F0F5] transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Partial-data warnings from the API */}
          {hasGraph && (graphQuery.data?.errors.length ?? 0) > 0 && (
            <div className="absolute top-3 left-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg px-3 py-1.5 text-[10px] text-[#F59E0B]">
              Some sources were unavailable — the map may be incomplete.
            </div>
          )}
        </div>
      </div>

      {/* Details side panel */}
      {selected && (
        <div className="w-[320px] shrink-0 border-l border-[#23232D] bg-[#0F0F14] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 px-4 pt-4">
            <Badge
              variant="secondary"
              className="text-[10px] font-medium"
              style={{
                background: `${ROLE_COLORS[selected.role]}1A`,
                color: ROLE_COLORS[selected.role],
              }}
            >
              {ROLE_LABELS[selected.role]}
            </Badge>
            <button
              onClick={() => setSelectedId(null)}
              className="p-1 rounded hover:bg-[#1E1E28] transition-colors"
            >
              <X className="size-4 text-[#5A5A68]" />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3">
            <h2 className="text-sm font-semibold text-[#F0F0F5] leading-snug">
              {selected.title}
            </h2>

            <div className="text-xs text-[#8A8A98]">
              {selected.authors.slice(0, 4).join(", ")}
              {selected.authors.length > 4 ? " et al." : ""}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#5A5A68] font-mono">
              {selected.year > 0 && <span>{selected.year}</span>}
              {selected.venue && (
                <span className="truncate max-w-40">{selected.venue}</span>
              )}
              <span className="text-[#22C55E]">
                {selected.citations.toLocaleString()} citations
              </span>
            </div>

            <p className="text-xs text-[#8A8A98] leading-relaxed max-h-64 overflow-y-auto">
              {selected.abstract}
            </p>

            {expandError && (
              <p className="text-[11px] text-[#EF4444]">{expandError}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => handleExpand(selected.id)}
                disabled={expandedIds.has(selected.id) || expandingId !== null}
                className="h-8 bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs disabled:opacity-50"
              >
                {expandingId === selected.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
                {expandedIds.has(selected.id) ? "Expanded" : "Expand map"}
              </Button>
              {selected.url && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-8 border-[#23232D] text-[#8A8A98] hover:bg-[#1E1E28] hover:text-[#F0F0F5] text-xs"
                >
                  <a href={selected.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" />
                    Open paper
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
