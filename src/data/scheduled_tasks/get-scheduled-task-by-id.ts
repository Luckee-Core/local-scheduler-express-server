import type { Pool } from 'pg';
import type { ScheduledTaskRow } from '../../model/scheduled-task';
import { mapScheduledTaskRow } from '../../utils/pg/map-scheduled-task-row';

/**
 * Returns one scheduled task by id.
 */
export const getScheduledTaskById = async (
  pool: Pool,
  id: string,
): Promise<ScheduledTaskRow | null> => {
  const result = await pool.query(
    `SELECT id, name, worker_project_id, enabled, worker, request, schedule, lifecycle, created_at, updated_at
     FROM scheduled_tasks
     WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapScheduledTaskRow(result.rows[0]);
};
