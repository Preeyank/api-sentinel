import { prisma } from "@/lib/prisma";
import type { ErrorType } from "@/generated/prisma/enums";
import type { CheckOutcome, IncidentEvent } from "@/types/checks";
import {
  RESPONSE_SNIPPET_MAX_LENGTH,
  CHECK_TRANSACTION_TIMEOUT_MS,
  CONSECUTIVE_FAILURE_THRESHOLD,
  CONSECUTIVE_LATENCY_THRESHOLD,
  CONSECUTIVE_LATENCY_RECOVERY,
  MIN_SUCCESSFUL_CHECKS_FOR_LATENCY,
} from "@/lib/constants/monitors";

export type { CheckOutcome };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps a caught fetch error to the appropriate ErrorType.
 * AbortError means the request was cancelled by our timeout controller.
 * ENOTFOUND / getaddrinfo errors indicate the hostname could not be resolved.
 * Everything else is treated as a generic connection failure.
 */
function classifyNetworkError(err: unknown): ErrorType {
  if (!(err instanceof Error)) return "CONNECTION_ERROR";
  if (err.name === "AbortError") return "TIMEOUT";
  if (
    err.message.includes("getaddrinfo") ||
    err.message.includes("ENOTFOUND")
  ) {
    return "DNS_ERROR";
  }
  return "CONNECTION_ERROR";
}

/**
 * Performs the HTTP request and enforces a hard timeout via AbortController.
 * Returns the raw HTTP result; status-code correctness is checked separately
 * by the caller so this function stays pure and reusable.
 */
