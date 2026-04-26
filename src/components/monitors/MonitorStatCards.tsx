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
  const uptimeGood = uptime24h !== null && uptime24h > 80;
  const uptimeBad = uptime24h !== null && uptime24h <= 80;

  return (
    <div className="mt-6 grid grid-cols-3 gap-3">
      {/* Uptime */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5",
          uptimeGood && "hover:shadow-[0_6px_24px_oklch(0.65_0.18_145_/_0.15)]",
          uptimeBad && "hover:shadow-[0_6px_24px_oklch(0.7_0.19_22_/_0.18)]",
          !uptimeGood && !uptimeBad && "hover:shadow-md",
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            uptimeGood && "via-success/60",
            uptimeBad && "via-destructive/60",
            !uptimeGood && !uptimeBad && "via-muted-foreground/20",
          )}
        />
        <p className="text-xs text-muted-foreground">Uptime (24h)</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            uptime24h === null
              ? "text-muted-foreground"
              : uptimeGood
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

      {/* Avg latency */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_oklch(0.55_0.2_260_/_0.12)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <p className="text-xs text-muted-foreground">Avg Latency (24h)</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
          {avgLatency !== null ? `${avgLatency}ms` : "—"}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          successful checks only
        </p>
      </div>

      {/* Incidents */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5",
          openIncidentsCount > 0
            ? "hover:shadow-[0_6px_24px_oklch(0.7_0.19_22_/_0.18)]"
            : "hover:shadow-[0_6px_24px_oklch(0.65_0.18_145_/_0.12)]",
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            openIncidentsCount > 0 ? "via-destructive/60" : "via-success/50",
          )}
        />
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
