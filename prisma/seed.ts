// Seed script — development only.
//
// Creates 3 monitors that exercise the full range of check outcomes:
//   Healthy  — reliable public endpoint; always returns 200 quickly
//   Slow     — 3s delay with latencyThresholdMs=2000 → LATENCY incidents
//   Failing  — always returns 500; expectedStatus=200 → FAILURE incidents
//
// Usage:
//   Add SEED_USER_EMAIL=your@email.com to .env, then run:
//   npx prisma db seed

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
    }),
  ),
});

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  if (!email) {
    throw new Error("SEED_USER_EMAIL is not set in .env");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`No user found with email: ${email}. Sign up first, then seed.`);
  }

  console.log(`Seeding monitors for ${user.email}...`);

  const healthy = await prisma.monitor.upsert({
    where: { slug: "demo-healthy" },
    update: {},
    create: {
      userId: user.id,
      name: "GitHub API (Healthy)",
      url: "https://api.github.com",
      slug: "demo-healthy",
      environment: "PROD",
      intervalSec: 60,
      expectedStatus: 200,
      timeoutMs: 10_000,
      latencyThresholdMs: null,
      nextCheckAt: new Date(),
    },
  });

  const slow = await prisma.monitor.upsert({
    where: { slug: "demo-slow" },
    update: {},
    create: {
      userId: user.id,
      name: "Slow Endpoint (Latency Demo)",
      url: "https://httpbin.org/delay/3",
      slug: "demo-slow",
      environment: "STAGING",
      intervalSec: 60,
      expectedStatus: 200,
      timeoutMs: 10_000,
      latencyThresholdMs: 2_000,
      nextCheckAt: new Date(),
    },
  });

  const failing = await prisma.monitor.upsert({
    where: { slug: "demo-failing" },
    update: {},
    create: {
      userId: user.id,
      name: "Broken API (Failure Demo)",
      url: "https://httpbin.org/status/500",
      slug: "demo-failing",
      environment: "PROD",
      intervalSec: 60,
      expectedStatus: 200,
      timeoutMs: 10_000,
      latencyThresholdMs: null,
      nextCheckAt: new Date(),
    },
  });

  console.log(`Created: ${healthy.name}, ${slow.name}, ${failing.name}`);
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
