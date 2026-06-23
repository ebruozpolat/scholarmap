# ScholarMap

A premium academic research platform for discovering, analyzing, and organizing scholarly papers. ScholarMap started as a focused explorer for attention-mechanism / transformer research and is built to extend to any academic topic.

**Live demo:** https://scholarmap.alignxdigital.workers.dev

## Features

- **Advanced search** — query papers across sources (arXiv, Google Scholar) with keyword, author, and year filters.
- **Interactive dashboard** — browse results in table/card views with sorting and filtering.
- **Topic analysis** — automatic topic categorization, trend charts, and citation distribution.
- **Personal library** — save favorite papers and organize them into collections.
- **Subscriptions** — Free tier (10 searches/day) and Pro tier (unlimited + advanced analytics).
- **Authentication** — sign in with Kimi OAuth.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 3, shadcn/ui |
| API | tRPC 11, Hono |
| ORM | Drizzle ORM |
| Database | Cloudflare D1 (SQLite) in production; MySQL for the Node target |
| Auth | Kimi OAuth (JWT sessions via `jose`) |
| Deployment | Cloudflare Workers (edge) |

The tRPC API is organized into four routers: `auth`, `paper`, `library`, and `subscription`.

## Project structure

```
api/            tRPC routers, Hono entry points, Kimi OAuth, DB queries
  cf-worker.ts  Cloudflare Workers entry point
  boot.ts       Node server entry point
app/ , src/     React frontend (sections, hooks, types, UI components)
contracts/      Shared constants, types, and error definitions
db/             Drizzle schema, D1 schema (schema-cf.sql), seeds, migrations
wrangler.toml   Cloudflare Workers configuration
```

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev          # Vite dev server at http://localhost:3000
```

Copy `.env.example` to `.env` and fill in the values for local development.

### Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build the client and the Node server bundle |
| `npm run build:cf` | Build the client for Cloudflare (`dist/public`) |
| `npm run deploy:cf` | Deploy to Cloudflare Workers (`wrangler deploy`) |
| `npm run check` | Type-check the project |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest suite |
| `npm run db:generate` / `db:migrate` / `db:push` | Drizzle Kit database tasks |

## Deployment (Cloudflare Workers)

A full walkthrough lives in [`CLOUDFLARE-DEPLOY.md`](./CLOUDFLARE-DEPLOY.md). In short:

```bash
# 1. Authenticate
npx wrangler login

# 2. Create the D1 database and put its id in wrangler.toml
npx wrangler d1 create scholarmap-db

# 3. Apply schema and seed data (use --remote for production)
npx wrangler d1 execute scholarmap-db --remote --file=./db/schema-cf.sql
npx wrangler d1 execute scholarmap-db --remote --file=./db/seed.sql

# 4. Set secrets
npx wrangler secret put KIMI_CLIENT_ID
npx wrangler secret put KIMI_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put JWT_SECRET

# 5. Deploy
npm run deploy:cf
```

Custom-domain routes for `scholarmap.io` are included in `wrangler.toml` (commented out). Enable them once the zone is added to your Cloudflare account.

## License

Private project. All rights reserved.
