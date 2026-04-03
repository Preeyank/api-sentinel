import pLimit from "p-limit";
import { prisma } from "@/lib/prisma";
import { runCheck } from "@/lib/checks/runCheck";
import type { CronRunSummary } from "@/types/worker";

/**
 * Maximum number of HTTP health checks that may run concurrently.
 * Keeping this conservative (5) avoids saturating the outbound connection
 * pool on the serverless function and limits blast radius on target servers.
 */
const CONCURRENCY = 5;

/**
 * Queries all active monitors whose nextCheckAt is in the past, then runs
 * a health check for each one concurrently (bounded by CONCURRENCY).
 *
 * Each check calls runCheck with updateNextCheckAt: true so the monitor's
 * nextCheckAt is advanced atomically inside the Prisma transaction — this
 * prevents a second overlapping cron invocation from re-checking the same
 * monitor before its next interval has elapsed.
 */
export async function dispatchDueChecks(): Promise<CronRunSummary> {
  const start = Date.now();
  const now = new Date();

  const dueMonitors = await prisma.monitor.findMany({
    where: { isActive: true, nextCheckAt: { lte: now } },
    select: { id: true },
  });

  const limit = pLimit(CONCURRENCY);
  let failures = 0;

  await Promise.all(
    dueMonitors.map(({ id }) =>
      limit(async () => {
        const outcome = await runCheck(id, { updateNextCheckAt: true });
        if (!outcome.ok) failures++;
      }),
    ),
  );

  return {
    checked: dueMonitors.length,
    failures,
    skipped: 0,
    durationMs: Date.now() - start,
  };
}
