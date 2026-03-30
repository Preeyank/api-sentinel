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

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runCheck(
  monitorId: string,
  { updateNextCheckAt = false }: { updateNextCheckAt?: boolean } = {},
): Promise<CheckOutcome> {
  const monitor = await prisma.monitor.findUniqueOrThrow({
    where: { id: monitorId },
  });

  // 1. Make the HTTP request
  const { statusCode, responseSnippet, latencyMs, networkError } =
    await fetchUrl(monitor.url, monitor.timeoutMs);

  // 2. Determine the final error type.
  //    Network errors (timeout, DNS, connection) take priority.
  //    If the request succeeded but returned the wrong status code, that is also a failure.
  const errorType: ErrorType | null =
    networkError ??
    (statusCode !== monitor.expectedStatus ? "STATUS_MISMATCH" : null);

  const ok = errorType === null;

  // 3. Persist everything atomically.
  //    The open-incident lookup lives inside the transaction so that two
  //    concurrent checks for the same monitor cannot both find no open
  //    incident and each create one (duplicate-incident race condition).
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const openIncident = await tx.incident.findFirst({
      where: { monitorId, status: "OPEN" },
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

    // 4. Incident logic:
    //    - First failure with no open incident → open a new one
    //    - Recovery with an open incident → close it
    //    - Ongoing failure or healthy → no change
    if (!ok && !openIncident) {
      await tx.incident.create({
        data: {
          monitorId,
          type: "FAILURE",
          status: "OPEN",
          incidentSnapshot: { statusCode, latencyMs, errorType },
        },
      });
    } else if (ok && openIncident) {
      await tx.incident.update({
        where: { id: openIncident.id },
        data: { status: "CLOSED", endedAt: now },
      });
    }
  });

  return { statusCode, latencyMs, errorType, responseSnippet, ok };
}
