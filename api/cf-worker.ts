import { Hono } from "hono";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { Paths } from "@contracts/constants";
import { createOAuthCallbackHandler } from "./kimi/auth";

// Import this for Cloudflare D1 type augmentation
import type { ExecutionContext } from "@cloudflare/workers-types";

export interface Env {
  DATABASE_URL: string;
  DB: D1Database; // D1 binding
  KIMI_CLIENT_ID: string;
  KIMI_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  JWT_SECRET: string;
  APP_URL: string;
  KIMI_AUTH_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// Health check
app.get("/api/health", (c) => c.json({ ok: true, env: "cloudflare-workers" }));

// OAuth callback
app.get(Paths.oauthCallback, async (c) => {
  // Set env vars from bindings for the auth handler
  const handler = createOAuthCallbackHandler();
  return handler(c.req.raw as any, c.env as any);
});

// tRPC API
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: async (opts) => {
      // Pass D1 database and env to context
      const ctx = await createContext(opts);
      (ctx as any).env = c.env;
      return ctx;
    },
  });
});

// Serve static files (SPA fallback)
app.get("/*", async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;

  // Try to serve static assets
  if (path.startsWith("/assets/")) {
    return new Response("Not found", { status: 404 });
  }

  // SPA fallback - serve index.html for all routes
  try {
    const indexHtml = await c.env?.ASSETS?.fetch?.(new Request(`${url.origin}/index.html`));
    if (indexHtml) return indexHtml;
  } catch {
    // Fallback for when ASSETS binding isn't available
  }

  return new Response(getIndexHtml(), {
    headers: { "Content-Type": "text/html" },
  });
});

function getIndexHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ScholarMap</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #08080C; color: #F0F0F5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; max-width: 600px; padding: 2rem; }
    h1 { font-size: 3rem; font-weight: 700; margin-bottom: 1rem; }
    h1 span { color: #6366F1; }
    p { color: #8A8A98; font-size: 1.125rem; line-height: 1.7; margin-bottom: 2rem; }
    .badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.875rem; border-radius: 9999px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); color: #818CF8; font-size: 0.75rem; font-weight: 500; margin-bottom: 1.5rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; background: #6366F1; color: white; text-decoration: none; font-weight: 500; transition: background 0.2s; border: none; cursor: pointer; }
    .btn:hover { background: #818CF8; }
    .stats { display: flex; justify-content: center; gap: 3rem; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #23232D; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: #5A5A68; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Deployed on Cloudflare Workers</div>
    <h1>ScholarMap <span>API</span></h1>
    <p>The academic research platform backend is running on Cloudflare's edge network. Connect the React frontend to start using the app.</p>
    <a href="/api/health" class="btn">Check API Health</a>
    <div class="stats">
      <div><div class="stat-value">30</div><div class="stat-label">Papers Ready</div></div>
      <div><div class="stat-value">4</div><div class="stat-label">API Routers</div></div>
      <div><div class="stat-value">Edge</div><div class="stat-label">Deployment</div></div>
    </div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
};
