import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { subscriptions } from "@db/schema";
import { eq } from "drizzle-orm";
import { createCheckoutSession, type StripeEnv } from "./lib/stripe";
import type { TrpcContext } from "./context";

function getStripeEnv(ctx: TrpcContext): StripeEnv {
  return ((ctx as TrpcContext & { env?: StripeEnv }).env ?? process.env) as StripeEnv;
}

export const stripeRouter = createRouter({
  createCheckout: authedQuery.mutation(async ({ ctx }) => {
    const env = getStripeEnv(ctx);
    const priceId = env.STRIPE_PRO_PRICE_ID;

    if (!env.STRIPE_SECRET_KEY || !priceId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID secrets.",
      });
    }

    const session = await createCheckoutSession(env, {
      userId: ctx.user.id,
      email: ctx.user.email,
      priceId,
    });

    if (!session.url) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe did not return a checkout URL",
      });
    }

    return { url: session.url, sessionId: session.id };
  }),

  getPublishableKey: authedQuery.query(async ({ ctx }) => {
    const env = getStripeEnv(ctx);
    return { publishableKey: env.STRIPE_PUBLISHABLE_KEY ?? null };
  }),
});

export async function handleStripeWebhook(
  env: StripeEnv,
  payload: string,
  signature: string | null,
) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  if (!signature) {
    throw new Error("Missing stripe-signature header");
  }

  const { verifyStripeWebhook } = await import("./lib/stripe");
  const event = await verifyStripeWebhook(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as {
        metadata?: { userId?: string };
        client_reference_id?: string;
      };
      const userId = Number(session.metadata?.userId ?? session.client_reference_id);
      if (!userId) break;

      await db
        .update(subscriptions)
        .set({
          plan: "pro",
          searchesLimit: "999999",
          searchesUsed: "0",
        })
        .where(eq(subscriptions.userId, userId));
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as {
        metadata?: { userId?: string };
      };
      const userId = Number(subscription.metadata?.userId);
      if (!userId) break;

      await db
        .update(subscriptions)
        .set({
          plan: "free",
          searchesLimit: "10",
          searchesUsed: "0",
        })
        .where(eq(subscriptions.userId, userId));
      break;
    }
    default:
      break;
  }

  return { received: true };
}
