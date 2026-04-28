import pLimit from "p-limit";
import { prisma } from "@/lib/prisma";
import { runCheck } from "@/lib/checks/runCheck";
import type { CronRunSummary } from "@/types/worker";
import { CRON_CONCURRENCY } from "@/lib/constants/monitors";

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

  const limit = pLimit(CRON_CONCURRENCY);
  let failures = 0;
  let skipped = 0;

  await Promise.all(
    dueMonitors.map(({ id }) =>
      limit(async () => {
        try {
          const outcome = await runCheck(id, { updateNextCheckAt: true });
          if (!outcome.ok) failures++;
        } catch (err) {
          // An unexpected exception (DB failure, bug, network error outside the
          // check itself) must not abort the rest of the batch. Log it and
          // increment skipped so the caller can see something went wrong.
          skipped++;
          console.error(`[dispatch] runCheck failed for monitor ${id}:`, err);
        }
      }),
    ),
  );

  return {
    checked: dueMonitors.length,
    failures,
    skipped,
    durationMs: Date.now() - start,
  };
}
