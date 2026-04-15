import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { MonitorStatusBadge } from "@/components/monitors/MonitorStatusBadge";
import {
  LatencyChart,
  type LatencyDataPoint,
} from "@/components/monitors/LatencyChart";
import { cn, formatDate, formatInterval, timeAgo } from "@/lib/utils";
import { ENV_LABELS, ERROR_LABELS } from "@/lib/constants/monitors";
import type { MonitorStatus } from "@/lib/constants/monitors";

const ENV_BADGE_CLASSES = {
  PROD: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  STAGING:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DEV: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
} as const;

function durationLabel(startedAt: Date): string {
  const ms = new Date().getTime() - startedAt.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just started";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getRequiredSession();

  const monitor = await prisma.monitor.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!monitor) notFound();

  const since24h = new Date();
  since24h.setDate(since24h.getDate() - 1);

  const [checkResults, openIncidents, totalCount, successCount] =
    await Promise.all([
      prisma.checkResult.findMany({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: "desc" },
        take: 50,
      }),
      prisma.incident.findMany({
        where: { monitorId: monitor.id, status: "OPEN" },
        orderBy: { startedAt: "desc" },
      }),
      prisma.checkResult.count({
        where: { monitorId: monitor.id, checkedAt: { gte: since24h } },
      }),
      prisma.checkResult.count({
        where: {
          monitorId: monitor.id,
          checkedAt: { gte: since24h },
          errorType: null,
        },
      }),
    ]);

  const uptime24h = totalCount > 0 ? (successCount / totalCount) * 100 : null;

  const latencyValues = checkResults
    .filter((r) => r.latencyMs !== null && r.errorType === null)
    .map((r) => r.latencyMs as number);
  const avgLatency =
    latencyValues.length > 0
      ? Math.round(
          latencyValues.reduce((s, v) => s + v, 0) / latencyValues.length,
        )
      : null;

  const latestCheck = checkResults[0] ?? null;
  let status: MonitorStatus;
  if (!monitor.isActive) status = "PAUSED";
  else if (!monitor.lastCheckedAt) status = "UNKNOWN";
  else if (latestCheck?.errorType == null) status = "UP";
  else status = "DOWN";

  const chartData: LatencyDataPoint[] = checkResults.map((r) => ({
    time: r.checkedAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    latencyMs: r.latencyMs,
    ok: r.errorType === null,
  }));

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      {/* Back nav */}
      <Link
        href="/dashboard/monitors"
        className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Monitors
      </Link>

      {/* Header */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            {monitor.name}
          </h1>
          <MonitorStatusBadge status={status} />
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              ENV_BADGE_CLASSES[monitor.environment],
            )}
          >
            {ENV_LABELS[monitor.environment]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{monitor.url}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Checked every {formatInterval(monitor.intervalSec)} · Timeout{" "}
          {monitor.timeoutMs / 1000}s · Expects {monitor.expectedStatus}
          {monitor.latencyThresholdMs && (
            <> · Latency alert &gt;{monitor.latencyThresholdMs}ms</>
          )}
        </p>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-3">
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
              openIncidents.length > 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {openIncidents.length}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            last checked {timeAgo(monitor.lastCheckedAt)}
          </p>
        </div>
      </div>

      {/* Open incidents */}
      {openIncidents.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-foreground">
            Open Incidents
          </h2>
          <div className="divide-y overflow-hidden rounded-xl border">
            {openIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-destructive">
                      {incident.type === "FAILURE"
                        ? "Service failure"
                        : "High latency"}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-destructive/30 bg-destructive/10 text-[10px] text-destructive"
                    >
                      {incident.type}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Started {formatDate(incident.startedAt)} · Open for{" "}
                    {durationLabel(incident.startedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latency chart */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          Latency — last {checkResults.length} checks
        </h2>
        <div className="rounded-xl border bg-card p-4">
          <LatencyChart data={chartData} />
        </div>
      </section>

      {/* Check history */}
      <section className="mt-6 pb-8">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          Check History
        </h2>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  Time
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  Code
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  Latency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {checkResults.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No checks recorded yet
                  </td>
                </tr>
              )}
              {checkResults.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    "transition-colors hover:bg-muted/40",
                    r.errorType && "bg-destructive/5 hover:bg-destructive/10",
                  )}
                >
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatDate(r.checkedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.errorType ? (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <AlertTriangle className="size-3 shrink-0" />
                        {ERROR_LABELS[r.errorType] ?? r.errorType}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="size-3 shrink-0" />
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {r.statusCode ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {r.latencyMs != null ? (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 shrink-0" />
                        {r.latencyMs}ms
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
