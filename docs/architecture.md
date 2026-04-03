# API Sentinel — Architecture

## What it is

A self-hosted API monitoring tool. You configure monitors (URL + interval), the
background worker checks them on schedule, failures become incidents, and the
dashboard shows uptime and incident history. AI triage is planned for future days.

---

## Tech Stack

| Layer         | Technology                               |
| ------------- | ---------------------------------------- |
| Framework     | Next.js 16 (App Router)                  |
| Language      | TypeScript 5 (strict)                    |
| Styling       | Tailwind CSS v4, CVA, next-themes        |
| UI Primitives | @base-ui/react (shadcn-style components) |
| Forms         | React Hook Form + Zod v4                 |
| Auth          | Better Auth 1.5.5                        |
| Database      | PostgreSQL (Neon) via Prisma 7           |
| Notifications | Sonner (toasts)                          |
| Deployment    | Vercel (cron via vercel.json)            |

---

## Folder Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes group (no dashboard layout)
│   │   ├── layout.tsx          # Branding panel + form zone
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── api/
│   │   ├── auth/[...all]/      # Better Auth catch-all handler
│   │   ├── monitors/[id]/check/ # POST — manual check trigger
│   │   └── cron/run-checks/    # GET — Vercel Cron worker entry point
│   ├── dashboard/              # Protected routes (guarded by layout)
│   │   ├── layout.tsx          # Session guard + Sidebar + TopBar
│   │   ├── page.tsx            # Home — stat cards (monitors, uptime, incidents)
│   │   ├── monitors/page.tsx   # Monitor list + CRUD
│   │   ├── profile/page.tsx    # User profile
│   │   └── sessions/page.tsx   # Active sessions + revoke
│   ├── layout.tsx              # Root layout (ThemeProvider, Toaster)
│   └── page.tsx                # Home redirect (→ /dashboard or /login)
├── components/
│   ├── auth/                   # LoginForm, RegisterForm, OAuthButtons
│   ├── layout/                 # Sidebar, TopBar
│   ├── monitors/               # MonitorDialog (create/edit), MonitorList
│   ├── sessions/               # SessionsTable
│   ├── shared/                 # ThemeProvider, ThemeToggle
│   └── ui/                     # 15 base-ui/shadcn primitives
├── lib/
│   ├── auth.ts                 # Better Auth server config
│   ├── auth-client.ts          # Better Auth client (signIn, signOut, useSession)
│   ├── prisma.ts               # PrismaClient singleton
│   ├── session.ts              # getRequiredSession / getOptionalSession
│   ├── utils.ts                # cn(), timeAgo()
│   ├── actions/monitors.ts     # Server Actions: create, update, delete, toggle
│   ├── checks/runCheck.ts      # Health check engine
│   ├── worker/dispatch.ts      # Cron dispatcher (p-limit fan-out)
│   ├── constants/
│   │   ├── monitors.ts         # INTERVALS, ERROR_LABELS, ENV_LABELS, magic numbers
│   │   ├── nav.ts              # Sidebar nav items
│   │   └── user.ts             # DEFAULT_PLAN
│   └── validations/
│       ├── auth.ts             # Zod schemas for login/register
│       └── monitor.ts          # MonitorFormSchema + MonitorFormValues
├── types/
│   ├── checks.ts               # CheckOutcome
│   ├── monitors.ts             # Monitor-related types
│   ├── sessions.ts             # Session-related types
│   └── worker.ts               # CronRunSummary
└── generated/prisma/           # Auto-generated Prisma client (do not edit)
```

---

## Database Schema

### Models

**Monitor** — one per tracked endpoint

```
id, userId, name, url, slug (unique)
intervalSec, expectedStatus, timeoutMs, latencyThresholdMs (nullable)
environment (PROD | STAGING | DEV)
isActive, nextCheckAt, lastCheckedAt
```

**CheckResult** — one row per health check execution

```
id, monitorId, checkedAt
statusCode (nullable), latencyMs (nullable)
errorType (nullable): TIMEOUT | DNS_ERROR | CONNECTION_ERROR | STATUS_MISMATCH
responseSnippet (up to 500 chars)
```

**Incident** — one per failure event

```
id, monitorId
type: FAILURE | LATENCY
status: OPEN | CLOSED
startedAt, endedAt (nullable)
incidentSnapshot (JSON — first-check context)
aiTriageText, aiGeneratedAt, aiModel (reserved for Day 6+)
```

**User, Session, Account, Verification** — managed by Better Auth.

### Indexes

- `Monitor`: `[userId]`, `[isActive]`, `[nextCheckAt, isActive]` (cron query)
- `CheckResult`: `[monitorId, checkedAt]` (dashboard uptime query)
- `Incident`: `[monitorId, status]`, `[monitorId, startedAt]`

---

## Key Conventions

### Session pattern

```ts
// In layouts and pages — redirects unauthenticated users
const session = await getRequiredSession();

