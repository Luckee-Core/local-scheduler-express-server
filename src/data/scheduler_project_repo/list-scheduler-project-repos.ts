import type { Pool } from 'pg';
import type { SchedulerProjectRepoRow } from '../../model/scheduler-project-repo';
import { mapSchedulerProjectRepoRow } from '../../utils/pg/map-scheduler-project-repo-row';

const REPO_SELECT = `SELECT id, scheduler_project_id, express_repo_name, execution_type,
  production_base_url, default_port, health_path, created_at, updated_at`;

/**
 * Lists all scheduler project repos ordered by id.
 */
export const listSchedulerProjectRepos = async (pool: Pool): Promise<SchedulerProjectRepoRow[]> => {
  const result = await pool.query(`${REPO_SELECT} FROM scheduler_project_repo ORDER BY id`);
  return result.rows.map((row) => mapSchedulerProjectRepoRow(row));
};
