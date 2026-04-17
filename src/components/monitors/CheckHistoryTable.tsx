import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ERROR_LABELS } from "@/lib/constants/monitors";

type CheckResult = {
  id: string;
  checkedAt: Date;
  errorType: string | null;
  statusCode: number | null;
  latencyMs: number | null;
};

type Props = {
  checkResults: CheckResult[];
};

export function CheckHistoryTable({ checkResults }: Props) {
  return (
    <section className="mt-6 pb-8">
      <h2 className="mb-2 text-sm font-medium text-foreground">
        Check History
      </h2>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Time
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Code
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Latency
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {checkResults.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No checks recorded yet
                </td>
              </tr>
            )}
            {checkResults.map((r) => (
              <tr
                key={r.id}
                className={cn(
                  "transition-colors hover:bg-muted/40",
                  r.errorType && "bg-destructive/5 hover:bg-destructive/10",
                )}
              >
                <td className="px-4 py-2.5 text-muted-foreground">
                  {formatDate(r.checkedAt)}
                </td>
                <td className="px-4 py-2.5">
                  {r.errorType ? (
                    <span className="flex items-center gap-1.5 text-destructive">
                      <AlertTriangle className="size-3 shrink-0" />
                      {ERROR_LABELS[r.errorType] ?? r.errorType}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-success">
                      <CheckCircle2 className="size-3 shrink-0" />
                      OK
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                  {r.statusCode ?? "—"}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                  {r.latencyMs != null ? (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 shrink-0" />
                      {r.latencyMs}ms
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
