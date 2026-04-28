/**
 * Summary returned by the cron dispatcher after each automated run.
 *
 * checked   — number of monitors that were due (check attempted regardless of outcome)
 * failures  — subset of checked where the check result was not ok
 * skipped   — checks that threw an unexpected runtime error (DB failure, bug, etc.)
 *             and could not produce an outcome; these are counted separately so a
 *             single broken monitor does not silently inflate the failure rate
 * durationMs — wall-clock time for the entire dispatch cycle (query + all HTTP checks)
 */
export type CronRunSummary = {
  checked: number;
  failures: number;
  skipped: number;
  durationMs: number;
};
