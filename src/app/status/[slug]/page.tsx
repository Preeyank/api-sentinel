import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Per-page metadata so a shared /status/{slug} link shows the monitor name in
// the browser tab and link previews, rather than the generic app title.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const monitor = await prisma.monitor.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!monitor) return { title: "Status not found — API Sentinel" };

  return {
    title: `${monitor.name} — Status`,
    description: `Live status and uptime for ${monitor.name}, monitored by API Sentinel.`,
  };
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const monitor = await prisma.monitor.findUnique({
    where: { slug },
    include: {
      checkResults: {
        orderBy: { checkedAt: "desc" },
        take: 1,
        select: { errorType: true, checkedAt: true },
      },
      incidents: {
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          endedAt: true,
        },
      },
    },
  });

  if (!monitor) notFound();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);

  const [totalCount, successCount] = await Promise.all([
    prisma.checkResult.count({
      where: { monitorId: monitor.id, checkedAt: { gte: twentyFourHoursAgo } },
    }),
    prisma.checkResult.count({
      where: {
        monitorId: monitor.id,
        checkedAt: { gte: twentyFourHoursAgo },
        errorType: null,
      },
    }),
  ]);

  const uptime24h = totalCount > 0 ? (successCount / totalCount) * 100 : null;
  const latestCheck = monitor.checkResults[0] ?? null;

  // Derive current status from the latest check result
  let statusLabel: "Operational" | "Degraded" | "Down" | "No data";
  let StatusIcon: React.ElementType;
  let statusColor: string;

  if (!monitor.isActive) {
    statusLabel = "Degraded";
    StatusIcon = AlertTriangle;
    statusColor = "text-amber-500";
  } else if (!latestCheck) {
    statusLabel = "No data";
    StatusIcon = Clock;
    statusColor = "text-muted-foreground";
  } else if (latestCheck.errorType === null) {
    statusLabel = "Operational";
    StatusIcon = CheckCircle2;
    statusColor = "text-emerald-500";
  } else {
    statusLabel = "Down";
    StatusIcon = XCircle;
    statusColor = "text-destructive";
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Status Page
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {monitor.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{monitor.url}</p>
        </div>

        {/* Current status */}
        <div className="rounded-xl border border-border bg-card px-6 py-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={cn("size-5", statusColor)} />
              <span className={cn("text-base font-medium", statusColor)}>
                {statusLabel}
              </span>
            </div>
            {latestCheck && (
              <span className="text-xs text-muted-foreground">
                Last checked {timeAgo(latestCheck.checkedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Uptime */}
        <div className="rounded-xl border border-border bg-card px-6 py-5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Uptime (24h)
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                uptime24h === null
                  ? "text-muted-foreground"
                  : uptime24h >= 80
                    ? "text-emerald-500"
                    : "text-destructive",
              )}
            >
              {uptime24h === null ? "—" : `${uptime24h.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* Recent incidents */}
        <div className="rounded-xl border border-border bg-card px-6 py-5 mb-4">
          <h2 className="text-sm font-medium text-foreground mb-4">
            Recent incidents
          </h2>
          {monitor.incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No incidents in the last 10 records.
            </p>
          ) : (
            <ul className="space-y-3">
              {monitor.incidents.map((incident) => (
                <li
                  key={incident.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        incident.type === "FAILURE"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-500",
                      )}
                    >
                      {incident.type}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        incident.status === "OPEN"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {incident.status}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDate(incident.startedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Monitored by{" "}
          <span className="font-medium text-foreground">API Sentinel</span>
        </p>
      </div>
    </div>
  );
}
