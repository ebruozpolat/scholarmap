import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { subscriptions } from "@db/schema";
import { eq } from "drizzle-orm";
import {
  createCheckout,
  verifyLemonSqueezyWebhook,
  type LemonSqueezyEnv,
} from "./lib/lemonsqueezy";
import type { TrpcContext } from "./context";

function getBillingEnv(ctx: TrpcContext): LemonSqueezyEnv {
  return ((ctx as TrpcContext & { env?: LemonSqueezyEnv }).env ?? process.env) as LemonSqueezyEnv;
}

export const billingRouter = createRouter({
  createCheckout: authedQuery
    .input(
      z
        .object({ interval: z.enum(["monthly", "yearly"]).default("monthly") })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const env = getBillingEnv(ctx);
      const interval = input?.interval ?? "monthly";
      const variantId =
        interval === "yearly"
          ? env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID
          : env.LEMONSQUEEZY_PRO_VARIANT_ID;

      if (!env.LEMONSQUEEZY_API_KEY || !env.LEMONSQUEEZY_STORE_ID) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Billing is not configured. Add the LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID secrets.",
        });
      }
      if (!variantId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            interval === "yearly"
              ? "Annual billing is not configured. Add the LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID secret or choose monthly billing."
              : "Billing is not configured. Add the LEMONSQUEEZY_PRO_VARIANT_ID secret.",
        });
      }

      const checkout = await createCheckout(env, {
        userId: ctx.user.id,
        email: ctx.user.email,
        variantId,
      });

      if (!checkout.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Lemon Squeezy did not return a checkout URL",
        });
      }

      return { url: checkout.url, checkoutId: checkout.id };
    }),
});

// Subscription lifecycle: creation (or resume) upgrades the user to Pro;
// expiry downgrades to Free. `subscription_cancelled` is intentionally not
// handled — the customer keeps Pro access until the paid period expires,
// at which point Lemon Squeezy sends `subscription_expired`.
const PRO_EVENTS = new Set([
  "subscription_created",
  "subscription_resumed",
  "subscription_unpaused",
]);
const FREE_EVENTS = new Set(["subscription_expired"]);

export async function handleLemonSqueezyWebhook(
  env: LemonSqueezyEnv,
  payload: string,
  signature: string | null,
) {
  if (!env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
  }

  const event = await verifyLemonSqueezyWebhook(
    payload,
    signature ?? "",
    env.LEMONSQUEEZY_WEBHOOK_SECRET,
  );

  const eventName = event.meta?.event_name ?? "";
  const userId = Number(event.meta?.custom_data?.user_id);
  if (!userId || (!PRO_EVENTS.has(eventName) && !FREE_EVENTS.has(eventName))) {
    return { received: true };
  }

  const db = getDb();

  if (PRO_EVENTS.has(eventName)) {
    // Upsert: the user may have paid before ever opening a page that
    // auto-creates their subscription row.
    await db
      .insert(subscriptions)
      .values({
        userId,
        plan: "pro",
        searchesLimit: "999999",
        searchesUsed: "0",
      })
      .onDuplicateKeyUpdate({
        set: {
          plan: "pro",
          searchesLimit: "999999",
          searchesUsed: "0",
        },
      });
  } else {
    await db
      .update(subscriptions)
      .set({
        plan: "free",
        searchesLimit: "10",
        searchesUsed: "0",
      })
      .where(eq(subscriptions.userId, userId));
  }

  return { received: true };
}
