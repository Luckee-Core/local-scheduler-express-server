import type { Pool } from 'pg';
import type { MergedSchedulerProjectRepo } from '../../model/scheduler-project-repo';
import { listSchedulerProjectReposByProjectId } from '../../data/scheduler_project_repo';
import { toMergedSchedulerProjectRepo } from '../../utils/scheduler/to-merged-scheduler-project-repo';

/**
 * Lists repos for one scheduler business.
 */
export const processListSchedulerProjectReposByProjectId = async (
  pool: Pool,
  schedulerProjectId: string,
): Promise<MergedSchedulerProjectRepo[]> => {
  const rows = await listSchedulerProjectReposByProjectId(pool, schedulerProjectId);
  return rows.map((row) => toMergedSchedulerProjectRepo(row));
};
