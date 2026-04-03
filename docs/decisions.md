# API Sentinel — Decision Log

Personal context for the project. Not committed to the repo.
Updated by Copilot at the end of each implementation day.

---

## Day 1 — Project Setup

**Neon (serverless Postgres) over local/self-hosted**
Neon gives a free hosted Postgres instance with a connection string that works
identically in local dev and on Vercel. No Docker, no local pg daemon needed.
The tradeoff is cold-start latency on the first query after idle; acceptable for
a monitoring tool that has continuous traffic from the cron worker.

**Custom Prisma output path (`src/generated/prisma/`)**
Prisma defaults to generating the client inside `node_modules`. We override this
to `src/generated/prisma/` so TypeScript can resolve the generated types through
the `@/` path alias without any extra tsconfig gymnastics. The folder is
`.gitignore`d — it is always regenerated from `schema.prisma`.

**SSL enforced on PG pool (`rejectUnauthorized: true`)**
Neon requires SSL. We set this explicitly rather than relying on the connection
string parameter so it's impossible to accidentally turn off.

**`next.config.ts` kept minimal**
Only `devIndicators: false`. No `experimental` flags, no custom webpack. The
principle is: add config only when you have a concrete reason to.

---

## Day 2 — Authentication

**Migrated from Auth.js (NextAuth) to Better Auth mid-day**
Auth.js requires you to pick a session strategy (JWT vs DB), configure an
adapter, and manually define the User/Session/Account schema. Better Auth ships
with a Prisma adapter that owns its own schema migration, handles OAuth token
storage, and has first-class TypeScript types. The migration happened because
Auth.js's Prisma adapter had friction with our custom `User` fields (role, plan).

