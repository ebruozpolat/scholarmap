import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { subscriptions, searchLogs } from "@db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

export const subscriptionRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (result.length === 0) {
      // Auto-create free subscription
      await db.insert(subscriptions).values({
        userId,
        plan: "free",
        searchesUsed: "0",
        searchesLimit: "10",
      });

      return {
        plan: "free" as const,
        searchesUsed: 0,
        searchesLimit: 10,
        searchesRemaining: 10,
        isPro: false,
      };
    }

    const sub = result[0];
    const used = parseInt(sub.searchesUsed ?? "0", 10);
    const limit = parseInt(sub.searchesLimit ?? "10", 10);

    return {
      plan: sub.plan as "free" | "pro",
      searchesUsed: used,
      searchesLimit: limit,
      searchesRemaining: Math.max(0, limit - used),
      isPro: sub.plan === "pro",
      expiresAt: sub.expiresAt,
    };
  }),

  trackSearch: authedQuery
    .input(
      z.object({
        query: z.string(),
        resultsCount: z.number().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Log the search
      await db.insert(searchLogs).values({
        userId,
        query: input.query,
        resultsCount: input.resultsCount?.toString(),
        source: input.source,
      });

      // Increment search usage
      const sub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (sub.length > 0) {
        const currentUsed = parseInt(sub[0].searchesUsed ?? "0", 10);
        await db
          .update(subscriptions)
          .set({ searchesUsed: (currentUsed + 1).toString() })
          .where(eq(subscriptions.userId, userId));
      }

      return { success: true };
    }),

  upgrade: authedQuery
    .input(z.object({ plan: z.enum(["free", "pro"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const limit = input.plan === "pro" ? "999999" : "10";

      await db
        .update(subscriptions)
        .set({
          plan: input.plan,
          searchesLimit: limit,
          searchesUsed: "0",
        })
        .where(eq(subscriptions.userId, userId));

      return { success: true, plan: input.plan };
    }),
});
