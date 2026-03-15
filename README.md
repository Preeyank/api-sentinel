# API Sentinel

AI-powered API monitoring and incident triage tool.

API Sentinel monitors HTTP endpoints, detects failures or latency anomalies, and helps engineers quickly understand incidents through automated diagnostics and AI-generated summaries.

This project is designed as a **production-style portfolio project** demonstrating monitoring architecture, background workers, and observability concepts.

---

## System Architecture

![System Architecture](system-architecture.png)

---

## Project Goal

API Sentinel is being built to demonstrate the design and implementation of a production-style monitoring system, including:

- API health monitoring
- background worker architecture
- failure detection and incident tracking
- observability concepts
- AI-assisted incident triage

---

## Features

- Monitor HTTP/HTTPS endpoints
- Detect downtime and unexpected status codes
- Track response latency
- Persist historical check results
- Incident detection and tracking
- AI-generated incident triage summaries
- Public status page for monitored services

---

## Tech Stack

**Frontend**

- Next.js
- React
- TypeScript

**Backend**

- Next.js API routes
- Node.js background workers

**Database**

- PostgreSQL (Neon)

**ORM**

- Prisma

**AI**

- LLM provider for incident summaries

---

## Running the Project

Install dependencies

```bash
npm install
```

## Run Database Migration

```
npx prisma migrate dev
```

## Start the development server

```
npm run dev
```
