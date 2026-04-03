import type { ErrorType } from "@/generated/prisma/enums";

export type CheckOutcome = {
  statusCode: number | null;
  latencyMs: number;
  errorType: ErrorType | null;
  responseSnippet: string | null;
  ok: boolean;
  /** True when the response was healthy but latency exceeded 75 % of the monitor's timeout. */
  latencyWarning: boolean;
};
