# API Sentinel

API monitoring and incident triage tool.

API Sentinel monitors HTTP endpoints, detects failures and latency anomalies, and surfaces AI-generated incident summaries to help engineers diagnose and resolve issues faster.

---

## System Architecture

![System Architecture](system-architecture.png)

---

## Features

- Monitor HTTP/HTTPS endpoints on a configurable schedule
- Detect downtime, wrong status codes, and latency degradation
- Automatic incident lifecycle — opens on first failure, closes on recovery
- Background worker with concurrency-limited fan-out (Vercel Cron)
- AI-generated triage summaries _(planned)_
- Public status page _(planned)_
- Alerting and notifications _(planned)_

---

## Implementation Status

### ✅ Completed

- **Auth** — email + password, GitHub & Google OAuth, session management with per-session revoke
- **Dashboard shell** — protected layout, collapsible sidebar, light/dark mode
- **Monitor management** — full CRUD, per-monitor environment, interval, timeout, and latency threshold configuration
- **Health check engine** — manual run, timeout handling, response snippet, error classification, incident open/close lifecycle
- **Background worker** — Vercel Cron every minute, concurrency-limited fan-out, FAILURE + LATENCY incident detection
- **Dashboard stats** — live uptime % (24 h) and open incident count (30 d)

### ⏳ Planned

- AI-generated incident triage summaries
- Public status page
- Alerting / notifications

---

## Documentation

- [docs/setup.md](docs/setup.md) — environment variables, local dev, migrations, deployment
- [docs/architecture.md](docs/architecture.md) — folder structure, conventions, feature flows
