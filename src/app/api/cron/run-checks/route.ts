import { NextRequest, NextResponse } from "next/server";
import { dispatchDueChecks } from "@/lib/worker/dispatch";

/**
 * GET /api/cron/run-checks
 *
 * Invoked every minute by Vercel Cron (see vercel.json).
 * Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>` on
 * production invocations. The same header must be passed manually when
 * testing locally or via curl.
 *
 * Responds with a CronRunSummary payload so each cron invocation is
 * observable in Vercel's cron logs.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Reject if the secret is not configured or the header doesn't match.
  // Comparing the full "Bearer <secret>" string avoids an extra slice() call
  // and keeps the guard as a single truthiness check.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await dispatchDueChecks();
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
