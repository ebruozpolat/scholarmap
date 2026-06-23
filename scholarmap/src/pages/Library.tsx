import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  List,
  LayoutGrid,
  Star,
  Folder,
  FolderPlus,
  Inbox,
  BookOpen,
  Clock,
  MoreHorizontal,
  X,
  ExternalLink,
  Tag,
  Trash2,
  FileText,
  ChevronDown,
  Plus,
  Upload,
  Download,
  Check,
} from "lucide-react";

/* ──────────── mock data ──────────── */

interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  citations: number;
  tags: string[];
  savedAt: string;
  abstract: string;
  source: "arXiv" | "Nature" | "OpenReview";
  venue: string;
  favorite: boolean;
  notes?: string;
}

const PAPERS: Paper[] = [
  {
    id: "1",
    title: "Attention Is All You Need",
    authors: ["A. Vaswani", "N. Shazeer", "N. Parmar", "J. Uszkoreit", "L. Jones"],
    year: 2017,
    citations: 142847,
    tags: ["transformers", "nlp", "attention"],
    savedAt: "2024-12-01",
    abstract: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
    source: "arXiv",
    venue: "NeurIPS",
    favorite: true,
    notes: " foundational paper for modern NLP",
  },
  {
    id: "2",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: ["J. Devlin", "M. Chang", "K. Lee", "K. Toutanova"],
    year: 2019,
    citations: 98231,
    tags: ["transformers", "nlp", "pre-training"],
    savedAt: "2024-11-28",
    abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers.",
    source: "arXiv",
    venue: "NAACL",
    favorite: false,
  },
  {
    id: "3",
    title: "Deep Residual Learning for Image Recognition",
    authors: ["K. He", "X. Zhang", "S. Ren", "J. Sun"],
    year: 2016,
    citations: 201445,
    tags: ["cv", "resnet", "deep-learning"],
    savedAt: "2024-11-25",
    abstract: "We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.",
    source: "arXiv",
    venue: "CVPR",
    favorite: true,
  },
  {
    id: "4",
    title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
    authors: ["A. Dosovitskiy", "L. Beyer", "A. Kolesnikov", "D. Weissenborn"],
    year: 2021,
    citations: 52340,
    tags: ["vit", "cv", "transformers"],
    savedAt: "2024-11-20",
    abstract: "While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited.",
    source: "arXiv",
    venue: "ICLR",
    favorite: false,
    notes: "Vision Transformer - key paper",
  },
  {
    id: "5",
    title: "Language Models are Few-Shot Learners",
    authors: ["T. Brown", "B. Mann", "N. Ryder", "M. Subbiah"],
    year: 2020,
    citations: 45678,
    tags: ["gpt", "llm", "few-shot"],
    savedAt: "2024-11-18",
    abstract: "We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance.",
    source: "arXiv",
    venue: "NeurIPS",
    favorite: true,
  },
  {
    id: "6",
    title: "Masked Autoencoders Are Scalable Vision Learners",
    authors: ["K. He", "X. Chen", "S. Xie", "Y. Li", "P. Dollar"],
    year: 2022,
    citations: 18234,
    tags: ["cv", "self-supervised", "mae"],
    savedAt: "2024-11-15",
    abstract: "This paper shows that masked autoencoders (MAE) are scalable self-supervised learners for computer vision.",
    source: "arXiv",
    venue: "CVPR",
    favorite: false,
  },
  {
    id: "7",
    title: "Chain-of-Thought Prompting Elicits Reasoning in LLMs",
    authors: ["J. Wei", "X. Wang", "D. Schuurmans", "M. Bosma"],
    year: 2022,
    citations: 18903,
    tags: ["llm", "reasoning", "prompting"],
    savedAt: "2024-11-12",
    abstract: "We explore how generating a chain of thought — a series of intermediate reasoning steps — significantly improves the ability of large language models.",
    source: "arXiv",
    venue: "NeurIPS",
    favorite: true,
  },
  {
    id: "8",
    title: "Swin Transformer: Hierarchical Vision Transformer",
    authors: ["Z. Liu", "Y. Lin", "Y. Cao", "H. Hu", "Y. Wei"],
    year: 2021,
    citations: 24560,
    tags: ["vit", "cv", "hierarchical"],
    savedAt: "2024-11-10",
    abstract: "This paper presents a new vision Transformer, called Swin Transformer, that capably serves as a general-purpose backbone for computer vision.",
    source: "arXiv",
    venue: "ICCV",
    favorite: false,
  },
  {
    id: "9",
    title: "Attention Mechanisms in Neural Networks: A Survey",
    authors: ["S. Chaudhari", "G. Polatkan", "R. Ramanath", "V. Mithal"],
    year: 2019,
    citations: 3456,
    tags: ["attention", "survey", "deep-learning"],
    savedAt: "2024-11-08",
    abstract: "We present a comprehensive survey of attention mechanisms in neural networks with focus on transformer architectures.",
    source: "Nature",
    venue: "Nature Machine Intelligence",
    favorite: false,
  },
  {
    id: "10",
    title: "On the Relationship between Self-Attention and Convolutional Layers",
    authors: ["J. Cordonnier", "A. Loukas", "M. Jaggi"],
    year: 2020,
    citations: 2345,
    tags: ["attention", "cnn", "theory"],
    savedAt: "2024-11-05",
    abstract: "We investigate the relationship between self-attention and convolutional layers, showing that multi-head self-attention layers are expressive enough to simulate convolutional layers.",
    source: "OpenReview",
    venue: "ICLR",
    favorite: false,
    notes: "Interesting theoretical perspective",
  },
  {
    id: "11",
    title: "Linformer: Self-Attention with Linear Complexity",
    authors: ["S. Wang", "B. Z. Li", "M. Khabsa", "H. Fang", "H. Ma"],
    year: 2020,
    citations: 5678,
    tags: ["attention", "efficiency", "transformers"],
    savedAt: "2024-11-03",
    abstract: "Large transformer models have shown strong performance on a variety of natural language processing tasks, but the complexity scales quadratically with sequence length.",
    source: "arXiv",
    venue: "ICML",
    favorite: false,
  },
  {
    id: "12",
    title: "Perceiver: General Perception with Iterative Attention",
    authors: ["A. Jaegle", "S. Borgeaud", "J. B. Alayrac", "C. Doersch"],
    year: 2021,
    citations: 3456,
    tags: ["attention", "multimodal", "perceiver"],
    savedAt: "2024-11-01",
    abstract: "The Perceiver is a general-purpose architecture that handles arbitrary configurations of different modalities using attention with no assumptions about spatial relationships.",
    source: "arXiv",
    venue: "ICML",
    favorite: true,
  },
];

