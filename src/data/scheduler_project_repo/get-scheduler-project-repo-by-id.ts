import type { Pool } from 'pg';
import type { SchedulerProjectRepoRow } from '../../model/scheduler-project-repo';
import { mapSchedulerProjectRepoRow } from '../../utils/pg/map-scheduler-project-repo-row';

/**
 * Returns one scheduler project repo by id.
 */
export const getSchedulerProjectRepoById = async (
  pool: Pool,
  id: string,
): Promise<SchedulerProjectRepoRow | null> => {
  const result = await pool.query(
    `SELECT id, scheduler_project_id, express_repo_name, execution_type,
      production_base_url, default_port, health_path, created_at, updated_at
     FROM scheduler_project_repo WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapSchedulerProjectRepoRow(result.rows[0]);
};
