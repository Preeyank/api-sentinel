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

function statusCodeColor(code: number | null): string {
  if (code === null) return "text-muted-foreground";
  if (code >= 200 && code < 300) return "text-success";
  if (code >= 400) return "text-destructive";
  return "text-muted-foreground";
}

export function CheckHistoryTable({ checkResults }: Props) {
  return (
    <section className="mt-6 pb-8">
      <h2 className="mb-2 text-sm font-medium text-foreground">
        Check History
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
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
          <tbody className="divide-y divide-border/60">
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
                  "transition-colors hover:bg-muted/30",
                  r.errorType &&
                    "bg-destructive/[0.03] hover:bg-destructive/[0.07]",
                )}
              >
                <td className="px-4 py-2.5 text-muted-foreground">
                  {formatDate(r.checkedAt)}
                </td>
                <td className="px-4 py-2.5">
                  {r.errorType ? (
                    <span className="flex items-center gap-2 text-destructive">
                      <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                      {ERROR_LABELS[r.errorType] ?? r.errorType}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-success">
                      <span className="size-1.5 shrink-0 rounded-full bg-success" />
                      OK
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 font-mono tabular-nums",
                    statusCodeColor(r.statusCode),
                  )}
                >
                  {r.statusCode ?? "—"}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                  {r.latencyMs != null ? `${r.latencyMs}ms` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