/* ──────────── types ──────────── */

type ViewMode = "list" | "grid";
type SortKey = "recent" | "title" | "author" | "year" | "citations";

interface Collection {
  id: string;
  name: string;
  icon: "inbox" | "star" | "book" | "clock" | "folder";
  count: number;
}

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "all", name: "All Papers", icon: "inbox", count: 247 },
  { id: "favorites", name: "Favorites", icon: "star", count: 18 },
  { id: "reading", name: "Reading List", icon: "book", count: 32 },
  { id: "toread", name: "To Read", icon: "clock", count: 12 },
];

const CUSTOM_COLLECTIONS: Collection[] = [
  { id: "ml", name: "Machine Learning", icon: "folder", count: 45 },
  { id: "nlp", name: "NLP Research", icon: "folder", count: 38 },
  { id: "cv", name: "Computer Vision", icon: "folder", count: 29 },
];

/* ──────────── helpers ──────────── */

function formatCitations(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const CollectionIcon = ({
  icon,
  className,
}: {
  icon: Collection["icon"];
  className?: string;
}) => {
  switch (icon) {
    case "inbox":
      return <Inbox className={className} />;
    case "star":
      return <Star className={className} />;
    case "book":
      return <BookOpen className={className} />;
    case "clock":
      return <Clock className={className} />;
    case "folder":
      return <Folder className={className} />;
  }
};

/* ──────────── main component ──────────── */

export default function Library() {
  const [activeCollection, setActiveCollection] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailPaper, setDetailPaper] = useState<Paper | null>(null);
  const [papers, setPapers] = useState<Paper[]>(PAPERS);
  const [collections, setCollections] = useState<Collection[]>(CUSTOM_COLLECTIONS);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [noteText, setNoteText] = useState("");

  /* filtering + sorting */
  const filteredPapers = useMemo(() => {
    let list = [...papers];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeCollection === "favorites") {
      list = list.filter((p) => p.favorite);
    }
    switch (sortKey) {
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "author":
        list.sort((a, b) => a.authors[0].localeCompare(b.authors[0]));
        break;
      case "year":
        list.sort((a, b) => b.year - a.year);
        break;
      case "citations":
        list.sort((a, b) => b.citations - a.citations);
        break;
      case "recent":
      default:
        list.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
        break;
    }
    return list;
  }, [papers, searchQuery, activeCollection, sortKey]);

  const allSelected =
    filteredPapers.length > 0 &&
    filteredPapers.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPapers.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) return;
    const newCol: Collection = {
      id: `custom-${Date.now()}`,
      name: newCollectionName.trim(),
      icon: "folder",
      count: 0,
    };
    setCollections([...collections, newCol]);
    setNewCollectionName("");
    setShowNewCollectionInput(false);
  };

  const handleDeleteSelected = () => {
    setPapers(papers.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  };

  const handleToggleFavorite = (id: string) => {
    setPapers(
      papers.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );
    if (detailPaper?.id === id) {
      setDetailPaper({ ...detailPaper, favorite: !detailPaper.favorite });
    }
  };

  const handleRemovePaper = (id: string) => {
    setPapers(papers.filter((p) => p.id !== id));
    if (detailPaper?.id === id) setDetailPaper(null);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ─── Collections Sidebar ─── */}
      <aside
        className="w-[200px] shrink-0 flex flex-col overflow-y-auto border-r"
        style={{ background: "#0F0F14", borderColor: "#23232D" }}
      >
        <div className="p-4">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "#8A8A98" }}
          >
            Collections
          </h3>
          <nav className="space-y-0.5">
            {DEFAULT_COLLECTIONS.map((col) => {
              const isActive = activeCollection === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => {
                    setActiveCollection(col.id);
                    setSelectedIds(new Set());
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative",
                    isActive
                      ? "text-[#6366F1]"
                      : "text-[#8A8A98] hover:bg-[#1E1E28]"
                  )}
                  style={
                    isActive
                      ? { background: "rgba(99,102,241,0.12)" }
                      : undefined
                  }
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: "#6366F1" }}
                    />
                  )}
                  <CollectionIcon
                    icon={col.icon}
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-[#6366F1]" : "text-[#5A5A68]"
                    )}
                  />
                  <span className="flex-1 text-left truncate">{col.name}</span>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "#5A5A68" }}
                  >
                    {col.id === "all"
                      ? papers.length
                      : col.id === "favorites"
                        ? papers.filter((p) => p.favorite).length
                        : col.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div
            className="my-3 h-px"
            style={{ background: "#23232D" }}
          />

          {/* Custom collections */}
          <nav className="space-y-0.5">
            {collections.map((col) => {
              const isActive = activeCollection === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => {
                    setActiveCollection(col.id);
                    setSelectedIds(new Set());
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative",
                    isActive
                      ? "text-[#6366F1]"
                      : "text-[#8A8A98] hover:bg-[#1E1E28]"
                  )}
                  style={
                    isActive
                      ? { background: "rgba(99,102,241,0.12)" }
                      : undefined
                  }
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: "#6366F1" }}
                    />
                  )}
                  <Folder
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-[#6366F1]" : "text-[#5A5A68]"
                    )}
                  />
                  <span className="flex-1 text-left truncate">{col.name}</span>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "#5A5A68" }}
                  >
                    {col.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* New Collection */}
          {showNewCollectionInput ? (
            <div className="mt-3 flex gap-1.5">
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="h-8 text-xs"
                style={{
                  background: "#16161D",
                  borderColor: "#23232D",
                  color: "#F0F0F5",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCollection();
                  if (e.key === "Escape") setShowNewCollectionInput(false);
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="h-8 px-2"
                style={{ background: "#6366F1" }}
                onClick={handleAddCollection}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCollectionInput(true)}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#1E1E28]"
              style={{ color: "#8A8A98" }}
            >
              <Plus className="w-4 h-4" />
              New Collection
            </button>
          )}
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: "#08080C" }}>
        {/* Toolbar */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-3 border-b"
          style={{ borderColor: "#23232D" }}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#5A5A68" }}
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your library..."
                className="pl-9 h-9 text-sm rounded-lg"
                style={{
                  background: "#0F0F14",
                  borderColor: "#23232D",
                  color: "#F0F0F5",
                }}
              />
            </div>

            {selectedIds.size > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(99,102,241,0.12)" }}
              >
                <span className="text-xs font-medium" style={{ color: "#6366F1" }}>
                  {selectedIds.size} selected
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        style={{ color: "#8A8A98" }}
                      >
                        Move <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      style={{
                        background: "#16161D",
                        borderColor: "#23232D",
                      }}
                    >
                      {collections.map((c) => (
                        <DropdownMenuItem
                          key={c.id}
                          className="text-xs cursor-pointer"
                          style={{ color: "#F0F0F5" }}
                        >
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    style={{ color: "#8A8A98" }}
                    onClick={() => {
                      setPapers(
                        papers.map((p) =>
                          selectedIds.has(p.id)
                            ? { ...p, tags: [...p.tags, "tagged"] }
                            : p
                        )
                      );
                    }}
                  >
                    <Tag className="w-3 h-3" /> Tags
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    style={{ color: "#8A8A98" }}
                  >
                    <Download className="w-3 h-3" /> Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    style={{ color: "#EF4444" }}
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger
                className="h-9 text-xs w-36 rounded-lg"
                style={{
                  background: "#0F0F14",
                  borderColor: "#23232D",
                  color: "#F0F0F5",
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                style={{ background: "#16161D", borderColor: "#23232D" }}
              >
                <SelectItem value="recent" className="text-xs">
                  Recently Added
                </SelectItem>
                <SelectItem value="title" className="text-xs">
                  Title (A-Z)
                </SelectItem>
                <SelectItem value="author" className="text-xs">
                  Author
                </SelectItem>
                <SelectItem value="year" className="text-xs">
                  Year
                </SelectItem>
                <SelectItem value="citations" className="text-xs">
                  Citations
                </SelectItem>
              </SelectContent>
            </Select>

            <div
              className="flex items-center rounded-lg overflow-hidden border"
              style={{ borderColor: "#23232D" }}
            >
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list"
                    ? "text-[#6366F1]"
                    : "text-[#5A5A68] hover:text-[#8A8A98]"
                )}
                style={
                  viewMode === "list"
                    ? { background: "rgba(99,102,241,0.12)" }
                    : { background: "#0F0F14" }
                }
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "text-[#6366F1]"
                    : "text-[#5A5A68] hover:text-[#8A8A98]"
                )}
                style={
                  viewMode === "grid"
                    ? { background: "rgba(99,102,241,0.12)" }
                    : { background: "#0F0F14" }
                }
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Paper list content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {viewMode === "list" ? (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: "#0F0F14", borderColor: "#23232D" }}
            >
              {/* Table Header */}
              <div
                className="grid items-center px-4 py-2.5 text-xs font-medium uppercase tracking-wider border-b"
                style={{
                  gridTemplateColumns: "40px 1fr 160px 70px 90px 140px 100px 50px",
                  borderColor: "#23232D",
                  color: "#8A8A98",
                  background: "#16161D",
                }}
              >
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as unknown as HTMLInputElement).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={toggleSelectAll}
                />
                <span>Title</span>
                <span>Authors</span>
                <span>Year</span>
                <span className="text-right">Citations</span>
                <span>Tags</span>
                <span className="text-right">Added</span>
                <span />
              </div>

              {/* Table Rows */}
              {filteredPapers.map((paper) => {
                const isSelected = selectedIds.has(paper.id);
                return (
                  <div
                    key={paper.id}
                    className="grid items-start px-4 py-3 border-b transition-colors cursor-pointer group"
                    style={{
                      gridTemplateColumns:
                        "40px 1fr 160px 70px 90px 140px 100px 50px",
                      borderColor: "#23232D",
                      background: isSelected
                        ? "rgba(99,102,241,0.08)"
                        : undefined,
                    }}
                    onClick={() => setDetailPaper(paper)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "#1E1E28";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div className="pt-0.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(paper.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="min-w-0 pr-4">
                      <p
                        className="text-sm font-medium truncate leading-snug"
                        style={{ color: "#F0F0F5" }}
                      >
                        {paper.title}
                      </p>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: "#5A5A68" }}
                      >
                        {paper.abstract.slice(0, 80)}...
                      </p>
                    </div>
                    <div
                      className="text-sm truncate pr-2"
                      style={{ color: "#8A8A98" }}
                    >
                      {paper.authors[0]} et al.
                    </div>
                    <div
                      className="text-sm tabular-nums"
                      style={{ color: "#8A8A98" }}
                    >
                      {paper.year}
                    </div>
                    <div
                      className="text-sm tabular-nums text-right"
                      style={{ color: "#8A8A98" }}
                    >
                      {formatCitations(paper.citations)}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {paper.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-5 font-normal"
                          style={{
                            background: "#1E1E28",
                            color: "#8A8A98",
                            borderColor: "#23232D",
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {paper.tags.length > 3 && (
                        <span
                          className="text-[10px] self-center"
                          style={{ color: "#5A5A68" }}
                        >
                          +{paper.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs text-right tabular-nums"
                      style={{ color: "#5A5A68" }}
                    >
                      {formatDate(paper.savedAt)}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(paper.id);
                        }}
                        className="p-1 rounded transition-colors hover:bg-[#1E1E28]"
                      >
                        <Star
                          className={cn("w-4 h-4", paper.favorite && "fill-[#F59E0B] text-[#F59E0B]")}
                          style={!paper.favorite ? { color: "#5A5A68" } : undefined}
                        />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded transition-colors hover:bg-[#1E1E28]"
                          >
                            <MoreHorizontal
                              className="w-4 h-4"
                              style={{ color: "#5A5A68" }}
                            />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          style={{
                            background: "#16161D",
                            borderColor: "#23232D",
                          }}
                        >
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            style={{ color: "#F0F0F5" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(paper.id);
                            }}
                          >
                            <Star className="w-3 h-3 mr-2" />
                            {paper.favorite ? "Unfavorite" : "Favorite"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            style={{ color: "#F0F0F5" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tag className="w-3 h-3 mr-2" /> Edit Tags
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer text-red-400"
                            style={{ color: "#EF4444" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePaper(paper.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}

              {filteredPapers.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center py-16"
                  style={{ color: "#5A5A68" }}
                >
                  <Inbox className="w-12 h-12 mb-3" />
                  <p className="text-sm font-medium" style={{ color: "#8A8A98" }}>
                    No papers found
                  </p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          ) : (
            /* ─── Grid View ─── */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => setDetailPaper(paper)}
                  className="rounded-xl border p-5 cursor-pointer transition-all"
                  style={{
                    background: "#16161D",
                    borderColor: "#23232D",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2E2E3A";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#23232D";
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      className="text-[10px] h-5 font-normal"
                      style={{
                        background:
                          paper.source === "arXiv"
                            ? "rgba(99,102,241,0.12)"
                            : paper.source === "Nature"
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(245,158,11,0.12)",
                        color:
                          paper.source === "arXiv"
                            ? "#6366F1"
                            : paper.source === "Nature"
                              ? "#22C55E"
                              : "#F59E0B",
                        border: "none",
                      }}
                    >
                      {paper.source}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(paper.id);
                      }}
                      className="p-1 rounded transition-colors hover:bg-[#1E1E28]"
                    >
                      <Star
                        className={cn("w-4 h-4", paper.favorite && "fill-[#F59E0B] text-[#F59E0B]")}
                        style={!paper.favorite ? { color: "#5A5A68" } : undefined}
                      />
                    </button>
                  </div>

                  <h4
                    className="text-sm font-semibold leading-snug mb-2 line-clamp-2"
                    style={{ color: "#F0F0F5" }}
                  >
                    {paper.title}
                  </h4>

                  <p
                    className="text-xs mb-1 truncate"
                    style={{ color: "#8A8A98" }}
                  >
                    {paper.authors.slice(0, 2).join(", ")}
                    {paper.authors.length > 2 ? " et al." : ""}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 font-normal"
                      style={{
                        borderColor: "#23232D",
                        color: "#8A8A98",
                        background: "transparent",
                      }}
                    >
                      {paper.year}
                    </Badge>
                    <span className="text-xs tabular-nums" style={{ color: "#5A5A68" }}>
                      Cited by {formatCitations(paper.citations)}
                    </span>
                  </div>

                  <p
                    className="text-xs line-clamp-2 mb-3"
                    style={{ color: "#5A5A68" }}
                  >
                    {paper.abstract}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {paper.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md"
                        style={{ background: "#1E1E28", color: "#8A8A98" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ─── Detail Drawer ─── */}
      {detailPaper && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setDetailPaper(null)}
          />
          <aside
            className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto border-l"
            style={{
              width: "400px",
              background: "#16161D",
              borderColor: "#23232D",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.2)",
            }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-[10px] h-5"
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#6366F1",
                      border: "none",
                    }}
                  >
                    {detailPaper.source}
                  </Badge>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "#5A5A68" }}
                  >
                    {detailPaper.year}
                  </span>
                </div>
                <button
                  onClick={() => setDetailPaper(null)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[#1E1E28]"
                >
                  <X className="w-4 h-4" style={{ color: "#8A8A98" }} />
                </button>
              </div>

              <h2
                className="text-lg font-semibold leading-snug mb-2"
                style={{ color: "#F0F0F5" }}
              >
                {detailPaper.title}
              </h2>

              <p className="text-sm mb-1" style={{ color: "#8A8A98" }}>
                {detailPaper.authors.join(", ")}
              </p>
              <p className="text-xs mb-4" style={{ color: "#5A5A68" }}>
                {detailPaper.venue}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mb-6">
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  style={{ background: "#6366F1" }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Paper
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  style={{
                    borderColor: "#23232D",
                    color: "#F0F0F5",
                    background: "transparent",
                  }}
                >
                  <FileText className="w-3.5 h-3.5" /> Note
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  style={{
                    borderColor: "#23232D",
                    color: "#F0F0F5",
                    background: "transparent",
                  }}
                  onClick={() => handleRemovePaper(detailPaper.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              </div>

              {/* Abstract */}
              <div className="mb-6">
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "#8A8A98" }}
                >
                  Abstract
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: "#F0F0F5" }}>
                  {detailPaper.abstract}
                </p>
              </div>

              {/* Metadata */}
              <div
                className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-lg"
                style={{ background: "#0F0F14" }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5A5A68" }}>
                    Citations
                  </p>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: "#F0F0F5" }}>
                    {detailPaper.citations.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5A5A68" }}>
                    Year
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#F0F0F5" }}>
                    {detailPaper.year}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5A5A68" }}>
                    Source
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#F0F0F5" }}>
                    {detailPaper.source}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5A5A68" }}>
                    Saved
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#F0F0F5" }}>
                    {formatDate(detailPaper.savedAt)}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "#8A8A98" }}
                >
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {detailPaper.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md"
                      style={{ background: "#1E1E28", color: "#8A8A98" }}
                    >
                      {tag}
                      <button
                        className="hover:text-[#F0F0F5] transition-colors"
                        onClick={() => {
                          const updated = {
                            ...detailPaper,
                            tags: detailPaper.tags.filter((t) => t !== tag),
                          };
                          setDetailPaper(updated);
                          setPapers(
                            papers.map((p) => (p.id === updated.id ? updated : p))
                          );
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    className="text-xs px-2.5 py-1 rounded-md border border-dashed transition-colors hover:bg-[#1E1E28]"
                    style={{ borderColor: "#2E2E3A", color: "#5A5A68" }}
                  >
                    + Add tag
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "#8A8A98" }}
                >
                  Notes
                </h4>
                <Textarea
                  value={noteText || detailPaper.notes || ""}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add your notes about this paper..."
                  className="text-sm min-h-[120px] resize-none rounded-lg"
                  style={{
                    background: "#0F0F14",
                    borderColor: "#23232D",
                    color: "#F0F0F5",
                  }}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    style={{ background: "#6366F1" }}
                    onClick={() => {
                      const updated = { ...detailPaper, notes: noteText };
                      setDetailPaper(updated);
                      setPapers(
                        papers.map((p) => (p.id === updated.id ? updated : p))
                      );
                    }}
                  >
                    Save Note
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
