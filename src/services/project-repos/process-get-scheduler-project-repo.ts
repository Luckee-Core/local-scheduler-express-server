import type { Pool } from 'pg';
import type { MergedSchedulerProjectRepo } from '../../model/scheduler-project-repo';
import { getSchedulerProjectRepoById } from '../../data/scheduler_project_repo';
import { toMergedSchedulerProjectRepo } from '../../utils/scheduler/to-merged-scheduler-project-repo';

/**
 * Returns one scheduler project repo by id.
 */
export const processGetSchedulerProjectRepo = async (
  pool: Pool,
  id: string,
): Promise<MergedSchedulerProjectRepo | null> => {
  const row = await getSchedulerProjectRepoById(pool, id);
  if (!row) {
    return null;
  }
  return toMergedSchedulerProjectRepo(row);
};
