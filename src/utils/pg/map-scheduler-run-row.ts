import type { SchedulerRun } from '../../model/scheduler-run';

type DbSchedulerRunRow = {
  id: string;
  task_id: string;
  task_name: string;
  started_at: Date | string;
  finished_at: Date | string;
  duration_ms: number;
  status: SchedulerRun['status'];
  http_status: number | null;
  error: string | null;
  response_summary: string | null;
  trigger: SchedulerRun['trigger'];
};

const toIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : String(value);

/**
 * Maps a Postgres row to SchedulerRun.
 */
export const mapSchedulerRunRow = (row: DbSchedulerRunRow): SchedulerRun => ({
  id: row.id,
  taskId: row.task_id,
  taskName: row.task_name,
  startedAt: toIso(row.started_at),
  finishedAt: toIso(row.finished_at),
  durationMs: row.duration_ms,
  status: row.status,
  httpStatus: row.http_status,
  error: row.error,
  responseSummary: row.response_summary,
  trigger: row.trigger,
});
