# Deploying ScholarMap to Cloudflare Workers

## Prerequisites

1. A Cloudflare account (free at https://dash.cloudflare.com/sign-up)
2. Wrangler CLI installed (already included in this project)
3. Your Cloudflare API token

## Step 1: Login to Cloudflare

```bash
npx wrangler login
```

This opens a browser to authenticate.

## Step 2: Create D1 Database

```bash
npx wrangler d1 create scholarmap-db
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "scholarmap-db"
database_id = "YOUR-ACTUAL-DATABASE-ID"
```

## Step 3: Set Secrets

```bash
npx wrangler secret put KIMI_CLIENT_ID
npx wrangler secret put KIMI_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put JWT_SECRET
```

For each, you'll be prompted to enter the value.

Generate a SESSION_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Seed the Database

```bash
npx wrangler d1 execute scholarmap-db --file=./db/seed.sql
```

Or create a seed script that runs via the API.

## Step 5: Update APP_URL

Edit `wrangler.toml` and set your actual Worker URL:

```toml
[vars]
APP_URL = "https://scholarmap.YOUR-SUBDOMAIN.workers.dev"
KIMI_AUTH_URL = "https://api.kimi.moonshot.cn"
```

## Step 6: Deploy!

```bash
npm run deploy:cf
```

Your app will be live at `https://scholarmap.YOUR-SUBDOMAIN.workers.dev`

## Architecture

```
Cloudflare Edge Network
    |
    +-- Cloudflare Worker (Hono)
    |       +-- /api/trpc/*  --> tRPC API
    |       |       +-- paper.list
    |       |       +-- paper.stats
    |       |       +-- paper.topics
    |       |       +-- library.save
    |       |       +-- library.list
    |       |       +-- subscription.get
    |       |       +-- auth.me
    |       |       +-- auth.logout
    |       +-- /api/oauth/callback  --> OAuth
    |       +-- /*  --> Static SPA
    |
    +-- D1 Database (SQLite)
    |       +-- users
    |       +-- papers
    |       +-- saved_papers
    |       +-- search_logs
    |       +-- subscriptions
    |
    +-- Static Assets (dist/public)
            +-- index.html
            +-- assets/*.js
            +-- assets/*.css
```

## Features on Cloudflare

| Feature | Status |
|---------|--------|
| React SPA (dark theme) | Ready |
| tRPC API with type safety | Ready |
| D1 SQLite database | Ready |
| OAuth authentication | Ready |
| Paper search & listing | Ready |
| Library (save/organize) | Ready |
| Subscription tracking | Ready |
| Analytics endpoints | Ready |
| Global edge deployment | Ready |
| Auto-scaling | Ready |
| Free tier eligible | Yes |

## Free Tier Limits

- **Workers**: 100,000 requests/day
- **D1**: 5M rows read/day, 100K rows written/day
- **KV**: Not used (D1 for everything)
- **Static assets**: Served from Workers

Perfect for a SaaS MVP!
