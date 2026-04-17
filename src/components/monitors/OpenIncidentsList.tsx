import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

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
      <h2 className="mb-2 text-sm font-medium text-foreground">
        Open Incidents
      </h2>
      <div className="divide-y overflow-hidden rounded-xl border">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className="flex items-center gap-3 px-4 py-3 text-sm"
          >
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-destructive">
                  {incident.type === "FAILURE" ? "Service failure" : "High latency"}
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
  );
}
