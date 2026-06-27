import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

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

  // The back link points one level up: to the monitor for an incident page,
  // or to the monitors list for a monitor detail page.
  const backHref = hasIncident
    ? `/dashboard/monitors/${monitorSlug}`
    : "/dashboard/monitors";
  const backLabel = hasIncident ? "Back to monitor" : "Back to monitors";

  return (
    <div className="flex flex-col gap-2">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

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
    </div>
  );
}
