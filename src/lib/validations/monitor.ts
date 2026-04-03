import { z } from "zod";

export const MonitorFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(30, "Name must be 30 characters or less"),
  url: z.url("Must be a valid URL"),
  environment: z.enum(["PROD", "STAGING", "DEV"]),
  intervalSec: z.number({ error: "Interval is required" }),
  expectedStatus: z.number().int().min(100, "Min 100").max(599, "Max 599"),
  timeoutMs: z.number().int().min(1000, "Min 1000ms").max(30000, "Max 30000ms"),
  latencyThresholdMs: z.number().int().min(100, "Min 100ms").max(29000, "Max 29000ms").nullable(),
});

export type MonitorFormValues = z.infer<typeof MonitorFormSchema>;