**`requireEnv()` guard in `auth.ts`**
Crashes the server at startup (not at runtime) if `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, or `GOOGLE_CLIENT_SECRET` are
missing. This is intentional — a misconfigured OAuth setup should be loud
immediately, not silently break on the first login attempt.

**`getRequiredSession()` redirects, `getOptionalSession()` returns null**
Pages should redirect unauthenticated users. Server Actions should return a
structured `{ success: false, error: "Unauthorized" }` instead of throwing or
redirecting — callers (client components) can handle that gracefully. Mixing
`redirect()` into an action would break optimistic updates.

**OAuth: GitHub + Google only**
These cover the two most common developer sign-in flows. Adding more providers
is one `socialProviders` entry in `auth.ts`; there's no structural work to do.

**Home page (`/`) is a pure redirect**
No landing page built. `/` reads the session and bounces to `/dashboard` or
`/login`. A marketing landing page is out of scope for the monitoring tool itself.

**Dashboard layout fetches `plan` from DB separately**
Better Auth's session object only carries the fields Better Auth manages
(id, name, email, emailVerified, image). Our custom `plan` field is an app-level
concern. The layout queries `prisma.user.findUnique({ select: { plan: true } })`
every render and falls back to `DEFAULT_PLAN` if the query returns null.

---

## Day 3 — Monitor Management

**Server Actions for all CRUD, no REST API for monitors**
Next.js Server Actions are the idiomatic App Router pattern for mutations from
the dashboard. They colocate auth, validation, DB write, and cache invalidation
in one function. A REST API (`GET /api/monitors`, `POST /api/monitors`, etc.)
would be needed only for external programmatic access (CLI, third-party
integrations). That need doesn't exist yet — deferred indefinitely.

**`getOwnedMonitor()` helper**
All mutating actions (update, delete, toggle) call this before doing anything.
It verifies both existence and ownership (`monitor.userId === session.user.id`).
Without this, a user could delete another user's monitor by guessing its ID.
This is horizontal privilege escalation prevention.

**Slug generation strategy**
`name` → lowercase → strip non-alphanum → max 50 chars → replace spaces with `-`
→ append `-N` counter up to 100 attempts if collision. Chosen over UUIDs for
readability in URLs (future: public status page at `/status/[slug]`).
100 attempts is a safety cap; in practice slugs collide only when many monitors
have the same name.

**Server Action response shape: discriminated union**
All actions return `{ success: true }` or `{ success: false, error: string }`.
The `as const` assertion on `success` makes TypeScript narrow the type at the
callsite without needing a try/catch. This pattern is used consistently
everywhere — never throw from an action, always return.

---

## Day 4 — Health Check Engine

**`POST /api/monitors/[id]/check` is the only "CRUD-adjacent" REST route**
The "Run Now" button in `MonitorList` is a client component. Client components
can't call Server Actions directly as fire-and-forget side effects with a
loading state — they need `fetch()`. So this endpoint exists specifically to
serve the Play button. It intentionally doesn't touch `nextCheckAt`
(`updateNextCheckAt: false`).

**`redirect: "follow"` on fetch**
We follow HTTP redirects and record the final status code. A 301 that lands on a
200 is healthy. A monitor that points to a redirecting URL is valid — we don't
penalise redirect chains.

**Response snippet truncated before the DB write**
`text.slice(0, 500)` happens in `fetchUrl()`, not in the Prisma `create()` call.
This means we never put a multi-MB response body through the serialisation
pipeline. The DB column is also capped at `@db.VarChar(500)` as a second layer.

**Transaction isolation for incident deduplication**
The open-incident `findFirst` lives inside `$transaction` alongside the
`checkResult.create` and `monitor.update`. Two cron invocations racing on the
same monitor could both find no open incident and each create one — the
transaction prevents this by serialising the read-check-write sequence.

**`CHECK_TRANSACTION_TIMEOUT_MS = 15_000`**
Prisma's default interactive transaction timeout is 5 s. A single check run can
take up to `timeoutMs` (default 5 s) + 1 s retry delay = 6 s just for the HTTP
fetch, leaving zero budget for the DB writes. 15 s gives comfortable headroom
without being absurdly long.

---

## Day 5 — Background Worker

**Vercel Cron + Next.js route, no separate worker service**
At this scale (tens to low hundreds of monitors), a serverless function triggered
every minute is entirely sufficient. No queue (BullMQ, SQS), no separate Node.js
process, no Redis. The tradeoff is the 60-second minimum cron interval and the
Vercel free-tier cron invocation limits — acceptable for now.

**Vercel Cron fires GET, not POST**
This is a Vercel constraint. The cron route is a `GET` handler. To prevent
accidental public access, we validate `Authorization: Bearer CRON_SECRET` before
doing anything. Vercel injects this header automatically in production from the
project's env vars.

**Retry only on `CONNECTION_ERROR`, not on `DNS_ERROR` or `TIMEOUT`**

- `DNS_ERROR`: the hostname doesn't resolve. Retrying immediately will get the
  same result — the DNS record doesn't exist or hasn't propagated. Persistent.
- `TIMEOUT`: the server is slow. A second attempt would burn double the timeout
  budget on an endpoint that's already degraded. If it's truly flapping, the
  next scheduled check will catch it.
- `CONNECTION_ERROR`: TCP connection refused, reset by peer, ECONNREFUSED. These
  are often transient (process restart, brief network blip). One retry after 1 s
  is the right call.

**`CRON_CONCURRENCY = 5` in constants**
Limits simultaneous outbound HTTP checks to 5. This is the right knob to tune
if the function hits connection pool limits or if target servers start rate-limiting
the monitoring source IP. Lives in `src/lib/constants/monitors.ts` so it's one
place to change.

**FAILURE and LATENCY incidents are independent**
A monitor can have both open simultaneously: a slow response that returns the
wrong status code opens a FAILURE incident; if latency also exceeds the
threshold, a separate LATENCY incident opens. They close independently on
recovery. This required splitting the single `openIncident` query (Day 4) into
two typed queries: one filtering `type: "FAILURE"`, one `type: "LATENCY"`.

**`latencyThresholdMs Int?` is per-monitor, opt-in**
Added in Day 5 (not Day 3) alongside the LATENCY incident implementation.
When null, no latency incidents are opened for that monitor. This was originally
implemented as `timeoutMs * 0.75` (a heuristic) but changed to an explicit
nullable field so users can configure it themselves or disable it entirely.
Required two migrations: `20260402191317_add_latency_threshold` (added as
required) then `20260402191840_latency_threshold_optional` (made nullable).
The Zod schema in `src/lib/validations/monitor.ts` also received the field:
`latencyThresholdMs: z.number().int().min(100).max(29000).nullable()`.

**Magic numbers moved to `src/lib/constants/monitors.ts`**
`RESPONSE_SNIPPET_MAX_LENGTH`, `CHECK_TRANSACTION_TIMEOUT_MS`, `CRON_CONCURRENCY`,
`DEFAULT_LATENCY_THRESHOLD_MS`. One place to find all tunable parameters. The
rule: if a number appears in logic and has a non-obvious meaning, it belongs here.
