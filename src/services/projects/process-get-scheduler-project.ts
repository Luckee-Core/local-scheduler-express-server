import type { Pool } from 'pg';
import type { MergedSchedulerProject } from '../../model/scheduler-project';
import { getSchedulerProjectById } from '../../data/scheduler_project';
import { toMergedSchedulerProject } from '../../utils/scheduler/to-merged-scheduler-project';

/**
 * Returns one scheduler business by id.
 */
export const processGetSchedulerProject = async (
  pool: Pool,
  id: string,
): Promise<MergedSchedulerProject | null> => {
  const row = await getSchedulerProjectById(pool, id);
  if (!row) {
    return null;
  }
  return toMergedSchedulerProject(row);
};
