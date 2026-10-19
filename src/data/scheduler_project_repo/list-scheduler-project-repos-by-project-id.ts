import type { Pool } from 'pg';
import type { SchedulerProjectRepoRow } from '../../model/scheduler-project-repo';
import { mapSchedulerProjectRepoRow } from '../../utils/pg/map-scheduler-project-repo-row';

const REPO_SELECT = `SELECT id, scheduler_project_id, express_repo_name, execution_type,
  production_base_url, default_port, health_path, created_at, updated_at`;

/**
 * Lists repos for one scheduler business.
 */
export const listSchedulerProjectReposByProjectId = async (
  pool: Pool,
  schedulerProjectId: string,
): Promise<SchedulerProjectRepoRow[]> => {
  const result = await pool.query(
    `${REPO_SELECT} FROM scheduler_project_repo WHERE scheduler_project_id = $1 ORDER BY id`,
    [schedulerProjectId],
  );
  return result.rows.map((row) => mapSchedulerProjectRepoRow(row));
};
