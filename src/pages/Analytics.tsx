import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, FileText, Quote, Flame, Download } from "lucide-react";

/* ──────────── data ──────────── */

const trendData = [
  { year: "2020", all: 1847, attention: 456, vit: 234 },
  { year: "2021", all: 2134, attention: 876, vit: 567 },
  { year: "2022", all: 2567, attention: 1234, vit: 891 },
  { year: "2023", all: 2891, attention: 1567, vit: 1023 },
  { year: "2024", all: 3234, attention: 1823, vit: 1456 },
  { year: "2025", all: 3678, attention: 2100, vit: 1800 },
  { year: "2026", all: 4100, attention: 2400, vit: 2100 },
];

const venueData = [
  { name: "CVPR", value: 2847 },
  { name: "NeurIPS", value: 2634 },
  { name: "ICML", value: 2134 },
  { name: "ICLR", value: 1567 },
  { name: "ECCV", value: 1345 },
  { name: "AAAI", value: 987 },
  { name: "TMLR", value: 654 },
  { name: "Nature", value: 432 },
];

const citationData = [
  { range: "0-10", count: 4520, color: "#6366F1" },
  { range: "10-50", count: 3210, color: "#818CF8" },
  { range: "50-100", count: 1840, color: "#A78BFA" },
  { range: "100-500", count: 1230, color: "#C084FC" },
  { range: "500-1K", count: 540, color: "#A855F7" },
  { range: "1K+", count: 320, color: "#7C3AED" },
];

const topAuthors = [
  {
    name: "Kaiming He",
    affiliation: "Meta AI",
    initials: "KH",
    citations: 234567,
    spark: [120, 180, 250, 320, 400],
  },
  {
    name: "Yann LeCun",
    affiliation: "NYU / Meta",
    initials: "YL",
    citations: 198432,
    spark: [200, 210, 220, 230, 240],
  },
  {
    name: "Yoshua Bengio",
    affiliation: "U. Montreal",
    initials: "YB",
    citations: 187654,
    spark: [180, 190, 200, 210, 220],
  },
  {
    name: "Jitendra Malik",
    affiliation: "UC Berkeley",
    initials: "JM",
    citations: 156789,
    spark: [100, 120, 140, 160, 180],
  },
  {
    name: "Andrew Ng",
    affiliation: "Stanford",
    initials: "AN",
    citations: 145678,
    spark: [150, 155, 160, 165, 170],
  },
  {
    name: "Geoffrey Hinton",
    affiliation: "U. Toronto",
    initials: "GH",
    citations: 134567,
    spark: [300, 260, 220, 200, 190],
  },
];

const topicData = [
  { name: "Transformers", papers: 2847, x: 50, y: 50, r: 55, color: "#6366F1" },
  { name: "LLMs", papers: 1923, x: 150, y: 30, r: 42, color: "#22C55E" },
  { name: "Diffusion", papers: 1234, x: 30, y: 130, r: 35, color: "#F59E0B" },
  { name: "RL", papers: 987, x: 130, y: 140, r: 30, color: "#EC4899" },
  { name: "Vision", papers: 876, x: 180, y: 90, r: 28, color: "#06B6D4" },
  { name: "NLP", papers: 765, x: 80, y: 170, r: 26, color: "#A78BFA" },
  { name: "GNNs", papers: 654, x: 30, y: 60, r: 24, color: "#F97316" },
  { name: "Multimodal", papers: 543, x: 170, y: 160, r: 22, color: "#14B8A6" },
  { name: "Federated", papers: 432, x: 90, y: 40, r: 19, color: "#8B5CF6" },
  { name: "Time Series", papers: 321, x: 60, y: 100, r: 16, color: "#EAB308" },
];

/* ──────────── sparkline ──────────── */

