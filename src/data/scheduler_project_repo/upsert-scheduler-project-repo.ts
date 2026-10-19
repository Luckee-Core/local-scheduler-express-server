import type { Pool } from 'pg';
import type {
  SchedulerProjectRepoRow,
  UpsertSchedulerProjectRepoInput,
} from '../../model/scheduler-project-repo';
import { mapSchedulerProjectRepoRow } from '../../utils/pg/map-scheduler-project-repo-row';

/**
 * Inserts or updates a scheduler project repo row.
 */
export const upsertSchedulerProjectRepo = async (
  pool: Pool,
  input: UpsertSchedulerProjectRepoInput,
): Promise<SchedulerProjectRepoRow> => {
  const now = new Date().toISOString();
  const healthPath = input.healthPath ?? '/api/health';
  const productionBaseUrl =
    input.executionType === 'production' ? (input.productionBaseUrl ?? null) : null;
  const defaultPort = input.defaultPort ?? null;

  const result = await pool.query(
    `INSERT INTO scheduler_project_repo (
      id, scheduler_project_id, express_repo_name, execution_type,
      production_base_url, default_port, health_path, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz)
    ON CONFLICT (id) DO UPDATE SET
      scheduler_project_id = EXCLUDED.scheduler_project_id,
      express_repo_name = EXCLUDED.express_repo_name,
      execution_type = EXCLUDED.execution_type,
      production_base_url = EXCLUDED.production_base_url,
      default_port = EXCLUDED.default_port,
      health_path = EXCLUDED.health_path,
      updated_at = EXCLUDED.updated_at
    RETURNING id, scheduler_project_id, express_repo_name, execution_type,
      production_base_url, default_port, health_path, created_at, updated_at`,
    [
      input.id,
      input.schedulerProjectId,
      input.expressRepoName,
      input.executionType,
      productionBaseUrl,
      defaultPort,
      healthPath,
      now,
      now,
    ],
  );
  return mapSchedulerProjectRepoRow(result.rows[0]);
};
