export const ENVIRONMENTS = [
  { label: "Production", value: "PROD" as const },
  { label: "Staging", value: "STAGING" as const },
  { label: "Development", value: "DEV" as const },
] as const;

export type Environment = (typeof ENVIRONMENTS)[number]["value"];

export const ENV_LABELS = Object.fromEntries(
  ENVIRONMENTS.map((e) => [e.value, e.label]),
) as Record<Environment, string>;

export const INTERVALS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "30 minutes", value: 1800 },
] as const;
