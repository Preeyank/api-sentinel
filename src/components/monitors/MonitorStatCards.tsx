import { cn, timeAgo } from "@/lib/utils";

type Props = {
  uptime24h: number | null;
  totalCount: number;
  avgLatency: number | null;
  openIncidentsCount: number;
  lastCheckedAt: Date | null;
};

export function MonitorStatCards({
  uptime24h,
  totalCount,
  avgLatency,
  openIncidentsCount,
  lastCheckedAt,
}: Props) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-3">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Uptime (24h)</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            uptime24h === null
              ? "text-muted-foreground"
              : uptime24h > 80
                ? "text-success"
                : "text-destructive",
          )}
        >
          {uptime24h !== null ? `${uptime24h.toFixed(1)}%` : "—"}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {totalCount} checks
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Avg Latency (24h)</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
          {avgLatency !== null ? `${avgLatency}ms` : "—"}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          successful checks only
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Open Incidents</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            openIncidentsCount > 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {openIncidentsCount}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          last checked {timeAgo(lastCheckedAt)}
        </p>
      </div>
    </div>
  );
}
