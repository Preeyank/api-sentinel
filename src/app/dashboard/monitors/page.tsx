import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MonitorList } from "@/components/dashboard/MonitorList";

export default async function MonitorsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const monitors = await prisma.monitor.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Monitors
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your HTTP endpoint monitors.
        </p>
      </div>
      <MonitorList monitors={monitors} />
    </div>
  );
}
