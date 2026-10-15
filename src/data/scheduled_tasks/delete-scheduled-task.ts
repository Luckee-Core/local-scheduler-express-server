import type { Pool } from 'pg';

/**
 * Deletes a scheduled task by id.
 */
export const deleteScheduledTask = async (pool: Pool, id: string): Promise<boolean> => {
  const result = await pool.query(`DELETE FROM scheduled_tasks WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};
