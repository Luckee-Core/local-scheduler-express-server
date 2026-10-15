import type { Pool } from 'pg';
import type { SchedulerRun } from '../../model/scheduler-run';
import { mapSchedulerRunRow } from '../../utils/pg/map-scheduler-run-row';

/**
 * Returns the latest run for a task id, if any.
 */
export const getLatestSchedulerRunForTask = async (
  pool: Pool,
  taskId: string,
): Promise<SchedulerRun | null> => {
  const result = await pool.query(
    `SELECT id, task_id, task_name, started_at, finished_at, duration_ms, status, http_status, error, response_summary, trigger
     FROM scheduler_runs
     WHERE task_id = $1
     ORDER BY finished_at DESC
     LIMIT 1`,
    [taskId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapSchedulerRunRow(result.rows[0]);
};
