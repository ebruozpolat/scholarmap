import { useState, useMemo, useCallback } from "react";
import {
  Search,
  FileText,
  TrendingUp,
  Users,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  Bookmark,
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  Quote,
  Library,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import paperData from "@/data/papers.json";
import type { Paper } from "@/data/papers.json";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";

const { papers: allPapers } = paperData;

const TOPICS = [
  "Vision Transformer",
  "Self-Attention",
  "Medical Imaging",
  "NLP",
  "Time Series",
  "Efficiency",
] as const;

type Topic = (typeof TOPICS)[number];
type SortOption = "relevance" | "citations" | "year" | "title";
type SourceFilter = "All" | "arXiv" | "Google Scholar";

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

function getSourceFromPaper(p: Paper): string {
  return p.source || "arXiv";
}

function getVenueShort(p: Paper): string {
  const v = p.venue || "";
  if (v.startsWith("[")) {
    try {
      const arr = JSON.parse(v.replace(/'/g, '"'));
      return arr[0] || "arXiv";
    } catch {
      return "arXiv";
    }
  }
  const m = v.match(/^[^,\-]+/);
  return m ? m[0].trim().slice(0, 18) : "Unknown";
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [minCitations, setMinCitations] = useState("");
  const [activeTopics, setActiveTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleTopic = useCallback((topic: Topic) => {
    setActiveTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
    setPage(1);
  }, []);

  const toggleSaved = useCallback((title: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const filteredPapers = useMemo(() => {
    let result = [...allPapers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)) ||
          p.abstract.toLowerCase().includes(q)
      );
    }

    if (sourceFilter !== "All") {
      result = result.filter((p) => getSourceFromPaper(p) === sourceFilter);
    }

    if (yearFrom) {
      result = result.filter((p) => p.year >= Number(yearFrom));
    }
    if (yearTo) {
      result = result.filter((p) => p.year <= Number(yearTo));
    }

    if (minCitations) {
      result = result.filter((p) => p.citations >= Number(minCitations));
    }

    if (activeTopics.length > 0) {
      result = result.filter((p) => activeTopics.includes(p.topic as Topic));
    }

    switch (sortBy) {
      case "citations":
        result.sort((a, b) => b.citations - a.citations);
        break;
      case "year":
        result.sort((a, b) => b.year - a.year);
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // relevance - keep filtered order
        break;
    }

    return result;
  }, [searchQuery, sourceFilter, sortBy, yearFrom, yearTo, minCitations, activeTopics]);

  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedPapers = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredPapers.slice(start, start + perPage);
  }, [filteredPapers, currentPage, perPage]);

  const allSelectedOnPage =
    paginatedPapers.length > 0 &&
    paginatedPapers.every((_, i) => selectedIds.has((currentPage - 1) * perPage + i));

  const toggleSelectAll = () => {
    const start = (currentPage - 1) * perPage;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        for (let i = 0; i < paginatedPapers.length; i++) next.delete(start + i);
      } else {
        for (let i = 0; i < paginatedPapers.length; i++) next.add(start + i);
      }
      return next;
    });
  };

  const toggleSelectRow = (globalIdx: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(globalIdx)) next.delete(globalIdx);
      else next.add(globalIdx);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedCount = selectedIds.size;

  const avgCitations = useMemo(() => {
    if (filteredPapers.length === 0) return 0;
    return Math.round(
      filteredPapers.reduce((s, p) => s + p.citations, 0) / filteredPapers.length
    );
  }, [filteredPapers]);

  const uniqueSources = useMemo(() => {
    return new Set(filteredPapers.map((p) => getSourceFromPaper(p))).size;
  }, [filteredPapers]);

  // Analytics data
  const yearDistribution = useMemo(() => {
    const map: Record<number, number> = {};
    for (const p of filteredPapers) {
      map[p.year] = (map[p.year] || 0) + 1;
    }
    return YEARS.map((y) => ({ year: String(y), count: map[y] || 0 }));
  }, [filteredPapers]);

  const venueDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of filteredPapers) {
      const v = getVenueShort(p);
      map[v] = (map[v] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([venue, count]) => ({ venue, count }));
  }, [filteredPapers]);

  const citationBuckets = useMemo(() => {
    const buckets = [
      { range: "0-10", min: 0, max: 10, count: 0 },
      { range: "10-100", min: 10, max: 100, count: 0 },
      { range: "100-1K", min: 100, max: 1000, count: 0 },
      { range: "1K-10K", min: 1000, max: 10000, count: 0 },
    ];
    for (const p of filteredPapers) {
      for (const b of buckets) {
        if (p.citations >= b.min && p.citations < b.max) {
          b.count++;
          break;
        }
      }
      if (p.citations >= 10000) buckets[3].count++;
    }
    return buckets;
  }, [filteredPapers]);

  const topicCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of filteredPapers) {
      const t = p.topic || "Self-Attention";
      map[t] = (map[t] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count }));
  }, [filteredPapers]);

  const maxTopicCount = useMemo(() => {
    return Math.max(...topicCounts.map((t) => t.count), 1);
  }, [topicCounts]);

  const maxVenueCount = useMemo(() => {
    return Math.max(...venueDistribution.map((v) => v.count), 1);
  }, [venueDistribution]);

  return (
    <div className="flex h-full bg-[#08080C]">
      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-8 py-3 border-b border-[#23232D] bg-[#08080C]/80 backdrop-blur-md h-14">
          <div>
            <h1 className="text-lg font-semibold text-[#F0F0F5]">Dashboard</h1>
            <p className="text-[11px] text-[#5A5A68]">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[#5A5A68] bg-[#16161D] border border-[#23232D] hover:bg-[#1E1E28] transition-colors">
              <Search className="size-3.5" />
              <span>Search</span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-[#23232D] text-[10px] font-mono">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="bg-[#0F0F14] border border-[#23232D] rounded-2xl p-5 hover:border-[#2E2E3A] focus-within:border-[#6366F1] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all">
              <div className="flex items-center gap-3">
                <Search className="size-5 text-[#5A5A68] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search papers across arXiv and Google Scholar..."
                  className="flex-1 bg-transparent text-lg text-[#F0F0F5] placeholder-[#5A5A68] outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded-md bg-[#1E1E28] text-[10px] text-[#5A5A68] font-mono border border-[#23232D]">
                  ⌘K
                </kbd>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {(["All", "arXiv", "Google Scholar"] as SourceFilter[]).map(
                  (src) => (
                    <button
                      key={src}
                      onClick={() => {
                        setSourceFilter(src);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sourceFilter === src
                          ? "bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/30"
                          : "text-[#8A8A98] border border-[#23232D] hover:bg-[#1E1E28] hover:text-[#F0F0F5]"
                      }`}
                    >
                      {src}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              {
                icon: FileText,
                label: "Papers Found",
                value: filteredPapers.length.toLocaleString(),
                change: `${allPapers.length} total`,
              },
              {
                icon: TrendingUp,
                label: "Avg Citations",
                value: avgCitations.toLocaleString(),
                change: "per paper",
              },
              {
                icon: Globe,
                label: "Sources",
                value: String(uniqueSources),
                change: "arXiv + Scholar",
              },
              {
                icon: Users,
                label: "Authors",
                value: String(
                  new Set(allPapers.flatMap((p) => p.authors)).size
                ),
                change: "unique researchers",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#16161D] border border-[#23232D] rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="size-4 text-[#6366F1]" />
                  <span className="text-[11px] font-medium text-[#5A5A68] uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <div className="text-2xl font-semibold text-[#F0F0F5] font-mono">
                  {stat.value}
                </div>
                <div className="text-[11px] text-[#22C55E] mt-1">
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="size-3.5 text-[#5A5A68]" />
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="h-8 bg-[#16161D] border-[#23232D] text-[#8A8A98] text-xs hover:bg-[#1E1E28]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#16161D] border-[#23232D]">
                  <SelectItem value="relevance" className="text-xs text-[#8A8A98] focus:bg-[#1E1E28] focus:text-[#F0F0F5]">
                    Relevance
                  </SelectItem>
                  <SelectItem value="citations" className="text-xs text-[#8A8A98] focus:bg-[#1E1E28] focus:text-[#F0F0F5]">
                    Citations
                  </SelectItem>
                  <SelectItem value="year" className="text-xs text-[#8A8A98] focus:bg-[#1E1E28] focus:text-[#F0F0F5]">
                    Year
                  </SelectItem>
                  <SelectItem value="title" className="text-xs text-[#8A8A98] focus:bg-[#1E1E28] focus:text-[#F0F0F5]">
                    Title
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#5A5A68]" />
              <input
                type="number"
                placeholder="From"
                value={yearFrom}
                onChange={(e) => {
                  setYearFrom(e.target.value);
                  setPage(1);
                }}
                className="w-16 h-8 bg-[#16161D] border border-[#23232D] rounded-md px-2 text-xs text-[#F0F0F5] placeholder-[#5A5A68] outline-none focus:border-[#6366F1]"
              />
              <span className="text-[#5A5A68] text-xs">-</span>
              <input
                type="number"
                placeholder="To"
                value={yearTo}
                onChange={(e) => {
                  setYearTo(e.target.value);
                  setPage(1);
                }}
                className="w-16 h-8 bg-[#16161D] border border-[#23232D] rounded-md px-2 text-xs text-[#F0F0F5] placeholder-[#5A5A68] outline-none focus:border-[#6366F1]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Quote className="size-3.5 text-[#5A5A68]" />
              <input
                type="number"
                placeholder="Min citations"
                value={minCitations}
                onChange={(e) => {
                  setMinCitations(e.target.value);
                  setPage(1);
                }}
                className="w-24 h-8 bg-[#16161D] border border-[#23232D] rounded-md px-2 text-xs text-[#F0F0F5] placeholder-[#5A5A68] outline-none focus:border-[#6366F1]"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                    activeTopics.includes(topic)
                      ? "bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/30"
                      : "bg-[#16161D] text-[#8A8A98] border-[#23232D] hover:bg-[#1E1E28] hover:text-[#F0F0F5]"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {(activeTopics.length > 0 ||
              yearFrom ||
              yearTo ||
              minCitations) && (
              <button
                onClick={() => {
                  setActiveTopics([]);
                  setYearFrom("");
                  setYearTo("");
                  setMinCitations("");
                  setPage(1);
                }}
                className="text-[11px] text-[#6366F1] hover:text-[#818CF8] font-medium ml-1 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Results Table */}
          <div className="bg-[#16161D] border border-[#23232D] rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#16161D] border-b border-[#23232D]">
                    <th className="w-10 px-3 py-3">
                      <Checkbox
                        checked={allSelectedOnPage}
                        onCheckedChange={toggleSelectAll}
                        className="border-[#5A5A68] data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1]"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8A98] uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8A98] uppercase tracking-wider w-40">
                      Authors
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8A98] uppercase tracking-wider w-16">
                      Year
                    </th>
                    <th className="px-3 py-3 text-right text-[11px] font-medium text-[#8A8A98] uppercase tracking-wider w-24">
                      Citations
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-medium text-[#8A8A98] uppercase tracking-wider w-20">
                      Source
                    </th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedPapers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-16 text-center text-[#5A5A68]"
                      >
                        <Search className="size-12 mx-auto mb-3 opacity-40" />
                        <p className="text-[#8A8A98] mb-1">
                          No papers found matching your criteria
                        </p>
                        <p className="text-xs">
                          Try adjusting your filters or search terms
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPapers.map((paper, idx) => {
                      const globalIdx = (currentPage - 1) * perPage + idx;
                      const isSelected = selectedIds.has(globalIdx);
                      const source = getSourceFromPaper(paper);
                      const isSaved = savedIds.has(paper.title);

                      return (
                        <tr
                          key={`${paper.title}-${idx}`}
                          className={`border-b border-[#23232D] last:border-b-0 transition-colors ${
                            isSelected
                              ? "bg-[#6366F1]/5"
                              : "hover:bg-[#1E1E28]"
                          }`}
                        >
                          <td className="px-3 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectRow(globalIdx)}
                              className="border-[#5A5A68] data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1]"
                            />
                          </td>
                          <td className="px-3 py-3 max-w-md">
                            <div className="font-medium text-[#F0F0F5] text-sm line-clamp-2 leading-snug mb-0.5">
                              {paper.title}
                            </div>
                            <div className="text-[11px] text-[#5A5A68] line-clamp-1">
                              {paper.abstract.slice(0, 120)}
                              {paper.abstract.length > 120 ? "..." : ""}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[#8A8A98] text-xs truncate max-w-40">
                            {paper.authors[0]}
                            {paper.authors.length > 1 ? " et al." : ""}
                          </td>
                          <td className="px-3 py-3 text-[#8A8A98] text-xs font-mono">
                            {paper.year}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className={`text-xs font-mono font-medium ${
                                paper.citations > 100
                                  ? "text-[#22C55E]"
                                  : "text-[#8A8A98]"
                              }`}
                            >
                              {paper.citations.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-medium ${
                                source === "arXiv"
                                  ? "bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20"
                                  : "bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20"
                              }`}
                            >
                              {source}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleSaved(paper.title)}
                                className="p-1 rounded hover:bg-[#1E1E28] transition-colors"
                              >
                                <Bookmark
                                  className={`size-3.5 ${
                                    isSaved
                                      ? "fill-[#6366F1] text-[#6366F1]"
                                      : "text-[#5A5A68]"
                                  }`}
                                />
                              </button>
                              <button className="p-1 rounded hover:bg-[#1E1E28] transition-colors">
                                <MoreHorizontal className="size-3.5 text-[#5A5A68]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#23232D] bg-[#16161D]">
              <div className="text-[11px] text-[#5A5A68]">
                Showing{" "}
                {(currentPage - 1) * perPage + 1}
                -
                {Math.min(currentPage * perPage, filteredPapers.length)} of{" "}
                {filteredPapers.length} results
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md text-[#5A5A68] hover:bg-[#1E1E28] hover:text-[#F0F0F5] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from(
                  { length: Math.min(5, totalPages) },
                  (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`min-w-[32px] h-8 px-2 rounded-md text-xs font-medium transition-all ${
                          currentPage === pageNum
                            ? "bg-[#6366F1] text-white"
                            : "text-[#8A8A98] hover:bg-[#1E1E28] hover:text-[#F0F0F5]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md text-[#5A5A68] hover:bg-[#1E1E28] hover:text-[#F0F0F5] disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <Select
                value={String(perPage)}
                onValueChange={(v) => {
                  setPerPage(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-24 bg-[#16161D] border-[#23232D] text-[#8A8A98] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#16161D] border-[#23232D]">
                  {[10, 25, 50].map((n) => (
                    <SelectItem
                      key={n}
                      value={String(n)}
                      className="text-xs text-[#8A8A98] focus:bg-[#1E1E28] focus:text-[#F0F0F5]"
                    >
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bulk Selection Action Bar */}
        {selectedCount > 0 && (
          <div className="shrink-0 mx-8 mb-4 flex items-center justify-between px-4 py-3 bg-[#16161D] border border-[#23232D] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#F0F0F5]">
                {selectedCount} paper{selectedCount > 1 ? "s" : ""} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-[11px] text-[#5A5A68] hover:text-[#8A8A98] transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs"
              >
                <Library className="size-3.5 mr-1" />
                Add to Library
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-[#23232D] text-[#8A8A98] hover:bg-[#1E1E28] hover:text-[#F0F0F5] text-xs"
              >
                <Download className="size-3.5 mr-1" />
                Export
              </Button>
              <button
                onClick={clearSelection}
                className="p-1.5 rounded-md text-[#5A5A68] hover:bg-[#1E1E28] transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Sidebar */}
      <div className="w-[280px] shrink-0 border-l border-[#23232D] bg-[#08080C] overflow-y-auto p-4 space-y-4">
        <h3 className="text-sm font-semibold text-[#F0F0F5] mb-1">
          Search Insights
        </h3>

        {/* Publications by Year */}
        <div className="bg-[#16161D] border border-[#23232D] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[#F0F0F5] mb-0.5">
            Publications by Year
          </h4>
          <p className="text-[10px] text-[#5A5A68] mb-3">
            Papers per year
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={yearDistribution}>
              <defs>
                <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#23232D"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fill: "#5A5A68", fontSize: 10 }}
                axisLine={{ stroke: "#23232D" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5A5A68", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip
                contentStyle={{
                  background: "#16161D",
                  border: "1px solid #23232D",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#F0F0F5",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#yearGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Venues */}
        <div className="bg-[#16161D] border border-[#23232D] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[#F0F0F5] mb-3">
            Top Venues
          </h4>
          <div className="space-y-2">
            {venueDistribution.map((v, i) => (
              <div key={v.venue} className="flex items-center gap-2">
                <span className="text-[10px] text-[#8A8A98] w-20 truncate shrink-0">
                  {v.venue}
                </span>
                <div className="flex-1 h-5 bg-[#1E1E28] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(v.count / maxVenueCount) * 100}%`,
                      background: `rgba(99, 102, 241, ${0.9 - i * 0.15})`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-[#5A5A68] w-6 text-right font-mono">
                  {v.count}
                </span>
              </div>
            ))}
            {venueDistribution.length === 0 && (
              <p className="text-[10px] text-[#5A5A68]">No data</p>
            )}
          </div>
        </div>

        {/* Citation Distribution */}
        <div className="bg-[#16161D] border border-[#23232D] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[#F0F0F5] mb-0.5">
            Citations
          </h4>
          <p className="text-[10px] text-[#5A5A68] mb-3">Distribution</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={citationBuckets}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#23232D"
                vertical={false}
              />
              <XAxis
                dataKey="range"
                tick={{ fill: "#5A5A68", fontSize: 9 }}
                axisLine={{ stroke: "#23232D" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5A5A68", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={18}
              />
              <Tooltip
                contentStyle={{
                  background: "#16161D",
                  border: "1px solid #23232D",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#F0F0F5",
                }}
              />
              <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Topic Tags */}
        <div className="bg-[#16161D] border border-[#23232D] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[#F0F0F5] mb-3">
            Topic Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {topicCounts.map((t) => (
              <span
                key={t.topic}
                className="inline-flex items-center px-2 py-1 rounded-md bg-[#6366F1]/10 text-[#6366F1] text-[10px] font-medium"
                style={{
                  fontSize: Math.max(10, 10 + (t.count / maxTopicCount) * 3),
                  opacity: 0.5 + (t.count / maxTopicCount) * 0.5,
                }}
              >
                {t.topic} ({t.count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
