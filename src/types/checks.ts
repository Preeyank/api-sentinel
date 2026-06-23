import type { ErrorType, IncidentType } from "@/generated/prisma/enums";

// Carries just enough info for dispatch.ts to send the alert email after the
// transaction commits — kind tells us which email copy to use, type tells us
// FAILURE vs LATENCY, monitorId lets us look up the owner's email.
export type IncidentEvent = {
  kind: "opened" | "closed";
  incidentType: IncidentType;
  monitorId: string;
};

export type CheckOutcome = {
  statusCode: number | null;
  latencyMs: number;
  errorType: ErrorType | null;
  responseSnippet: string | null;
  ok: boolean;
  /** True when the response was healthy but latency exceeded the monitor's configured latencyThresholdMs. */
  latencyWarning: boolean;
  /** Set when this check caused an incident to open or close. Null otherwise. */
  incidentEvent: IncidentEvent | null;
};
