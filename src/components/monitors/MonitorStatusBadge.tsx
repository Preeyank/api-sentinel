import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants/monitors";
import type { MonitorStatus } from "@/types/monitors";

const STATUS_BADGE_CLASSES: Record<Exclude<MonitorStatus, "UP">, string> = {
  DOWN: "border-destructive/30 bg-destructive/10 text-destructive",
  PAUSED: "border-muted-foreground/30 bg-muted text-muted-foreground",
  UNKNOWN:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function MonitorStatusBadge({ status }: { status: MonitorStatus }) {
  if (status === "UP") return null;
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 text-[10px]", STATUS_BADGE_CLASSES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
