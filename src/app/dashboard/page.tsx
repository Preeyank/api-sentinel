import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { Activity, Radio, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await getRequiredSession();

  const firstName = session.user.name.split(" ")[0] || null;
  const greeting = getGreeting(new Date().getHours());

  // Fetch all monitors for this user so we can scope check/incident queries.
  const userMonitors = await prisma.monitor.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  const monitorIds = userMonitors.map((m) => m.id);
  const monitorCount = monitorIds.length;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000);

  const [totalChecks, successfulChecks, openIncidentCount, recentCheckResults] =
    monitorCount > 0
      ? await Promise.all([
          prisma.checkResult.count({
            where: {
              monitorId: { in: monitorIds },
              checkedAt: { gte: twentyFourHoursAgo },
            },
          }),
          prisma.checkResult.count({
            where: {
              monitorId: { in: monitorIds },
              checkedAt: { gte: twentyFourHoursAgo },
              errorType: null,
            },
          }),
          prisma.incident.count({
            where: {
              monitorId: { in: monitorIds },
              status: "OPEN",
              startedAt: { gte: thirtyDaysAgo },
            },
          }),
          // Fetch last 24h check results for uptime mini-bars
          prisma.checkResult.findMany({
            where: {
              monitorId: { in: monitorIds },
              checkedAt: { gte: twentyFourHoursAgo },
            },
            select: { monitorId: true, checkedAt: true, errorType: true },
            orderBy: { checkedAt: "asc" },
          }),
        ])
      : [0, 0, 0, []];

  const uptimePercent = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : null;
  const uptimeDisplay = uptimePercent !== null ? `${uptimePercent.toFixed(1)}%` : null;
  const uptimeState: "great" | "poor" | "empty" =
    uptimePercent === null ? "empty" : uptimePercent > 80 ? "great" : "poor";

  // Build 24-segment uptime bar data per monitor (1 segment = 1 hour)
  type Segment = "up" | "down" | "none";
  const uptimeBars: Array<{ id: string; name: string; slug: string; segments: Segment[] }> = [];

  if (monitorIds.length > 0 && Array.isArray(recentCheckResults)) {
    for (const monitor of userMonitors) {
      const checks = recentCheckResults.filter((c) => c.monitorId === monitor.id);
      const segments: Segment[] = Array.from({ length: 24 }, (_, i) => {
        const segStart = new Date(now.getTime() - (24 - i) * 60 * 60 * 1_000);
        const segEnd = new Date(segStart.getTime() + 60 * 60 * 1_000);
        const hourChecks = checks.filter(
          (c) => c.checkedAt >= segStart && c.checkedAt < segEnd,
        );
        if (hourChecks.length === 0) return "none";
        return hourChecks.some((c) => c.errorType !== null) ? "down" : "up";
      });
      uptimeBars.push({ id: monitor.id, name: monitor.name, slug: monitor.slug, segments });
    }
  }

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {firstName ? (
            <>{greeting}, <span className="text-primary">{firstName}</span></>
          ) : (
            greeting
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s how your APIs are performing right now.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Monitors */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-px hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monitors</span>
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
          "relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-px hover:shadow-md",
        )}>
          <div className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            uptimeState === "great" && "via-success/60",
            uptimeState === "poor"  && "via-destructive/60",
            uptimeState === "empty" && "via-muted-foreground/30",
          )} />
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Uptime (24h)</span>
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
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-px hover:shadow-md">
          <div className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            openIncidentCount > 0 ? "via-destructive/60" : "via-success/60",
          )} />
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Incidents (30d)</span>
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

      {/* Uptime mini-bars — one row per monitor */}
      {uptimeBars.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Uptime — last 24 hours
          </h2>
          <div className="flex flex-col gap-2">
            {uptimeBars.map(({ id, name, slug, segments }) => (
              <Link
                key={id}
                href={`/dashboard/monitors/${slug}`}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-2.5 transition-all hover:bg-card hover:shadow-sm"
              >
                <span className="w-36 shrink-0 truncate text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                  {name}
                </span>
                <div className="flex flex-1 gap-px">
                  {segments.map((seg, i) => (
                    <div
                      key={i}
                      title={seg === "none" ? "No data" : seg === "up" ? "Up" : "Down"}
                      className={cn(
                        "h-5 flex-1 rounded-[2px] transition-opacity",
                        seg === "up"   && "bg-success/70 group-hover:bg-success/90",
                        seg === "down" && "bg-destructive/70 group-hover:bg-destructive/90",
                        seg === "none" && "bg-muted/40",
                      )}
                    />
                  ))}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">now</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state (no monitors) */}
      {monitorCount === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Activity className="size-7 text-muted-foreground/50" />
          </div>
          <h2 className="mt-5 text-base font-semibold text-foreground">
            No monitors yet
          </h2>
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