// In Server Actions — returns null instead of redirecting
const session = await getOptionalSession();
if (!session) return { success: false, error: "Unauthorized" };
```

### Server Action response shape

All actions return a discriminated union — never throw:

```ts
{ success: true }
{ success: false, error: string }
```

### Route handler vs Server Action

- **Dashboard mutations** (create/edit/delete/toggle monitor) → Server Actions
- **Client-triggered side effects** (Run Now button) → `POST /api/monitors/[id]/check`
- **External callers** (Vercel Cron) → `GET /api/cron/run-checks`

There is no general-purpose REST API for monitors. Server Actions are the only
way to mutate data from the dashboard UI.

### Type file locations

- Shared types that cross multiple layers live in `src/types/`
- Zod-inferred types stay co-located with their schema in `src/lib/validations/`
- Generated Prisma types live in `src/generated/prisma/` — import enums from
  `@/generated/prisma/enums`, not from `@/generated/prisma`

### Constants

All tunable numbers live in `src/lib/constants/monitors.ts`. If you see a
magic number in logic, it should be there:

- `RESPONSE_SNIPPET_MAX_LENGTH = 500`
- `CHECK_TRANSACTION_TIMEOUT_MS = 15_000`
- `CRON_CONCURRENCY = 5`
- `DEFAULT_LATENCY_THRESHOLD_MS = 2_000`

---

## Feature Flows

### Authentication flow

```
/login or /register
  → LoginForm / RegisterForm (RHF + Zod)
  → authClient.signIn / signUp (Better Auth client)
  → POST /api/auth/[...all] (Better Auth server handler)
  → Prisma writes User + Session + Account rows
  → redirect to /dashboard
```

On every dashboard request:

```
DashboardLayout
  → getRequiredSession()
  → auth.api.getSession({ headers })  ← reads the session cookie
  → if null → redirect("/login")
  → if valid → render Sidebar + TopBar + page
```

### Monitor lifecycle

```
MonitorDialog (form)
  → createMonitor() Server Action
    → validate with MonitorFormSchema (Zod)
    → generateSlug()
    → prisma.monitor.create()
    → revalidatePath("/dashboard/monitors")

MonitorList
  → toggleMonitor() → prisma.monitor.update({ isActive })
  → deleteMonitor() → prisma.monitor.delete()
  → Play button → POST /api/monitors/[id]/check → runCheck()
```

### Health check engine (`runCheck.ts`)

```
runCheck(monitorId, { updateNextCheckAt })
  1. Load monitor from DB
  2. fetchUrlWithRetry(url, timeoutMs)
     ├── fetchUrl() — AbortController timeout, record latency
     └── if CONNECTION_ERROR → wait 1s → retry once
  3. Classify result:
     ├── networkError takes priority (TIMEOUT / DNS_ERROR / CONNECTION_ERROR)
     └── statusCode mismatch → STATUS_MISMATCH
  4. latencyWarning = ok && latencyThresholdMs != null && latencyMs > latencyThresholdMs
  5. $transaction:
     ├── findFirst open FAILURE incident
     ├── findFirst open LATENCY incident
     ├── checkResult.create()
     ├── monitor.update(lastCheckedAt, nextCheckAt?)
     ├── FAILURE lifecycle: open on first fail, close on recovery
     └── LATENCY lifecycle: open when slow + threshold set, close on recovery
  6. Return CheckOutcome { statusCode, latencyMs, errorType, ok, latencyWarning }
```

### Cron worker flow

```
Vercel Cron (every minute)
  → GET /api/cron/run-checks
  → validate Authorization: Bearer CRON_SECRET
  → dispatchDueChecks()
      → prisma.monitor.findMany({ isActive: true, nextCheckAt: { lte: now } })
      → pLimit(CRON_CONCURRENCY=5) fan-out
          → runCheck(id, { updateNextCheckAt: true })
      → return CronRunSummary { checked, failures, skipped, durationMs }
  → 200 JSON response (visible in Vercel cron logs)
```

### Dashboard stat cards

```
DashboardPage (server component)
  → prisma.monitor.findMany({ select: id })  ← get user's monitor IDs
  → Promise.all([
      checkResult.count(last 24h, all monitors),
      checkResult.count(last 24h, errorType: null),   ← healthy only
      incident.count(last 30d, status: OPEN)
    ])
  → uptime % = (healthy / total) * 100
  → displayed as "XX.X%" or "—" if no data
```
