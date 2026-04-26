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

function StatusDot({ status }: { status: MonitorStatus }) {
  if (status === "UP") {
    return (
      <span className="relative flex size-3 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-3 rounded-full bg-success" />
      </span>
    );
  }
  if (status === "DOWN") {
    return <span className="size-3 shrink-0 rounded-full bg-destructive" />;
  }
  return (
    <span className="size-3 shrink-0 rounded-full bg-muted-foreground/40" />
  );
}

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
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <StatusDot status={status} />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {name}
        </h1>
        <MonitorStatusBadge status={status} />
        <Badge
          variant="outline"
          className={cn("text-[10px]", ENV_BADGE_CLASSES[environment])}
        >
          {ENV_LABELS[environment]}
        </Badge>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{url}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          `Every ${formatInterval(intervalSec)}`,
          `Timeout ${timeoutMs / 1000}s`,
          `Expects ${expectedStatus}`,
          ...(latencyThresholdMs ? [`Alert >${latencyThresholdMs}ms`] : []),
        ].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
