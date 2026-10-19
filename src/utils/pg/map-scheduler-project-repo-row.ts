import type { SchedulerProjectRepoRow } from '../../model/scheduler-project-repo';

type DbSchedulerProjectRepoRow = {
  id: string;
  scheduler_project_id: string;
  express_repo_name: string;
  execution_type: SchedulerProjectRepoRow['executionType'];
  production_base_url: string | null;
  default_port: number | null;
  health_path: string;
  created_at: Date | string;
  updated_at: Date | string;
};

/**
 * Maps a Postgres row to SchedulerProjectRepoRow.
 */
export const mapSchedulerProjectRepoRow = (row: DbSchedulerProjectRepoRow): SchedulerProjectRepoRow => ({
  id: row.id,
  schedulerProjectId: row.scheduler_project_id,
  expressRepoName: row.express_repo_name,
  executionType: row.execution_type,
  productionBaseUrl: row.production_base_url,
  defaultPort: row.default_port,
  healthPath: row.health_path,
  createdAt:
    row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  updatedAt:
    row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
});
