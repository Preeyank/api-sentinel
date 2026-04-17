import { Badge } from "@/components/ui/badge";
import { MonitorStatusBadge } from "@/components/monitors/MonitorStatusBadge";
import { cn, formatInterval } from "@/lib/utils";
import { ENV_LABELS, ENV_BADGE_CLASSES } from "@/lib/constants/monitors";
import type { MonitorStatus, Environment } from "@/lib/constants/monitors";

type Props = {
  name: string;
  status: MonitorStatus;
  environment: Environment;
  url: string;
  intervalSec: number;
  timeoutMs: number;
  expectedStatus: number;
  latencyThresholdMs: number | null;
};

export function MonitorDetailHeader({
  name,
  status,
  environment,
  url,
  intervalSec,
  timeoutMs,
  expectedStatus,
  latencyThresholdMs,
}: Props) {
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-foreground">{name}</h1>
        <MonitorStatusBadge status={status} />
        <Badge
          variant="outline"
          className={cn("text-[10px]", ENV_BADGE_CLASSES[environment])}
        >
          {ENV_LABELS[environment]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{url}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Checked every {formatInterval(intervalSec)} · Timeout {timeoutMs / 1000}
        s · Expects {expectedStatus}
        {latencyThresholdMs && <> · Latency alert &gt;{latencyThresholdMs}ms</>}
      </p>
    </div>
  );
}
