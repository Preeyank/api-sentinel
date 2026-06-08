import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  monitorName: string;
  // When provided, the monitor name becomes a link back to the monitor detail
  // page and `incidentLabel` is appended as the leaf segment.
  monitorSlug?: string;
  incidentLabel?: string;
};

export function MonitorBreadcrumb({
  monitorName,
  monitorSlug,
  incidentLabel,
}: Props) {
  const hasIncident = Boolean(monitorSlug && incidentLabel);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <Link
            href="/dashboard/monitors"
            className="transition-colors hover:text-foreground"
          >
            Monitors
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-3.5" />
        </li>
        <li className="max-w-[240px] truncate font-medium text-foreground">
          {hasIncident ? (
            <Link
              href={`/dashboard/monitors/${monitorSlug}`}
              className="font-normal text-muted-foreground transition-colors hover:text-foreground"
            >
              {monitorName}
            </Link>
          ) : (
            monitorName
          )}
        </li>
        {hasIncident && (
          <>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li className="font-medium text-foreground">{incidentLabel}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
