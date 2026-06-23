import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { papers } from "@db/schema";
import { like, desc, sql, and, gte } from "drizzle-orm";

export const paperRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        query: z.string().optional(),
        source: z.string().optional(),
        yearFrom: z.string().optional(),
        yearTo: z.string().optional(),
        minCitations: z.number().optional(),
        topic: z.string().optional(),
        sortBy: z.enum(["relevance", "citations", "year", "title"]).default("relevance"),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = input || {};
      const conditions = [];

      if (filters.query && filters.query.length > 0) {
        conditions.push(like(papers.title, `%${filters.query}%`));
      }
      if (filters.source && filters.source !== "all") {
        conditions.push(like(papers.source, `%${filters.source}%`));
      }
      if (filters.yearFrom) {
        conditions.push(gte(papers.year, filters.yearFrom));
      }
      if (filters.topic && filters.topic !== "all") {
        conditions.push(like(papers.topic, `%${filters.topic}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(papers)
        .where(whereClause);
      const total = countResult[0]?.count ?? 0;

      // Build order by
      let orderBy;
      switch (filters.sortBy) {
        case "citations":
          orderBy = desc(sql`cast(${papers.citationCount} as unsigned)`);
          break;
        case "year":
          orderBy = desc(papers.year);
          break;
        case "title":
          orderBy = papers.title;
          break;
        default:
          orderBy = desc(papers.id);
      }

      const offset = ((filters.page ?? 1) - 1) * (filters.limit ?? 20);

      const results = await db
        .select()
        .from(papers)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(filters.limit ?? 20)
        .offset(offset);

      return {
        papers: results,
        total,
        page: filters.page ?? 1,
        totalPages: Math.ceil(total / (filters.limit ?? 20)),
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(papers)
        .where(sql`${papers.id} = ${input.id}`)
        .limit(1);
      return result[0] ?? null;
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        total: sql<number>`count(*)`,
        avgCitations: sql<number>`avg(cast(${papers.citationCount} as unsigned))`,
        sources: sql<number>`count(distinct ${papers.source})`,
        years: sql<number>`count(distinct ${papers.year})`,
      })
      .from(papers);

    return {
      totalPapers: result[0]?.total ?? 0,
      avgCitations: Math.round(result[0]?.avgCitations ?? 0),
      sources: result[0]?.sources ?? 0,
      years: result[0]?.years ?? 0,
    };
  }),

  topics: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        topic: papers.topic,
        count: sql<number>`count(*)`,
      })
      .from(papers)
      .groupBy(papers.topic)
      .orderBy(desc(sql`count(*)`));

    return result.filter((r) => r.topic);
  }),

  yearDistribution: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        year: papers.year,
        count: sql<number>`count(*)`,
      })
      .from(papers)
      .groupBy(papers.year)
      .orderBy(papers.year);

    return result.filter((r) => r.year);
  }),

  venueDistribution: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        venue: papers.venue,
        count: sql<number>`count(*)`,
      })
      .from(papers)
      .groupBy(papers.venue)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return result.filter((r) => r.venue);
  }),
});
