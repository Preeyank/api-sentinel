import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { Activity, Radio, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Greeting } from "@/components/dashboard/Greeting";

export default async function DashboardPage() {
  const session = await getRequiredSession();
  const firstName = session.user.name.split(" ")[0] || null;

  const userMonitors = await prisma.monitor.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      lastCheckedAt: true,
      checkResults: {
        take: 1,
        orderBy: { checkedAt: "desc" },
        select: { errorType: true },
      },
    },
  });

  const monitorIds = userMonitors.map((m) => m.id);
  const monitorCount = monitorIds.length;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000);

  const [totalChecks, successfulChecks, openIncidentCount, uptimeCounts, uptimeSuccessCounts] =
    monitorCount > 0
      ? await Promise.all([
          prisma.checkResult.count({
            where: { monitorId: { in: monitorIds }, checkedAt: { gte: twentyFourHoursAgo } },
          }),
          prisma.checkResult.count({
            where: { monitorId: { in: monitorIds }, checkedAt: { gte: twentyFourHoursAgo }, errorType: null },
          }),
          prisma.incident.count({
            where: { monitorId: { in: monitorIds }, status: "OPEN", startedAt: { gte: thirtyDaysAgo } },
          }),
          // Per-monitor total checks (for uptime bars)
          prisma.checkResult.groupBy({
            by: ["monitorId"],
            where: { monitorId: { in: monitorIds }, checkedAt: { gte: twentyFourHoursAgo } },
            _count: { id: true },
          }),
          // Per-monitor successful checks
          prisma.checkResult.groupBy({
            by: ["monitorId"],
            where: { monitorId: { in: monitorIds }, checkedAt: { gte: twentyFourHoursAgo }, errorType: null },
            _count: { id: true },
          }),
        ])
      : [0, 0, 0, [], []];

  const uptimePercent = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : null;
  const uptimeDisplay = uptimePercent !== null ? `${uptimePercent.toFixed(1)}%` : null;
  const uptimeState: "great" | "poor" | "empty" =
    uptimePercent === null ? "empty" : uptimePercent > 80 ? "great" : "poor";

  // Per-monitor stats for the glance section
  const totalMap = Object.fromEntries(
    Array.isArray(uptimeCounts) ? uptimeCounts.map((r) => [r.monitorId, r._count.id]) : [],
  );
  const successMap = Object.fromEntries(
    Array.isArray(uptimeSuccessCounts) ? uptimeSuccessCounts.map((r) => [r.monitorId, r._count.id]) : [],
  );

  type MonitorStatus = "UP" | "DOWN" | "PAUSED" | "UNKNOWN";
  const monitorRows = userMonitors.map((m) => {
    const latestError = m.checkResults[0]?.errorType ?? null;
    let status: MonitorStatus;
    if (!m.isActive) status = "PAUSED";
    else if (!m.lastCheckedAt) status = "UNKNOWN";
    else if (latestError === null) status = "UP";
    else status = "DOWN";

    const total = totalMap[m.id] ?? 0;
    const success = successMap[m.id] ?? 0;
    const uptime = total > 0 ? (success / total) * 100 : null;
    return { id: m.id, name: m.name, slug: m.slug, status, uptime };
  });

  const STATUS_ORDER: Record<MonitorStatus, number> = { DOWN: 0, UNKNOWN: 1, PAUSED: 2, UP: 3 };
  const prioritizedMonitors = monitorRows
    .sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      return (a.uptime ?? 0) - (b.uptime ?? 0);
    })
    .slice(0, 6);

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 animate-fade-in">
      {/* Greeting — client component for accurate local timezone */}
      <div className="mb-8">
        <Greeting firstName={firstName} />
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s how your APIs are performing right now.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Monitors */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_oklch(0.55_0.2_260_/_0.15)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Monitors</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Radio className="size-4 text-blue-500" />
            </div>
          </div>
          <p className="text-4xl font-bold tabular-nums text-foreground">{monitorCount}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {monitorCount === 0 ? "No monitors configured" : `${monitorCount} configured`}
          </p>
        </div>

        {/* Uptime */}
        <div className={cn(
          "group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5",
          uptimeState === "great" && "hover:shadow-[0_8px_30px_oklch(0.65_0.18_145_/_0.15)]",
          uptimeState === "poor"  && "hover:shadow-[0_8px_30px_oklch(0.7_0.19_22_/_0.18)]",
          uptimeState === "empty" && "hover:shadow-md",
        )}>
          <div className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            uptimeState === "great" && "via-success/60",
            uptimeState === "poor"  && "via-destructive/60",
            uptimeState === "empty" && "via-muted-foreground/30",
          )} />
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg Uptime (24h)</span>
            <div className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              uptimeState === "great" && "bg-success/10",
              uptimeState === "poor"  && "bg-destructive/10",
              uptimeState === "empty" && "bg-muted",
            )}>
              <TrendingUp className={cn(
                "size-4",
                uptimeState === "great" && "text-success",
                uptimeState === "poor"  && "text-destructive",
                uptimeState === "empty" && "text-muted-foreground",
              )} />
            </div>
          </div>
          <p className={cn(
            "text-4xl font-bold tabular-nums",
            uptimeState === "great" && "text-foreground",
            uptimeState === "poor"  && "text-destructive",
            uptimeState === "empty" && "text-muted-foreground",
          )}>
            {uptimeDisplay ?? "—"}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {totalChecks === 0 ? "No checks yet" : `${successfulChecks} / ${totalChecks} checks passed`}
          </p>
        </div>

        {/* Incidents */}
        <div className={cn(
          "group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5",
          openIncidentCount > 0
            ? "hover:shadow-[0_8px_30px_oklch(0.7_0.19_22_/_0.18)]"
            : "hover:shadow-[0_8px_30px_oklch(0.65_0.18_145_/_0.12)]",
        )}>
          <div className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            openIncidentCount > 0 ? "via-destructive/60" : "via-success/60",
          )} />
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Incidents (30d)</span>
            <div className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              openIncidentCount > 0 ? "bg-destructive/10" : "bg-success/10",
            )}>
              <AlertTriangle className={cn(
                "size-4",
                openIncidentCount > 0 ? "text-destructive" : "text-success",
              )} />
            </div>
          </div>
          <p className={cn(
            "text-4xl font-bold tabular-nums",
            openIncidentCount > 0 ? "text-destructive" : "text-foreground",
          )}>
            {openIncidentCount}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {openIncidentCount === 0
              ? "No open incidents"
              : `${openIncidentCount} open incident${openIncidentCount === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {/* Monitors at a glance — status + uptime progress per monitor */}
      {prioritizedMonitors.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monitors at a glance
            </h2>
            <Link
              href="/dashboard/monitors"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {prioritizedMonitors.map((monitor, idx) => (
              <Link
                key={monitor.id}
                href={`/dashboard/monitors/${monitor.slug}`}
                className={cn(
                  "group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40",
                  idx !== prioritizedMonitors.length - 1 && "border-b border-border/60",
                )}
              >
                {/* Status dot */}
                <span className={cn(
                  "size-2 shrink-0 rounded-full",
                  monitor.status === "UP"      && "bg-success shadow-[0_0_6px_var(--success)]",
                  monitor.status === "DOWN"    && "bg-destructive",
                  monitor.status === "PAUSED"  && "bg-muted-foreground/40",
                  monitor.status === "UNKNOWN" && "bg-muted-foreground/40",
                )} />

                {/* Name */}
                <span className="w-40 shrink-0 truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {monitor.name}
                </span>

                {/* Uptime progress bar */}
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all",
                        monitor.uptime !== null && monitor.uptime > 80 ? "bg-success/70" : "bg-destructive/60",
                        monitor.uptime === null && "hidden",
                      )}
                      style={{ width: `${monitor.uptime ?? 0}%` }}
                    />
                  </div>
                  <span className={cn(
                    "w-14 shrink-0 text-right text-xs tabular-nums",
                    monitor.uptime === null
                      ? "text-muted-foreground"
                      : monitor.uptime > 80
                      ? "text-success"
                      : "text-destructive",
                  )}>
                    {monitor.uptime !== null ? `${monitor.uptime.toFixed(1)}%` : "—"}
                  </span>
                </div>

                {/* Arrow */}
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary/60" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {monitorCount === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Activity className="size-7 text-muted-foreground/50" />
          </div>
          <h2 className="mt-5 text-base font-semibold text-foreground">No monitors yet</h2>
          <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
            Monitors track the uptime and latency of your APIs. Add your first one to start seeing data here.
          </p>
          <Link
            href="/dashboard/monitors"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 hover:shadow-md"
          >
            <Activity className="size-3.5" />
            Add a monitor
          </Link>
        </div>
      )}
    </div>
  );
}
