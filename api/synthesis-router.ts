import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { synthesize } from "./sources/synthesis";

const paperInput = z.object({
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  year: z.number().default(0),
  abstract: z.string().default(""),
  url: z.string().optional(),
});

export const synthesisRouter = createRouter({
  // Generate a source-cited synthesis of the selected papers. This calls a
  // paid LLM API, so in production it should be Pro-gated and quota-limited;
  // left public for the MVP like the detector. The paper abstracts are the
  // retrieval context — the model is instructed to ground every claim in them.
  generate: publicQuery
    .input(
      z.object({
        papers: z.array(paperInput).min(2).max(30),
        question: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const apiKey =
        (ctx.env?.ANTHROPIC_API_KEY as string | undefined) ??
        process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Sentez özelliği henüz yapılandırılmadı (ANTHROPIC_API_KEY eksik).",
        });
      }
      try {
        return await synthesize({
          papers: input.papers,
          question: input.question,
          apiKey,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Sentez üretilemedi.",
        });
      }
    }),
});
