import type { Pool } from 'pg';
import type { SchedulerRun } from '../../model/scheduler-run';
import { mapSchedulerRunRow } from '../../utils/pg/map-scheduler-run-row';

/**
 * Lists scheduler runs newest first.
 */
export const listSchedulerRuns = async (pool: Pool, limit = 100): Promise<SchedulerRun[]> => {
  const result = await pool.query(
    `SELECT id, task_id, task_name, started_at, finished_at, duration_ms, status, http_status, error, response_summary, trigger
     FROM scheduler_runs
     ORDER BY finished_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => mapSchedulerRunRow(row));
};
