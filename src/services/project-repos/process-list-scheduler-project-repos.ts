import type { Pool } from 'pg';
import type { MergedSchedulerProjectRepo } from '../../model/scheduler-project-repo';
import { listSchedulerProjectRepos } from '../../data/scheduler_project_repo';
import { toMergedSchedulerProjectRepo } from '../../utils/scheduler/to-merged-scheduler-project-repo';

/**
 * Lists all scheduler project repos for the API.
 */
export const processListSchedulerProjectRepos = async (
  pool: Pool,
): Promise<MergedSchedulerProjectRepo[]> => {
  const rows = await listSchedulerProjectRepos(pool);
  return rows.map((row) => toMergedSchedulerProjectRepo(row));
};
