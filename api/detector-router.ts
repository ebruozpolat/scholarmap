import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { analyzeText } from "./detector";

export const detectorRouter = createRouter({
  // Mutation (POST) so long texts don't hit URL-length limits of batched
  // GET queries. The text is analyzed in memory and never persisted.
  analyze: publicQuery
    .input(
      z.object({
        text: z.string().min(1).max(60000),
      })
    )
    .mutation(({ input }) => {
      try {
        return analyzeText(input.text);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Metin analiz edilemedi.",
        });
      }
    }),
});