function MiniSparkline({ data }: { data: number[] }) {
  const w = 80;
  const h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <path d={path} fill="none" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ──────────── custom chart tooltip ──────────── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-3 text-xs shadow-lg border"
      style={{
        background: "#16161D",
        borderColor: "#23232D",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <p className="font-medium mb-1" style={{ color: "#F0F0F5" }}>
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span style={{ color: "#8A8A98" }}>
            {p.dataKey === "all" ? "All Papers" : p.dataKey === "attention" ? "Attention" : "ViT"}: {p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ──────────── main component ──────────── */

export default function Analytics() {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  return (
    <div className="overflow-y-auto h-[calc(100vh-3.5rem)]" style={{ background: "#08080C" }}>
      <div className="px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#F0F0F5" }}>
              Analytics
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#5A5A68" }}>
              Research insights for your field
            </p>
          </div>
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
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            {
              title: "Total Papers",
              value: "2.4M",
              subtitle: "In selected scope",
              trend: "+8.4%",
              icon: FileText,
            },
            {
              title: "Papers This Year",
              value: "34K",
              subtitle: "Published in 2025",
              trend: "+12%",
              icon: TrendingUp,
            },
            {
              title: "Avg Citations",
              value: "45.2",
              subtitle: "Per paper",
              trend: "+2.1",
              icon: Quote,
            },
            {
              title: "Hottest Topic",
              value: "ViT",
              subtitle: "Vision Transformer",
              trend: "",
              icon: Flame,
            },
          ].map((kpi) => (
            <div
              key={kpi.title}
              className="rounded-xl border p-5 transition-all hover:-translate-y-0.5"
              style={{
                background: "#16161D",
                borderColor: "#23232D",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: "#8A8A98" }}
                >
                  {kpi.title}
                </p>
                <kpi.icon className="w-4 h-4" style={{ color: "#5A5A68" }} />
              </div>
              <p
                className="text-3xl font-bold tabular-nums tracking-tight"
                style={{ color: "#F0F0F5" }}
              >
                {kpi.value}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {kpi.trend && (
                  <Badge
                    className="text-[10px] h-4 px-1"
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      color: "#22C55E",
                      border: "none",
                    }}
                  >
                    {kpi.trend}
                  </Badge>
                )}
                <p className="text-xs" style={{ color: "#5A5A68" }}>
                  {kpi.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Publication Trends - Full Width */}
        <div
          className="rounded-xl border p-5 mb-6"
          style={{ background: "#16161D", borderColor: "#23232D" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#F0F0F5" }}>
                Publication Trends
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#5A5A68" }}>
                Papers published per year
              </p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: "All Papers", color: "#6366F1" },
                { label: "Attention", color: "#22C55E" },
                { label: "ViT", color: "#F59E0B" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs" style={{ color: "#8A8A98" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAttn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradVit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#23232D"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fill: "#8A8A98", fontSize: 12 }}
                axisLine={{ stroke: "#23232D" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#8A8A98", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="all"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#gradAll)"
              />
              <Area
                type="monotone"
                dataKey="attention"
                stroke="#22C55E"
                strokeWidth={2}
                fill="url(#gradAttn)"
              />
              <Area
                type="monotone"
                dataKey="vit"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#gradVit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Venue Rankings + Citation Distribution */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Venue Rankings */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "#16161D", borderColor: "#23232D" }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: "#F0F0F5" }}>
              Venue Rankings
            </h3>
            <p className="text-xs mb-4" style={{ color: "#5A5A68" }}>
              By publication count
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={venueData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#23232D"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#8A8A98", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#F0F0F5", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div
                        className="rounded-lg p-2.5 text-xs border"
                        style={{
                          background: "#16161D",
                          borderColor: "#23232D",
                        }}
                      >
                        <span style={{ color: "#F0F0F5" }}>
                          {payload[0].payload.name}:{" "}
                          {(payload[0].value as number).toLocaleString()}
                        </span>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                  {venueData.map((_, i) => (
                    <Cell key={i} fill="#6366F1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Citation Distribution */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "#16161D", borderColor: "#23232D" }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: "#F0F0F5" }}>
              Citation Distribution
            </h3>
            <p className="text-xs mb-4" style={{ color: "#5A5A68" }}>
              How citations are spread across papers
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={citationData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#23232D"
                  vertical={false}
                />
                <XAxis
                  dataKey="range"
                  tick={{ fill: "#8A8A98", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8A8A98", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div
                        className="rounded-lg p-2.5 text-xs border"
                        style={{
                          background: "#16161D",
                          borderColor: "#23232D",
                        }}
                      >
                        <span style={{ color: "#F0F0F5" }}>
                          {p.range}: {p.count.toLocaleString()} papers
                        </span>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                  {citationData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Authors + Topic Network */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Top Authors */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "#16161D", borderColor: "#23232D" }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: "#F0F0F5" }}>
              Top Authors
            </h3>
            <p className="text-xs mb-4" style={{ color: "#5A5A68" }}>
              By citation impact
            </p>
            <div className="space-y-0.5">
              {topAuthors.map((author, i) => (
                <div
                  key={author.name}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                  style={{} as React.CSSProperties}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#1E1E28";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span
                    className="text-sm font-bold tabular-nums w-6 text-center"
                    style={{ color: "#5A5A68" }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#6366F1",
                    }}
                  >
                    {author.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "#F0F0F5" }}
                    >
                      {author.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#5A5A68" }}>
                      {author.affiliation}
                    </p>
                  </div>
                  <MiniSparkline data={author.spark} />
                  <span
                    className="text-sm font-medium tabular-nums w-16 text-right"
                    style={{ color: "#F0F0F5" }}
                  >
                    {author.citations >= 1000
                      ? `${(author.citations / 1000).toFixed(0)}K`
                      : author.citations}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Network */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "#16161D", borderColor: "#23232D" }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: "#F0F0F5" }}>
              Topic Network
            </h3>
            <p className="text-xs mb-4" style={{ color: "#5A5A68" }}>
              Related research topics and their connections
            </p>
            <div className="relative" style={{ height: 260 }}>
              <svg
                viewBox="0 0 220 200"
                className="w-full h-full"
                style={{ overflow: "visible" }}
              >
                {/* Connection lines */}
                {topicData.map((topic, i) =>
                  topicData.slice(i + 1).map((other, j) => {
                    const dx = topic.x - other.x;
                    const dy = topic.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 80) return null;
                    return (
                      <line
                        key={`${i}-${j}`}
                        x1={topic.x}
                        y1={topic.y}
                        x2={other.x}
                        y2={other.y}
                        stroke="#23232D"
                        strokeWidth={1}
                        opacity={1 - dist / 80}
                      />
                    );
                  })
                )}
                {/* Circles */}
                {topicData.map((topic) => {
                  const isHovered = hoveredTopic === topic.name;
                  return (
                    <g
                      key={topic.name}
                      transform={`translate(${topic.x}, ${topic.y})`}
                      onMouseEnter={() => setHoveredTopic(topic.name)}
                      onMouseLeave={() => setHoveredTopic(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        r={isHovered ? topic.r * 1.1 : topic.r}
                        fill={topic.color}
                        opacity={0.7}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={1}
                        style={{ transition: "all 0.2s ease" }}
                      />
                      {topic.r > 20 && (
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#F0F0F5"
                          fontSize={topic.r > 30 ? 10 : 9}
                          fontWeight={500}
                          style={{ pointerEvents: "none" }}
                        >
                          {topic.name.length > 10
                            ? topic.name.slice(0, 8) + "..."
                            : topic.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              {/* Hover tooltip */}
              {hoveredTopic && (
                <div
                  className="absolute top-2 right-2 rounded-lg px-3 py-2 text-xs border"
                  style={{
                    background: "#16161D",
                    borderColor: "#23232D",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  <p className="font-medium" style={{ color: "#F0F0F5" }}>
                    {hoveredTopic}
                  </p>
                  <p style={{ color: "#8A8A98" }}>
                    {topicData.find((t) => t.name === hoveredTopic)?.papers.toLocaleString()} papers
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#23232D" }}>
          <p className="text-xs" style={{ color: "#5A5A68" }}>
            Data sourced from arXiv, Google Scholar, Semantic Scholar
          </p>
          <p className="text-xs" style={{ color: "#5A5A68" }}>
            Last updated: 2 hours ago
          </p>
        </div>
      </div>
    </div>
  );
}
