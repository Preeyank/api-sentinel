import { notFound } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MonitorBreadcrumb } from "@/components/monitors/MonitorBreadcrumb";
import { MonitorDetailHeader } from "@/components/monitors/MonitorDetailHeader";
import { MonitorStatCards } from "@/components/monitors/MonitorStatCards";
import { OpenIncidentsList } from "@/components/monitors/OpenIncidentsList";
import { CheckHistoryTable } from "@/components/monitors/CheckHistoryTable";
import {
  LatencyChart,
  type LatencyDataPoint,
} from "@/components/monitors/LatencyChart";
import type { MonitorStatus } from "@/lib/constants/monitors";

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const session = await getRequiredSession();

  const monitor = await prisma.monitor.findFirst({
    where: { slug, userId: session.user.id },
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
    <div className="flex h-full flex-col p-6 lg:p-8 animate-fade-in">
      <MonitorBreadcrumb monitorName={monitor.name} />

      <MonitorDetailHeader
        name={monitor.name}
        status={status}
        environment={monitor.environment}
        url={monitor.url}
        intervalSec={monitor.intervalSec}
        timeoutMs={monitor.timeoutMs}
        expectedStatus={monitor.expectedStatus}
        latencyThresholdMs={monitor.latencyThresholdMs}
      />

      <MonitorStatCards
        uptime24h={uptime24h}
        totalCount={totalCount}
        avgLatency={avgLatency}
        openIncidentsCount={openIncidents.length}
        lastCheckedAt={monitor.lastCheckedAt}
      />

      <OpenIncidentsList incidents={openIncidents} />

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          Latency — last {checkResults.length} checks
        </h2>
        <div className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm">
          <LatencyChart
            data={chartData}
            latencyThresholdMs={monitor.latencyThresholdMs}
          />
        </div>
      </section>

      <CheckHistoryTable checkResults={checkResults} />
    </div>
  );
}
