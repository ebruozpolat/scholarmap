# GitHub Actions Setup for ScholarMap

This project uses **GitHub Actions** for CI/CD — every push to `main` or `cf` branch automatically builds and deploys to Cloudflare Workers at `scholarmap.io`.

## Required GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 2 secrets:

### 1. `CLOUDFLARE_API_TOKEN`

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Custom token** template
4. Configure permissions:

| Permission | Setting |
|-----------|---------|
| Account | Cloudflare Workers:Scripts | Edit |
| Account | Account:Read | Read |
| Zone | Workers Routes | Edit |
| Zone | Zone:Read | Read |

5. Account Resources: Include your account
6. Zone Resources: Include your domain `scholarmap.io`
7. Click **Continue to summary** → **Create Token**
8. Copy the token and paste it as `CLOUDFLARE_API_TOKEN`

### 2. `CLOUDFLARE_ACCOUNT_ID`

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Look at the right sidebar — your **Account ID** is displayed there
3. Copy it and paste as `CLOUDFLARE_ACCOUNT_ID`

## What Happens on Each Push

```
Push to main/cf
    │
    ▼
┌──────────────┐
│ 1. Lint &    │  TypeScript check
│    Type Check │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. Build     │  Vite builds React SPA
│    Frontend  │  Outputs to dist/public/
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. Deploy    │  Wrangler deploys Worker
│    Worker    │  + Static assets to edge
└──────┬───────┘
       │
       ▼
   🚀 LIVE at
   scholarmap.io
```

## Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| **`deploy.yml`** | Push to `main` or `cf` | Full build + deploy to production |
| **`preview.yml`** | Pull request opened/updated | Deploy preview URL for testing |

## Manual Database Migrations

Database migrations don't auto-run (safety). To trigger manually:

```bash
# Include [migrate] in your commit message
git commit -m "feat: add new field [migrate]"
git push origin main
```

Or run locally:
```bash
npx wrangler d1 migrations apply scholarmap-db
```

## Monitoring Deploys

1. Go to your GitHub repo → **Actions** tab
2. See real-time build logs
3. Green checkmark = deployed successfully
4. Red X = check the logs for errors

## Rollback

If a deploy breaks, rollback instantly via Cloudflare dashboard:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages
2. Click **scholarmap** worker
3. Go to **Deployments** tab
4. Click the previous deployment → **Roll back**

Or via Wrangler CLI:
```bash
npx wrangler rollback
```

## Troubleshooting

### "Unauthorized" error in Actions
- Double-check your `CLOUDFLARE_API_TOKEN` has the correct permissions
- Make sure the token includes Zone permissions for `scholarmap.io`

### "No such database" error
- The D1 database must be created before first deploy
- Run: `npx wrangler d1 create scholarmap-db`
- Update `database_id` in `wrangler.toml`

### Build fails
- Check the **Actions** tab for detailed error logs
- Common issues: missing dependencies, TypeScript errors

## Optional: Branch Protection

Protect your `main` branch:

1. GitHub repo → **Settings** → **Branches**
2. Add rule for `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass (select "Lint & Type Check" and "Build Frontend")
   - ✅ Require approvals (1)

This ensures broken code never reaches production.