async function fetchUrl(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    const text = await response.text();

    return {
      statusCode: response.status,
      responseSnippet: text.slice(0, RESPONSE_SNIPPET_MAX_LENGTH) || null,
      latencyMs: Date.now() - start,
      networkError: null as ErrorType | null,
    };
  } catch (err) {
    return {
      statusCode: null,
      responseSnippet: null,
      latencyMs: Date.now() - start,
      networkError: classifyNetworkError(err),
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

/**
 * Wraps fetchUrl with a single retry for transient CONNECTION_ERROR failures.
 *
 * - CONNECTION_ERROR only: DNS failures mean the host doesn't exist (persistent),
 *   and timeouts would just burn double the budget on a slow endpoint.
 * - 1 s delay before the retry to let a briefly-flapping connection recover.
 */
async function fetchUrlWithRetry(url: string, timeoutMs: number) {
  const result = await fetchUrl(url, timeoutMs);
  if (result.networkError !== "CONNECTION_ERROR") return result;

  await new Promise((r) => setTimeout(r, 1_000));
  return fetchUrl(url, timeoutMs);
}

// ─── Historical-check predicates ──────────────────────────────────────────────
// Used to classify prior CheckResult rows when deciding whether to open or
// close an incident based on a consecutive-streak rule.

type HistoricalCheck = {
  errorType: ErrorType | null;
  latencyMs: number | null;
};

function isFailureRecord(check: HistoricalCheck): boolean {
  return check.errorType !== null;
}

function isLatencyWarningRecord(
  check: HistoricalCheck,
  thresholdMs: number | null,
): boolean {
  return (
    check.errorType === null &&
    thresholdMs !== null &&
    (check.latencyMs ?? 0) > thresholdMs
  );
}

// Healthy = successful response AND below latency threshold.
// A failed check is NOT healthy, so a slow→fail transition cannot accidentally
// be counted as latency recovery.
function isLatencyHealthyRecord(
  check: HistoricalCheck,
  thresholdMs: number | null,
): boolean {
  if (check.errorType !== null) return false;
  if (thresholdMs === null) return true;
  return (check.latencyMs ?? 0) <= thresholdMs;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runCheck(
  monitorId: string,
  { updateNextCheckAt = false }: { updateNextCheckAt?: boolean } = {},
): Promise<CheckOutcome> {
  const monitor = await prisma.monitor.findUniqueOrThrow({
    where: { id: monitorId },
  });

  // 1. Make the HTTP request (with one retry on transient connection failures)
  const { statusCode, responseSnippet, latencyMs, networkError } =
    await fetchUrlWithRetry(monitor.url, monitor.timeoutMs);

  // 2. Determine the final error type.
  //    Network errors (timeout, DNS, connection) take priority.
  //    If the request succeeded but returned the wrong status code, that is also a failure.
  const errorType: ErrorType | null =
    networkError ??
    (statusCode !== monitor.expectedStatus ? "STATUS_MISMATCH" : null);

  const ok = errorType === null;

  // 3. If latency alerting is enabled on this monitor (latencyThresholdMs != null),
  //    a healthy response that exceeds the threshold is a latency warning
  //    (distinct from a FAILURE) so the two can coexist independently.
  const latencyWarning =
    ok &&
    monitor.latencyThresholdMs !== null &&
    latencyMs > monitor.latencyThresholdMs;

  // 4. Persist everything atomically.
  //    Both open-incident lookups (FAILURE and LATENCY) live inside the transaction
  //    so that two concurrent checks for the same monitor cannot each create a
  //    duplicate incident (race-condition guard).
  const now = new Date();

  // How many prior CheckResult rows we need to inspect to evaluate all three
  // streak rules (FAILURE open, LATENCY open, LATENCY close).
  const RECENT_HISTORY_LOOKBACK = Math.max(
    CONSECUTIVE_FAILURE_THRESHOLD - 1,
    CONSECUTIVE_LATENCY_THRESHOLD - 1,
    CONSECUTIVE_LATENCY_RECOVERY - 1,
  );

  let incidentEvent: IncidentEvent | null = null;

  await prisma.$transaction(async (tx) => {
    // Separate queries per incident type so FAILURE and LATENCY can coexist
    const openFailureIncident = await tx.incident.findFirst({
      where: { monitorId, status: "OPEN", type: "FAILURE" },
    });
    const openLatencyIncident = await tx.incident.findFirst({
      where: { monitorId, status: "OPEN", type: "LATENCY" },
    });

    // Pull just enough recent history to evaluate the streak rules below.
    // Ordered newest-first; slice(0, N) gives the most recent N rows.
    const recentChecks = await tx.checkResult.findMany({
      where: { monitorId },
      orderBy: { checkedAt: "desc" },
      take: RECENT_HISTORY_LOOKBACK,
      select: { errorType: true, latencyMs: true },
    });

    await tx.checkResult.create({
      data: { monitorId, statusCode, latencyMs, errorType, responseSnippet },
    });

    await tx.monitor.update({
      where: { id: monitorId },
      data: {
        lastCheckedAt: now,
        ...(updateNextCheckAt && {
          nextCheckAt: new Date(now.getTime() + monitor.intervalSec * 1000),
        }),
      },
    });

    // ── FAILURE incident lifecycle ──────────────────────────────────────────
    // Open: CONSECUTIVE_FAILURE_THRESHOLD failures in a row (current + prior).
    //       Acts as a new-monitor guard — if we don't yet have THRESHOLD-1
    //       prior checks, we never have enough evidence to open.
    // Close: unchanged — first success closes the incident.
    const priorFailuresNeeded = CONSECUTIVE_FAILURE_THRESHOLD - 1;
    const priorFailureWindow = recentChecks.slice(0, priorFailuresNeeded);
    const failureStreak =
      !ok &&
      priorFailureWindow.length === priorFailuresNeeded &&
      priorFailureWindow.every(isFailureRecord);

    if (failureStreak && !openFailureIncident) {
      await tx.incident.create({
        data: {
          monitorId,
          type: "FAILURE",
          status: "OPEN",
          incidentSnapshot: { statusCode, latencyMs, errorType },
        },
      });
      incidentEvent = { kind: "opened", incidentType: "FAILURE", monitorId };
    } else if (ok && openFailureIncident) {
      await tx.incident.update({
        where: { id: openFailureIncident.id },
        data: { status: "CLOSED", endedAt: now },
      });
      incidentEvent = { kind: "closed", incidentType: "FAILURE", monitorId };
    }

    // ── LATENCY incident lifecycle ──────────────────────────────────────────
    // Open: CONSECUTIVE_LATENCY_THRESHOLD warnings in a row AND at least
    //       MIN_SUCCESSFUL_CHECKS_FOR_LATENCY successful checks of history
    //       (so we're not alerting on a barely-used monitor).
    // Close: CONSECUTIVE_LATENCY_RECOVERY healthy checks in a row. A failed
    //        check is NOT recovery — slow→fail keeps the LATENCY incident open
    //        because the monitor is getting worse, not better.
    const priorWarningsNeeded = CONSECUTIVE_LATENCY_THRESHOLD - 1;
    const priorWarningWindow = recentChecks.slice(0, priorWarningsNeeded);
    const latencyStreak =
      latencyWarning &&
      priorWarningWindow.length === priorWarningsNeeded &&
      priorWarningWindow.every((c) =>
        isLatencyWarningRecord(c, monitor.latencyThresholdMs),
      );

    const priorRecoveryNeeded = CONSECUTIVE_LATENCY_RECOVERY - 1;
    const priorRecoveryWindow = recentChecks.slice(0, priorRecoveryNeeded);
    const recoveryStreak =
      ok &&
      !latencyWarning &&
      priorRecoveryWindow.length === priorRecoveryNeeded &&
      priorRecoveryWindow.every((c) =>
        isLatencyHealthyRecord(c, monitor.latencyThresholdMs),
      );

    if (latencyStreak && !openLatencyIncident) {
      // Only run the count when we're otherwise ready to open — avoids the
      // query on the vast majority of checks that aren't latency warnings.
      const successfulCount = await tx.checkResult.count({
        where: { monitorId, errorType: null },
      });

      if (successfulCount >= MIN_SUCCESSFUL_CHECKS_FOR_LATENCY) {
        await tx.incident.create({
          data: {
            monitorId,
            type: "LATENCY",
            status: "OPEN",
            incidentSnapshot: {
              latencyMs,
              thresholdMs: monitor.latencyThresholdMs,
            },
          },
        });
        incidentEvent = { kind: "opened", incidentType: "LATENCY", monitorId };
      }
    } else if (recoveryStreak && openLatencyIncident) {
      await tx.incident.update({
        where: { id: openLatencyIncident.id },
        data: { status: "CLOSED", endedAt: now },
      });
      incidentEvent = { kind: "closed", incidentType: "LATENCY", monitorId };
    }
  }, { timeout: CHECK_TRANSACTION_TIMEOUT_MS });

  return {
    statusCode,
    latencyMs,
    errorType,
    responseSnippet,
    ok,
    latencyWarning,
    incidentEvent,
  };
}
