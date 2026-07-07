import { describe, expect, it } from "vitest";
import { stripeRequest, verifyStripeWebhook } from "./stripe";

async function signPayload(payload: string, secret: string, timestamp: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("verifyStripeWebhook", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { client_reference_id: "42" } },
  });

  it("accepts a correctly signed payload and returns the parsed event", async () => {
    const timestamp = 1751928000;
    const signature = await signPayload(payload, secret, timestamp);
    const event = await verifyStripeWebhook(payload, `t=${timestamp},v1=${signature}`, secret);
    expect(event.type).toBe("checkout.session.completed");
    expect(event.data.object.client_reference_id).toBe("42");
  });

  it("rejects a payload signed with the wrong secret", async () => {
    const timestamp = 1751928000;
    const signature = await signPayload(payload, "whsec_wrong", timestamp);
    await expect(
      verifyStripeWebhook(payload, `t=${timestamp},v1=${signature}`, secret),
    ).rejects.toThrow("signature verification failed");
  });

  it("rejects a tampered payload", async () => {
    const timestamp = 1751928000;
    const signature = await signPayload(payload, secret, timestamp);
    const tampered = payload.replace('"42"', '"1"');
    await expect(
      verifyStripeWebhook(tampered, `t=${timestamp},v1=${signature}`, secret),
    ).rejects.toThrow("signature verification failed");
  });

  it("rejects a malformed signature header", async () => {
    await expect(verifyStripeWebhook(payload, "garbage", secret)).rejects.toThrow(
      "Invalid Stripe signature header",
    );
  });
});

describe("stripeRequest", () => {
  it("throws when STRIPE_SECRET_KEY is not configured", async () => {
    await expect(stripeRequest({}, "GET", "/products")).rejects.toThrow(
      "STRIPE_SECRET_KEY is not configured",
    );
  });
});
