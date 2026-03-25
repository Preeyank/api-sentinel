import { z } from "zod";

export const MonitorFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  url: z.url("Must be a valid URL"),
  environment: z.enum(["PROD", "STAGING", "DEV"]),
  intervalSec: z.number({ error: "Interval is required" }),
  expectedStatus: z.number().int().min(100, "Min 100").max(599, "Max 599"),
  timeoutMs: z.number().int().min(1000, "Min 1000ms").max(30000, "Max 30000ms"),
});

export type MonitorFormValues = z.infer<typeof MonitorFormSchema>;
