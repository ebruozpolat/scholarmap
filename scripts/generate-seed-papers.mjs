#!/usr/bin/env node
/**
 * Generates db/seed.sql and db/seed-papers.ts with 147 attention-mechanism papers.
 * Sources: attention_papers.json (130) + research/web_collected_papers.json (17 unique).
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGET = 147;

function escapeSql(str) {
  return (str ?? "").replace(/'/g, "''");
}

function inferTopic(paper) {
  const title = (paper.title ?? "").toLowerCase();
  const venue = String(paper.venue ?? paper.categories ?? "").toLowerCase();
  if (title.includes("vision") || venue.includes("cv")) return "Vision Transformer";
  if (title.includes("nlp") || venue.includes("cs.cl")) return "NLP";
  if (title.includes("medical") || title.includes("brain") || title.includes("tumor"))
    return "Medical Imaging";
  if (title.includes("time") || title.includes("forecast")) return "Time Series";
  if (title.includes("graph")) return "Graph Networks";
  return "Self-Attention";
}

function normalizePaper(paper, source) {
  const authors = Array.isArray(paper.authors)
    ? paper.authors.join(", ")
    : String(paper.authors ?? "");
  const year = String(paper.year ?? "").slice(0, 4);
  const citations = String(paper.citations ?? paper.citation_count ?? paper.citationCount ?? "0");
  const url = paper.url ?? "";
  const venue = Array.isArray(paper.venue)
    ? paper.venue.join(", ")
    : String(paper.venue ?? paper.categories ?? source ?? "");

  return {
    title: String(paper.title ?? "").trim(),
    authors,
    year,
    abstract: String(paper.abstract ?? "").slice(0, 500),
    url,
    citationCount: citations,
    source: paper.source ?? source,
    venue: venue.replace(/^\[|\]$/g, "").replace(/'/g, ""),
    topic: paper.topic ?? inferTopic(paper),
  };
}

function loadPapers() {
  const jsonPapers = JSON.parse(
    fs.readFileSync(path.join(ROOT, "attention_papers.json"), "utf8"),
  ).papers.map((p) => normalizePaper(p, p.source ?? "arXiv"));

  const seen = new Set(jsonPapers.map((p) => p.title.toLowerCase()));
  const webPapers = JSON.parse(
    fs.readFileSync(path.join(ROOT, "research/web_collected_papers.json"), "utf8"),
  );

  const extras = [];
  for (const raw of webPapers) {
    const paper = normalizePaper(raw, raw.source ?? "Google Scholar");
    const key = paper.title.toLowerCase();
    if (!paper.title || seen.has(key)) continue;
    seen.add(key);
    extras.push(paper);
    if (jsonPapers.length + extras.length >= TARGET) break;
  }

  const all = [...jsonPapers, ...extras].slice(0, TARGET);
  if (all.length < TARGET) {
    throw new Error(`Only found ${all.length} unique papers, need ${TARGET}`);
  }
  return all;
}

function generateSeedSql(papers) {
  const lines = [
    "-- Seed data for ScholarMap D1 database (147 attention mechanism papers)",
    "-- Run: npx wrangler d1 execute scholarmap-db --file=./db/seed.sql",
    "",
    "DELETE FROM papers;",
    "",
    "INSERT INTO papers (title, authors, year, abstract, url, citation_count, source, venue, topic, created_at) VALUES",
  ];

  const values = papers.map((p) => {
    return `('${escapeSql(p.title)}', '${escapeSql(p.authors)}', '${escapeSql(p.year)}', '${escapeSql(p.abstract)}', '${escapeSql(p.url)}', '${escapeSql(p.citationCount)}', '${escapeSql(p.source)}', '${escapeSql(p.venue)}', '${escapeSql(p.topic)}', datetime('now'))`;
  });

  lines.push(values.join(",\n") + ";");
  return lines.join("\n");
}

function generateSeedTs(papers) {
  const entries = papers
    .map((p) => {
      return `  { title: ${JSON.stringify(p.title)}, authors: ${JSON.stringify(p.authors)}, year: ${JSON.stringify(p.year)}, abstract: ${JSON.stringify(p.abstract)}, url: ${JSON.stringify(p.url)}, citationCount: ${JSON.stringify(p.citationCount)}, source: ${JSON.stringify(p.source)}, venue: ${JSON.stringify(p.venue)}, topic: ${JSON.stringify(p.topic)} }`;
    })
    .join(",\n");

  return `import { getDb } from "../api/queries/connection";
import { papers } from "./schema";

const paperData = [
${entries}
];

async function seed() {
  const db = getDb();
  console.log(\`Seeding \${paperData.length} papers...\`);

  await db.delete(papers);

  for (const paper of paperData) {
    await db.insert(papers).values(paper);
  }

  console.log("Done! Papers seeded.");
}

seed().catch(console.error);
`;
}

const papers = loadPapers();
console.log(`Generated ${papers.length} papers`);

fs.writeFileSync(path.join(ROOT, "db/seed.sql"), generateSeedSql(papers));
fs.writeFileSync(path.join(ROOT, "db/seed-papers.ts"), generateSeedTs(papers));
console.log("Wrote db/seed.sql and db/seed-papers.ts");
