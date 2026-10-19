import type { Pool } from 'pg';
import type { SchedulerProjectRow, UpsertSchedulerProjectInput } from '../../model/scheduler-project';
import { mapSchedulerProjectRow } from '../../utils/pg/map-scheduler-project-row';

/**
 * Inserts or updates a scheduler business row.
 */
export const upsertSchedulerProject = async (
  pool: Pool,
  input: UpsertSchedulerProjectInput,
): Promise<SchedulerProjectRow> => {
  const now = new Date().toISOString();
  const result = await pool.query(
    `INSERT INTO scheduler_project (id, name, created_at, updated_at)
     VALUES ($1, $2, $3::timestamptz, $4::timestamptz)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at
     RETURNING id, name, created_at, updated_at`,
    [input.id, input.name, now, now],
  );
  return mapSchedulerProjectRow(result.rows[0]);
};
