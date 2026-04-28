import { AlertTriangle, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Incident = {
  id: string;
  type: string;
  startedAt: Date;
};

function durationLabel(startedAt: Date): string {
  const ms = Date.now() - startedAt.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just started";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

type Props = {
  incidents: Incident[];
};

export function OpenIncidentsList({ incidents }: Props) {
  if (incidents.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-medium text-foreground">
        Open Incidents
      </h2>
      <div className="flex flex-col gap-2">
        {incidents.map((incident) => {
          const isFailure = incident.type === "FAILURE";
          return (
            <div
              key={incident.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5",
                "border-l-2",
                isFailure
                  ? "border-l-destructive bg-destructive/[0.03]"
                  : "border-l-amber-500 bg-amber-500/[0.03]",
              )}
            >
              {isFailure ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              ) : (
                <Zap className="mt-0.5 size-4 shrink-0 text-amber-500" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isFailure ? "text-destructive" : "text-amber-500",
                    )}
                  >
                    {isFailure ? "Service failure" : "High latency"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isFailure
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-500",
                    )}
                  >
                    {incident.type}
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isFailure
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-500",
                    )}
                  >
                    {durationLabel(incident.startedAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Started {formatDate(incident.startedAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
