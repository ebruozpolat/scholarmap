// Minimal Lemon Squeezy client built on fetch so it runs unchanged on both
// the Node server and Cloudflare Workers. Lemon Squeezy acts as merchant of
// record, so payments work without a registered company.

export interface LemonSqueezyEnv {
  LEMONSQUEEZY_API_KEY?: string;
  LEMONSQUEEZY_STORE_ID?: string;
  LEMONSQUEEZY_PRO_VARIANT_ID?: string;
  LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID?: string;
  LEMONSQUEEZY_WEBHOOK_SECRET?: string;
  APP_URL?: string;
}

const API_BASE = "https://api.lemonsqueezy.com/v1";

export async function createCheckout(
  env: LemonSqueezyEnv,
  opts: {
    userId: number;
    email?: string | null;
    variantId: string;
  },
) {
  const apiKey = env.LEMONSQUEEZY_API_KEY;
  const storeId = env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY is not configured");
  if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID is not configured");

  const appUrl = (env.APP_URL ?? "https://scholarmap.io").replace(/\/$/, "");

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          ...(opts.email ? { email: opts.email } : {}),
          // Custom values must be strings; they come back on every webhook
          // as meta.custom_data.
          custom: { user_id: String(opts.userId) },
        },
        product_options: {
          redirect_url: `${appUrl}/app/settings?upgrade=success`,
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: opts.variantId } },
      },
    },
  };

  const response = await fetch(`${API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    data?: { id: string; attributes?: { url?: string } };
    errors?: { detail?: string }[];
  };

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.detail ?? `Lemon Squeezy API error (${response.status})`,
    );
  }

  return { id: data.data?.id ?? "", url: data.data?.attributes?.url ?? "" };
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id?: string;
    attributes?: Record<string, unknown>;
  };
}

// Lemon Squeezy signs the raw request body with HMAC-SHA256 (hex digest)
// using the webhook's signing secret; the digest arrives in X-Signature.
export async function verifyLemonSqueezyWebhook(
  payload: string,
  signature: string,
  secret: string,
) {
  if (!signature) {
    throw new Error("Missing X-Signature header");
  }

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
    new TextEncoder().encode(payload),
  );
  const expected = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (!timingSafeEqual(expected, signature.toLowerCase())) {
    throw new Error("Lemon Squeezy webhook signature verification failed");
  }

  return JSON.parse(payload) as LemonSqueezyWebhookEvent;
}
