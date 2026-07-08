import { authRouter } from "./auth-router";
import { paperRouter } from "./paper-router";
import { libraryRouter } from "./library-router";
import { subscriptionRouter } from "./subscription-router";
import { billingRouter } from "./billing-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  paper: paperRouter,
  library: libraryRouter,
  subscription: subscriptionRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
