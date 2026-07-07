import { authRouter } from "./auth-router";
import { paperRouter } from "./paper-router";
import { libraryRouter } from "./library-router";
import { subscriptionRouter } from "./subscription-router";
import { stripeRouter } from "./stripe-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  paper: paperRouter,
  library: libraryRouter,
  subscription: subscriptionRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
