import { notFound } from "next/navigation";
import { AlertTriangle, Zap } from "lucide-react";
import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MonitorBreadcrumb } from "@/components/monitors/MonitorBreadcrumb";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ERROR_LABELS } from "@/lib/constants/monitors";

function formatDuration(startedAt: Date, endedAt: Date | null): string {
  const end = endedAt ? endedAt.getTime() : Date.now();
  const ms = end - startedAt.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return remMins ? `${hrs}h ${remMins}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

type IncidentSnapshot = {
  statusCode?: number | null;
  latencyMs?: number | null;
  errorType?: string | null;
  thresholdMs?: number | null;
};

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string; incidentId: string }>;
}) {
  const { id: slug, incidentId } = await params;
  const session = await getRequiredSession();

  // Single query — verify ownership via the monitor relation in one go.
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      monitor: { slug, userId: session.user.id },
    },
    include: { monitor: true },
  });
  if (!incident) notFound();

  const isFailure = incident.type === "FAILURE";
  const isOpen = incident.status === "OPEN";
  const typeLabel = isFailure ? "Service failure" : "High latency";
  const snapshot = (incident.incidentSnapshot ?? {}) as IncidentSnapshot;

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 animate-fade-in">
      <MonitorBreadcrumb
        monitorName={incident.monitor.name}
        monitorSlug={incident.monitor.slug}
        incidentLabel={typeLabel}
      />

      {/* Header */}
      <header
        className={cn(
          "mt-4 flex flex-col gap-4 rounded-xl border border-border bg-card px-6 py-5",
          "border-l-2",
          isFailure ? "border-l-destructive" : "border-l-amber-500",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          {isFailure ? (
            <AlertTriangle className="size-5 text-destructive" />
          ) : (
            <Zap className="size-5 text-amber-500" />
          )}
          <h1 className="text-xl font-semibold text-foreground">{typeLabel}</h1>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              isFailure
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-500",
            )}
          >
            {incident.type}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              isOpen
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            )}
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          on{" "}
          <span className="font-medium text-foreground">
            {incident.monitor.name}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Started</div>
            <div className="mt-0.5 text-foreground">
              {formatDate(incident.startedAt)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {isOpen ? "Status" : "Ended"}
            </div>
            <div className="mt-0.5 text-foreground">
              {isOpen ? "Ongoing" : formatDate(incident.endedAt!)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="mt-0.5 text-foreground">
              {formatDuration(incident.startedAt, incident.endedAt)}
            </div>
          </div>
        </div>
      </header>

      {/* Snapshot — what we captured when the incident opened */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          When the incident opened
        </h2>
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {isFailure ? (
              <>
                <SnapshotField
                  label="Status code"
                  value={snapshot.statusCode ?? "—"}
                />
                <SnapshotField
                  label="Latency"
                  value={
                    snapshot.latencyMs != null ? `${snapshot.latencyMs} ms` : "—"
                  }
                />
                <SnapshotField
                  label="Error"
                  value={
                    snapshot.errorType
                      ? ERROR_LABELS[snapshot.errorType] ?? snapshot.errorType
                      : "—"
                  }
                />
              </>
            ) : (
              <>
                <SnapshotField
                  label="Latency"
                  value={
                    snapshot.latencyMs != null ? `${snapshot.latencyMs} ms` : "—"
                  }
                />
                <SnapshotField
                  label="Threshold"
                  value={
                    snapshot.thresholdMs != null
                      ? `${snapshot.thresholdMs} ms`
                      : "—"
                  }
                />
              </>
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}

function SnapshotField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}
