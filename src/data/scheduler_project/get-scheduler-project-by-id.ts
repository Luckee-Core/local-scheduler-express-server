import type { Pool } from 'pg';
import type { SchedulerProjectRow } from '../../model/scheduler-project';
import { mapSchedulerProjectRow } from '../../utils/pg/map-scheduler-project-row';

/**
 * Returns one scheduler business by id.
 */
export const getSchedulerProjectById = async (
  pool: Pool,
  id: string,
): Promise<SchedulerProjectRow | null> => {
  const result = await pool.query(
    `SELECT id, name, created_at, updated_at FROM scheduler_project WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapSchedulerProjectRow(result.rows[0]);
};
