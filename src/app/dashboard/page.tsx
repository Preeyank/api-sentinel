import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { Activity, Radio, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/ui/tilt-card";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getRequiredSession();

  const firstName = session.user.name.split(" ")[0] || null;

  // Fetch all monitor IDs for this user so we can scope check/incident queries.
  const userMonitors = await prisma.monitor.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const monitorIds = userMonitors.map((m) => m.id);
  const monitorCount = monitorIds.length;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000);

  // Run uptime and incident queries in parallel (only if there are monitors).
  const [totalChecks, successfulChecks, openIncidentCount] =
    monitorCount > 0
      ? await Promise.all([
          // Total check results in the last 24 h across all of this user's monitors
          prisma.checkResult.count({
            where: {
              monitorId: { in: monitorIds },
              checkedAt: { gte: twentyFourHoursAgo },
            },
          }),
          // Healthy results (errorType null = correct status + no network error)
          prisma.checkResult.count({
            where: {
              monitorId: { in: monitorIds },
              checkedAt: { gte: twentyFourHoursAgo },
              errorType: null,
            },
          }),
          // Open incidents that started within the last 30 days
          prisma.incident.count({
            where: {
              monitorId: { in: monitorIds },
              status: "OPEN",
              startedAt: { gte: thirtyDaysAgo },
            },
          }),
        ])
      : [0, 0, 0];

  const uptimeDisplay =
    totalChecks > 0
      ? `${((successfulChecks / totalChecks) * 100).toFixed(1)}%`
      : null;

  const uptimePercent = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : null;
  const uptimeState: "great" | "poor" | "empty" =
    uptimePercent === null ? "empty" : uptimePercent > 80 ? "great" : "poor";

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {firstName ? (
            <>Welcome back, <span className="text-primary">{firstName}</span>!</>
          ) : (
            "Welcome back!"
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your API monitoring dashboard. Add monitors to start tracking uptime.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Monitors */}
        <TiltCard>
          <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monitors</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
                <Radio className="size-3.5 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{monitorCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {monitorCount === 0 ? "No monitors configured" : `${monitorCount} configured`}
            </p>
          </div>
        </TiltCard>

        {/* Uptime — green above 80%, red at or below */}
        <TiltCard>
          <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
            <div className={cn(
              "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent",
              uptimeState === "great" && "via-success",
              uptimeState === "poor"  && "via-destructive",
              uptimeState === "empty" && "via-muted-foreground/30",
            )} />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Avg Uptime (24h)</span>
              <div className={cn(
                "flex size-7 items-center justify-center rounded-lg",
                uptimeState === "great" && "bg-success/10",
                uptimeState === "poor"  && "bg-destructive/10",
                uptimeState === "empty" && "bg-muted",
              )}>
                <TrendingUp className={cn(
                  "size-3.5",
                  uptimeState === "great" && "text-success",
                  uptimeState === "poor"  && "text-destructive",
                  uptimeState === "empty" && "text-muted-foreground",
                )} />
              </div>
            </div>
            <p className={cn(
              "text-3xl font-bold",
              uptimeState === "great" && "text-foreground",
              uptimeState === "poor"  && "text-destructive",
              uptimeState === "empty" && "text-muted-foreground",
            )}>
              {uptimeDisplay ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalChecks === 0 ? "No checks yet" : `${successfulChecks} / ${totalChecks} checks passed`}
            </p>
          </div>
        </TiltCard>

        {/* Incidents */}
        <TiltCard>
          <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
            <div className={cn(
              "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent",
              openIncidentCount > 0 ? "via-destructive" : "via-success",
            )} />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Incidents (30d)</span>
              <div className={cn(
                "flex size-7 items-center justify-center rounded-lg",
                openIncidentCount > 0 ? "bg-destructive/10" : "bg-success/10",
              )}>
                <AlertTriangle className={cn("size-3.5", openIncidentCount > 0 ? "text-destructive" : "text-success")} />
              </div>
            </div>
            <p className={cn("text-3xl font-bold", openIncidentCount > 0 ? "text-destructive" : "text-foreground")}>
              {openIncidentCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {openIncidentCount === 0
                ? "No open incidents"
                : `${openIncidentCount} open incident${openIncidentCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </TiltCard>

      </div>

      {/* Placeholder — will show live monitor status once check results exist */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <Activity className="size-7 text-muted-foreground/50" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          No monitors yet
        </h2>
        <p className="mt-1.5 max-w-xs text-center text-sm text-muted-foreground">
          Monitors let you track the uptime and response time of your APIs.
          They&apos;ll appear here once you create them.
        </p>
        <Link
          href="/dashboard/monitors"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Activity className="size-3.5" />
          Go to Monitors
        </Link>
      </div>
    </div>
  );
}
