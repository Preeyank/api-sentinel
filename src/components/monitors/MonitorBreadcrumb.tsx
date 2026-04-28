import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  monitorName: string;
};

export function MonitorBreadcrumb({ monitorName }: Props) {
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
          {monitorName}
        </li>
      </ol>
    </nav>
  );
}
