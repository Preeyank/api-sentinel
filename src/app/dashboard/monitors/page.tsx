import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MonitorList } from "@/components/monitors/MonitorList";
import type { MonitorStatus, MonitorWithStats } from "@/types/monitors";

export default async function MonitorsPage() {
  const session = await getRequiredSession();

  const monitors = await prisma.monitor.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      checkResults: {
        take: 1,
        orderBy: { checkedAt: "desc" },
        select: { errorType: true },
      },
    },
  });

  const monitorIds = monitors.map((m) => m.id);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);

  const [totalCounts, successCounts, recentChecks] = await Promise.all([
    prisma.checkResult.groupBy({
      by: ["monitorId"],
      where: {
        monitorId: { in: monitorIds },
        checkedAt: { gte: twentyFourHoursAgo },
      },
      _count: { id: true },
    }),
    prisma.checkResult.groupBy({
      by: ["monitorId"],
      where: {
        monitorId: { in: monitorIds },
        checkedAt: { gte: twentyFourHoursAgo },
        errorType: null,
      },
      _count: { id: true },
    }),
    // For uptime mini-bars
    prisma.checkResult.findMany({
      where: {
        monitorId: { in: monitorIds },
        checkedAt: { gte: twentyFourHoursAgo },
      },
      select: { monitorId: true, checkedAt: true, errorType: true },
      orderBy: { checkedAt: "asc" },
    }),
  ]);

  const totalMap = Object.fromEntries(
    totalCounts.map((r) => [r.monitorId, r._count.id]),
  );
  const successMap = Object.fromEntries(
    successCounts.map((r) => [r.monitorId, r._count.id]),
  );

  type Segment = "up" | "down" | "none";
  function buildSegments(monitorId: string): Segment[] {
    return Array.from({ length: 24 }, (_, i) => {
      const segStart = new Date(now.getTime() - (24 - i) * 60 * 60 * 1_000);
      const segEnd = new Date(segStart.getTime() + 60 * 60 * 1_000);
      const hourChecks = recentChecks.filter(
        (c) =>
          c.monitorId === monitorId &&
          c.checkedAt >= segStart &&
          c.checkedAt < segEnd,
      );
      if (hourChecks.length === 0) return "none";
      return hourChecks.some((c) => c.errorType !== null) ? "down" : "up";
    });
  }

  const monitorsWithStats: MonitorWithStats[] = monitors.map((m) => {
    const latestCheck = m.checkResults[0] ?? null;

    let status: MonitorStatus;
    if (!m.isActive) status = "PAUSED";
    else if (!m.lastCheckedAt) status = "UNKNOWN";
    else if (latestCheck?.errorType == null) status = "UP";
    else status = "DOWN";

    const total = totalMap[m.id] ?? 0;
    const success = successMap[m.id] ?? 0;
    const uptime24h = total > 0 ? (success / total) * 100 : null;
    const uptimeSegments = buildSegments(m.id);

    const { checkResults, ...rest } = m;
    void checkResults; // omit the relation from the serialized payload
    return { ...rest, status, uptime24h, uptimeSegments };
  });

  return (
    <div className="max-w-5xl p-6 lg:p-8 animate-fade-in">
      <MonitorList monitors={monitorsWithStats} />
    </div>
  );
}
