# API Sentinel — Environment & Configuration

## Environment Variables

Create a `.env` file at the project root (already `.gitignore`d):

```env
# PostgreSQL connection string (from Neon dashboard → Connection Details)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Better Auth secret — any long random string
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=""

# GitHub OAuth app (github.com/settings/developers)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Google OAuth app (console.cloud.google.com)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Cron authentication — any secret string you choose
# Set this in Vercel env vars too — Vercel injects it automatically on every cron invocation
CRON_SECRET=""
```

> If any OAuth variable is missing the server throws at startup, not silently on first login.

---

## Database Migrations

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Create a new migration after editing prisma/schema.prisma
npx prisma migrate dev --name describe-your-change
```

Migrations live in `prisma/migrations/`. Never edit a migration file after it has been applied.

---

## Triggering the Cron Worker Manually

```bash
curl http://localhost:3000/api/cron/run-checks \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Expected response:

```json
{ "checked": 2, "failures": 0, "skipped": 0, "durationMs": 843 }
```

In production on Vercel, the cron runs automatically every minute per `vercel.json`.
Vercel injects the `Authorization` header from your project env vars — no extra configuration needed.

---

## Local Development

```bash
pnpm install       # install dependencies
pnpm dev           # start dev server at http://localhost:3000
pnpm lint          # run ESLint
pnpm build         # production build
```

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Set all environment variables from the `.env` section above in the Vercel project settings
4. The cron schedule is defined in `vercel.json` — Vercel picks it up automatically on deploy

> Vercel automatically injects `Authorization: Bearer <CRON_SECRET>` on every
> cron invocation. No extra configuration needed.
