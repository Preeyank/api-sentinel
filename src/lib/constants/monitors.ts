export const ENVIRONMENTS = [
  { label: "Production", value: "PROD" as const },
  { label: "Staging", value: "STAGING" as const },
  { label: "Development", value: "DEV" as const },
] as const;

export type Environment = (typeof ENVIRONMENTS)[number]["value"];

export const ENV_LABELS = Object.fromEntries(
  ENVIRONMENTS.map((e) => [e.value, e.label]),
) as Record<Environment, string>;

// Maps internal ErrorType enum values to user-facing labels
export const ERROR_LABELS: Record<string, string> = {
  TIMEOUT: "Request timed out",
  DNS_ERROR: "DNS lookup failed",
  CONNECTION_ERROR: "Connection refused",
  STATUS_MISMATCH: "Wrong status code",
};

export const INTERVALS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "30 minutes", value: 1800 },
] as const;

// Maximum characters stored from an HTTP response body in CheckResult.
export const RESPONSE_SNIPPET_MAX_LENGTH = 500;

// Prisma's default interactive transaction timeout is 5 s. Our slowest monitors
// can take up to timeoutMs (default 5 s) + 1 s retry delay = 6 s just for the
// HTTP fetch, leaving no budget for DB writes. 15 s gives comfortable headroom.
export const CHECK_TRANSACTION_TIMEOUT_MS = 15_000;

// Maximum number of health checks that may run concurrently in the cron worker.
export const CRON_CONCURRENCY = 5;

// Default latency threshold applied when a user first enables latency alerting.
export const DEFAULT_LATENCY_THRESHOLD_MS = 2_000;
