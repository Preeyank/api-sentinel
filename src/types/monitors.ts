import type { MonitorFormValues } from "@/lib/validations/monitor";
import type { Environment } from "@/lib/constants/monitors";

export type Monitor = {
  id: string;
  name: string;
  url: string;
  environment: Environment;
  intervalSec: number;
  expectedStatus: number;
  timeoutMs: number;
  latencyThresholdMs: number | null;
  isActive: boolean;
  slug: string;
  createdAt: Date;
  lastCheckedAt: Date | null;
};

export type MonitorForDialog = { id: string } & MonitorFormValues;
