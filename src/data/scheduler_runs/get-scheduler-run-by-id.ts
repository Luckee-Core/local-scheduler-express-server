import type { Pool } from 'pg';
import type { SchedulerRun } from '../../model/scheduler-run';
import { mapSchedulerRunRow } from '../../utils/pg/map-scheduler-run-row';

/**
 * Returns one scheduler run by id.
 */
export const getSchedulerRunById = async (
  pool: Pool,
  runId: string,
): Promise<SchedulerRun | null> => {
  const result = await pool.query(
    `SELECT id, task_id, task_name, started_at, finished_at, duration_ms, status, http_status, error, response_summary, trigger
     FROM scheduler_runs
     WHERE id = $1::uuid`,
    [runId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapSchedulerRunRow(result.rows[0]);
};
