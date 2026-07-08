import { describe, expect, it } from "vitest";
import { createCheckout, verifyLemonSqueezyWebhook } from "./lemonsqueezy";

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("verifyLemonSqueezyWebhook", () => {
  const secret = "ls_test_signing_secret";
  const payload = JSON.stringify({
    meta: { event_name: "subscription_created", custom_data: { user_id: "42" } },
    data: { id: "1", attributes: { status: "active" } },
  });

  it("accepts a correctly signed payload and returns the parsed event", async () => {
    const signature = await signPayload(payload, secret);
    const event = await verifyLemonSqueezyWebhook(payload, signature, secret);
    expect(event.meta.event_name).toBe("subscription_created");
    expect(event.meta.custom_data?.user_id).toBe("42");
  });

  it("accepts an uppercase hex signature", async () => {
    const signature = (await signPayload(payload, secret)).toUpperCase();
    const event = await verifyLemonSqueezyWebhook(payload, signature, secret);
    expect(event.meta.event_name).toBe("subscription_created");
  });

  it("rejects a payload signed with the wrong secret", async () => {
    const signature = await signPayload(payload, "ls_wrong_secret");
    await expect(verifyLemonSqueezyWebhook(payload, signature, secret)).rejects.toThrow(
      "signature verification failed",
    );
  });

  it("rejects a tampered payload", async () => {
    const signature = await signPayload(payload, secret);
    const tampered = payload.replace('"42"', '"1"');
    await expect(verifyLemonSqueezyWebhook(tampered, signature, secret)).rejects.toThrow(
      "signature verification failed",
    );
  });

  it("rejects a missing signature", async () => {
    await expect(verifyLemonSqueezyWebhook(payload, "", secret)).rejects.toThrow(
      "Missing X-Signature header",
    );
  });
});

describe("createCheckout", () => {
  it("throws when LEMONSQUEEZY_API_KEY is not configured", async () => {
    await expect(
      createCheckout({}, { userId: 42, variantId: "123" }),
    ).rejects.toThrow("LEMONSQUEEZY_API_KEY is not configured");
  });

  it("throws when LEMONSQUEEZY_STORE_ID is not configured", async () => {
    await expect(
      createCheckout({ LEMONSQUEEZY_API_KEY: "key" }, { userId: 42, variantId: "123" }),
    ).rejects.toThrow("LEMONSQUEEZY_STORE_ID is not configured");
  });
});
