import type { Pool } from 'pg';
import type { SchedulerProjectRow } from '../../model/scheduler-project';
import { mapSchedulerProjectRow } from '../../utils/pg/map-scheduler-project-row';

/**
 * Lists all scheduler businesses ordered by id.
 */
export const listSchedulerProjects = async (pool: Pool): Promise<SchedulerProjectRow[]> => {
  const result = await pool.query(
    `SELECT id, name, created_at, updated_at FROM scheduler_project ORDER BY id`,
  );
  return result.rows.map((row) => mapSchedulerProjectRow(row));
};
