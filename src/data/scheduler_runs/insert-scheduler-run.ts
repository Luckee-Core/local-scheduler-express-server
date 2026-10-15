import { randomUUID } from 'crypto';
import type { Pool } from 'pg';
import type { AppendSchedulerRunInput, SchedulerRun } from '../../model/scheduler-run';
import { mapSchedulerRunRow } from '../../utils/pg/map-scheduler-run-row';

/**
 * Inserts a scheduler run record.
 */
export const insertSchedulerRun = async (
  pool: Pool,
  input: AppendSchedulerRunInput,
): Promise<SchedulerRun> => {
  const id = input.id ?? randomUUID();
  const result = await pool.query(
    `INSERT INTO scheduler_runs (
      id, task_id, task_name, started_at, finished_at, duration_ms, status, http_status, error, response_summary, trigger
    ) VALUES ($1::uuid, $2, $3, $4::timestamptz, $5::timestamptz, $6, $7, $8, $9, $10, $11)
    RETURNING id, task_id, task_name, started_at, finished_at, duration_ms, status, http_status, error, response_summary, trigger`,
    [
      id,
      input.taskId,
      input.taskName,
      input.startedAt,
      input.finishedAt,
      input.durationMs,
      input.status,
      input.httpStatus,
      input.error,
      input.responseSummary,
      input.trigger,
    ],
  );
  return mapSchedulerRunRow(result.rows[0]);
};
