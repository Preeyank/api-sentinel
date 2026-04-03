import { prisma } from "@/lib/prisma";
import type { ErrorType } from "@/generated/prisma/enums";
import type { CheckOutcome } from "@/types/checks";

export type { CheckOutcome };

const RESPONSE_SNIPPET_MAX_LENGTH = 500;

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
 * in runCheck so this function stays pure and reusable.
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
  //    a healthy response that exceeds the threshold opens a LATENCY incident
  //    (distinct from a FAILURE incident) so the two can coexist independently.
  const latencyWarning =
    ok &&
    monitor.latencyThresholdMs !== null &&
    latencyMs > monitor.latencyThresholdMs;

  // 4. Persist everything atomically.
  //    Both open-incident lookups (FAILURE and LATENCY) live inside the transaction
  //    so that two concurrent checks for the same monitor cannot each create a
  //    duplicate incident (race-condition guard).
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Separate queries per incident type so FAILURE and LATENCY can coexist
    const openFailureIncident = await tx.incident.findFirst({
      where: { monitorId, status: "OPEN", type: "FAILURE" },
    });
    const openLatencyIncident = await tx.incident.findFirst({
      where: { monitorId, status: "OPEN", type: "LATENCY" },
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
    // First failure with no open FAILURE incident → open one
    // Recovery with an open FAILURE incident → close it
    if (!ok && !openFailureIncident) {
      await tx.incident.create({
        data: {
          monitorId,
          type: "FAILURE",
          status: "OPEN",
          incidentSnapshot: { statusCode, latencyMs, errorType },
        },
      });
    } else if (ok && openFailureIncident) {
      await tx.incident.update({
        where: { id: openFailureIncident.id },
        data: { status: "CLOSED", endedAt: now },
      });
    }

    // ── LATENCY incident lifecycle ──────────────────────────────────────────
    // Slow but healthy response with no open LATENCY incident → open one
    // Latency back to normal with an open LATENCY incident → close it
    if (latencyWarning && !openLatencyIncident) {
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
    } else if (!latencyWarning && openLatencyIncident) {
      await tx.incident.update({
        where: { id: openLatencyIncident.id },
        data: { status: "CLOSED", endedAt: now },
      });
    }
  }, { timeout: 15_000 });

  return {
    statusCode,
    latencyMs,
    errorType,
    responseSnippet,
    ok,
    latencyWarning,
  };
}
