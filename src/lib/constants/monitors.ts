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

// Open a FAILURE incident only after this many consecutive failed checks
// (current + prior). Doubles as a new-monitor guard: fewer than THRESHOLD-1
// prior checks → never open.
export const CONSECUTIVE_FAILURE_THRESHOLD = 3;

// Open a LATENCY incident only after this many consecutive slow-but-healthy
// checks (current + prior).
export const CONSECUTIVE_LATENCY_THRESHOLD = 2;

// Close a LATENCY incident only after this many consecutive HEALTHY checks
// (OK + below threshold). A failed check does NOT count as recovery.
export const CONSECUTIVE_LATENCY_RECOVERY = 2;

// Require this many successful historical checks before a LATENCY incident
// can ever be opened — guards against false alarms on barely-used monitors.
export const MIN_SUCCESSFUL_CHECKS_FOR_LATENCY = 10;

export type MonitorStatus = "UP" | "DOWN" | "PAUSED" | "UNKNOWN";

export const STATUS_LABELS: Record<MonitorStatus, string> = {
  UP: "Up",
  DOWN: "Down",
  PAUSED: "Paused",
  UNKNOWN: "Unknown",
};

// Presentational — used wherever a monitor's environment is shown as an icon or badge
export const ENV_ICON_COLORS: Record<Environment, string> = {
  PROD: "bg-blue-500/10 text-blue-500",
  STAGING: "bg-amber-500/10 text-amber-500",
  DEV: "bg-violet-500/10 text-violet-500",
};

export const ENV_BADGE_CLASSES: Record<Environment, string> = {
  PROD: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  STAGING: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DEV: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
};
