import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { savedPapers, papers } from "@db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export const libraryRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        collection: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const filters = input || {};

      const conditions = [eq(savedPapers.userId, userId)];
      if (filters.collection) {
        conditions.push(eq(savedPapers.collection, filters.collection));
      }

      const results = await db
        .select({
          savedId: savedPapers.id,
          collection: savedPapers.collection,
          savedAt: savedPapers.createdAt,
          paper: papers,
        })
        .from(savedPapers)
        .innerJoin(papers, eq(savedPapers.paperId, papers.id))
        .where(and(...conditions))
        .orderBy(desc(savedPapers.createdAt))
        .limit(filters.limit ?? 20)
        .offset(((filters.page ?? 1) - 1) * (filters.limit ?? 20));

      return results;
    }),

  collections: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const result = await db
      .select({
        collection: savedPapers.collection,
        count: sql<number>`count(*)`,
      })
      .from(savedPapers)
      .where(eq(savedPapers.userId, userId))
      .groupBy(savedPapers.collection);

    return result;
  }),

  save: authedQuery
    .input(
      z.object({
        paperId: z.number(),
        collection: z.string().default("Favorites"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check if already saved
      const existing = await db
        .select()
        .from(savedPapers)
        .where(
          and(
            eq(savedPapers.userId, userId),
            eq(savedPapers.paperId, input.paperId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { success: false, message: "Already saved" };
      }

      await db.insert(savedPapers).values({
        userId,
        paperId: input.paperId,
        collection: input.collection,
      });

      return { success: true, message: "Paper saved" };
    }),

  unsave: authedQuery
    .input(z.object({ paperId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      await db
        .delete(savedPapers)
        .where(
          and(
            eq(savedPapers.userId, userId),
            eq(savedPapers.paperId, input.paperId)
          )
        );

      return { success: true, message: "Paper removed" };
    }),

  move: authedQuery
    .input(
      z.object({
        paperId: z.number(),
        collection: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      await db
        .update(savedPapers)
        .set({ collection: input.collection })
        .where(
          and(
            eq(savedPapers.userId, userId),
            eq(savedPapers.paperId, input.paperId)
          )
        );

      return { success: true, message: "Moved to " + input.collection };
    }),
});
