import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import {
  MAX_PAPERS,
  MIN_PAPERS,
  SYNTHESIS_MODEL,
  synthesizeLiterature,
  workersAiChatCompleter,
  type SynthesisPaper,
} from "./sources/synthesis";

const paperInput = z.object({
  title: z.string().min(1).max(500),
  authors: z.array(z.string().max(200)).max(40).default([]),
  year: z.number().int().min(1900).max(2100),
  abstract: z.string().max(8000).default(""),
  url: z.string().max(2000).default(""),
});

/**
 * Literature synthesis over a user-selected paper set.
 * Public (like detector) so BiGG demos work without login; gated by
 * Workers AI availability and hard paper-count limits. Pro quota can
 * layer on later without changing the request shape.
 */
export const synthesisRouter = createRouter({
  generate: publicQuery
    .input(
      z.object({
        papers: z.array(paperInput).min(MIN_PAPERS).max(MAX_PAPERS),
        question: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const complete = workersAiChatCompleter(ctx.env?.AI);
      if (!complete) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Workers AI is not enabled on this deployment. Enable Workers AI in the Cloudflare dashboard to use literature synthesis.",
        });
      }

      const papers: SynthesisPaper[] = input.papers.map((p) => ({
        title: p.title,
        authors: p.authors,
        year: p.year,
        abstract: p.abstract,
        url: p.url,
      }));

      try {
        return await synthesizeLiterature(papers, complete, {
          question: input.question,
          model: SYNTHESIS_MODEL,
        });
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error ? err.message : "Synthesis could not be generated.",
        });
      }
    }),
});
