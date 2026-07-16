import { authRouter } from "./auth-router";
import { detectorRouter } from "./detector-router";
import { mapRouter } from "./map-router";
import { paperRouter } from "./paper-router";
import { synthesisRouter } from "./synthesis-router";
import { libraryRouter } from "./library-router";
import { subscriptionRouter } from "./subscription-router";
import { billingRouter } from "./billing-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  detector: detectorRouter,
  map: mapRouter,
  paper: paperRouter,
  synthesis: synthesisRouter,
  library: libraryRouter,
  subscription: subscriptionRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
