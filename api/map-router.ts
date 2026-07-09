import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { fetchCitationGraph, resolveWork } from "./sources/openalex";

export const mapRouter = createRouter({
  // Resolve a DOI / title / OpenAlex id and return its citation graph:
  // the paper, its most-cited references, and works citing it.
  graph: publicQuery
    .input(
      z.object({
        query: z.string().min(1),
        refLimit: z.number().min(1).max(25).default(12),
        citedByLimit: z.number().min(0).max(25).default(12),
      })
    )
    .query(async ({ input }) => {
      const center = await resolveWork(input.query);
      if (!center) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No paper matched that DOI or title.",
        });
      }
      return fetchCitationGraph({
        center,
        refLimit: input.refLimit,
        citedByLimit: input.citedByLimit,
      });
    }),

  // Fetch the neighborhood of one node so the client can grow the map.
  expand: publicQuery
    .input(
      z.object({
        id: z.string().regex(/^W\d+$/i, "Expected an OpenAlex work id like W123"),
        refLimit: z.number().min(1).max(25).default(8),
        citedByLimit: z.number().min(0).max(25).default(8),
      })
    )
    .query(async ({ input }) => {
      const center = await resolveWork(input.id);
      if (!center) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paper not found." });
      }
      return fetchCitationGraph({
        center,
        refLimit: input.refLimit,
        citedByLimit: input.citedByLimit,
      });
    }),
});
