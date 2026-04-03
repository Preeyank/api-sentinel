import type { ErrorType } from "@/generated/prisma/enums";

export type CheckOutcome = {
  statusCode: number | null;
  latencyMs: number;
  errorType: ErrorType | null;
  responseSnippet: string | null;
  ok: boolean;
  /** True when the response was healthy but latency exceeded the monitor's configured latencyThresholdMs. */
  latencyWarning: boolean;
};
