/**
 * Summary returned by the cron dispatcher after each automated run.
 *
 * checked   — number of monitors that were due and had a check attempted
 * failures  — subset of checked where the check result was not ok
 * skipped   — reserved for future "claiming" logic (always 0 today)
 * durationMs — wall-clock time for the entire dispatch cycle (query + all HTTP checks)
 */
export type CronRunSummary = {
  checked: number;
  failures: number;
  skipped: number;
  durationMs: number;
};
