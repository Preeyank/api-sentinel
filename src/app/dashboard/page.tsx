import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { Activity, Radio, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your API monitoring dashboard. Add monitors to start tracking uptime.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Monitors</CardDescription>
              <Radio className="size-4 text-muted-foreground/40" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">
              {monitorCount}
            </CardTitle>
            <CardDescription className="text-xs">
              {monitorCount === 0
                ? "No monitors configured"
                : `${monitorCount} configured`}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Avg Uptime (24h)</CardDescription>
              <TrendingUp className="size-4 text-muted-foreground/40" />
            </div>
            <CardTitle
              className={`text-3xl font-bold ${
                uptimeDisplay ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {uptimeDisplay ?? "—"}
            </CardTitle>
            <CardDescription className="text-xs">
              {totalChecks === 0
                ? "No checks yet"
                : `${successfulChecks} / ${totalChecks} checks passed`}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Incidents (30d)</CardDescription>
              <AlertTriangle className="size-4 text-muted-foreground/40" />
            </div>
            <CardTitle
              className={`text-3xl font-bold ${
                openIncidentCount > 0 ? "text-destructive" : "text-foreground"
              }`}
            >
              {openIncidentCount}
            </CardTitle>
            <CardDescription className="text-xs">
              {openIncidentCount === 0
                ? "No open incidents"
                : `${openIncidentCount} open incident${
                    openIncidentCount === 1 ? "" : "s"
                  }`}
            </CardDescription>
          </CardHeader>
        </Card>
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
