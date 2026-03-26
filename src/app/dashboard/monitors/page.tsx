import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MonitorList } from "@/components/dashboard/MonitorList";

export default async function MonitorsPage() {
  const session = await getRequiredSession();

  const monitors = await prisma.monitor.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl p-6 lg:p-8">
      <MonitorList monitors={monitors} />
    </div>
  );
}
