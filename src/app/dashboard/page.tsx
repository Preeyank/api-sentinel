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

  const firstName = session.user.name.split(" ")[0];

  const monitorCount = await prisma.monitor.count({
    where: { userId: session.user.id },
  });

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}!
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
              <CardDescription>Avg Uptime</CardDescription>
              <TrendingUp className="size-4 text-muted-foreground/40" />
            </div>
            <CardTitle className="text-3xl font-bold text-muted-foreground">
              —
            </CardTitle>
            <CardDescription className="text-xs">No data yet</CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Incidents (30d)</CardDescription>
              <AlertTriangle className="size-4 text-muted-foreground/40" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">
              0
            </CardTitle>
            <CardDescription className="text-xs">
              No incidents recorded
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Empty state */}
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
        <div className="mt-5 flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-amber-400" />
          Monitors are coming soon
        </div>
      </div>
    </div>
  );
}
