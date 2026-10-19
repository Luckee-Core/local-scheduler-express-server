import type { Pool } from 'pg';
import type { ScheduledTaskRow } from '../../model/scheduled-task';
import { mapScheduledTaskRow } from '../../utils/pg/map-scheduled-task-row';

/**
 * Lists all scheduled tasks ordered by name.
 */
export const listScheduledTasks = async (pool: Pool): Promise<ScheduledTaskRow[]> => {
  const result = await pool.query(
    `SELECT id, name, worker_project_id, scheduler_project_repo_id, enabled, worker, request, schedule, lifecycle, created_at, updated_at
     FROM scheduled_tasks
     ORDER BY name ASC`,
  );
  return result.rows.map((row) => mapScheduledTaskRow(row));
};
