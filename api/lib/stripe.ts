export interface StripeEnv {
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRO_PRICE_ID?: string;
  APP_URL?: string;
}

type StripeParams = Record<string, string | number | undefined>;

function encodeParams(params: StripeParams, prefix = ""): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === "object" && value !== null) {
      parts.push(...encodeParams(value as StripeParams, fullKey));
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

export async function stripeRequest<T>(
  env: StripeEnv,
  method: string,
  path: string,
  params?: StripeParams,
): Promise<T> {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  if (params && method !== "GET") {
    init.body = encodeParams(params).join("&");
  }

  const url =
    method === "GET" && params
      ? `https://api.stripe.com/v1${path}?${encodeParams(params).join("&")}`
      : `https://api.stripe.com/v1${path}`;

  const response = await fetch(url, init);
  const data = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe API error (${response.status})`);
  }

  return data;
}

export async function createCheckoutSession(
  env: StripeEnv,
  opts: {
    userId: number;
    email?: string | null;
    priceId: string;
  },
) {
  const appUrl = (env.APP_URL ?? "https://scholarmap.io").replace(/\/$/, "");

  return stripeRequest<{ id: string; url: string }>(env, "POST", "/checkout/sessions", {
    mode: "subscription",
    success_url: `${appUrl}/app/settings?upgrade=success`,
    cancel_url: `${appUrl}/pricing?upgrade=cancelled`,
    client_reference_id: String(opts.userId),
    "line_items[0][price]": opts.priceId,
    "line_items[0][quantity]": 1,
    "metadata[userId]": String(opts.userId),
    "subscription_data[metadata][userId]": String(opts.userId),
    ...(opts.email ? { customer_email: opts.email } : {}),
  });
}

function parseStripeSignature(header: string) {
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  return { timestamp: parts.t, signature: parts.v1 };
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyStripeWebhook(
  payload: string,
  signatureHeader: string,
  secret: string,
) {
  const { timestamp, signature } = parseStripeSignature(signatureHeader);
  if (!timestamp || !signature) {
    throw new Error("Invalid Stripe signature header");
  }

  const signedPayload = `${timestamp}.${payload}`;
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
    new TextEncoder().encode(signedPayload),
  );
  const expected = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (!timingSafeEqual(expected, signature)) {
    throw new Error("Stripe webhook signature verification failed");
  }

  return JSON.parse(payload) as {
    type: string;
    data: { object: Record<string, unknown> };
  };
}
