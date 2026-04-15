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
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

  const [totalCounts, successCounts] = await Promise.all([
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
  ]);

  const totalMap = Object.fromEntries(
    totalCounts.map((r) => [r.monitorId, r._count.id]),
  );
  const successMap = Object.fromEntries(
    successCounts.map((r) => [r.monitorId, r._count.id]),
  );

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

    const { checkResults: _cr, ...rest } = m;
    return { ...rest, status, uptime24h };
  });

  return (
    <div className="max-w-4xl p-6 lg:p-8">
      <MonitorList monitors={monitorsWithStats} />
    </div>
  );
}
