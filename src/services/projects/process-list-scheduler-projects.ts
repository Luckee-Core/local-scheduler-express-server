import type { Pool } from 'pg';
import type { MergedSchedulerProject } from '../../model/scheduler-project';
import { listSchedulerProjects } from '../../data/scheduler_project';
import { toMergedSchedulerProject } from '../../utils/scheduler/to-merged-scheduler-project';

/**
 * Lists scheduler businesses for the API.
 */
export const processListSchedulerProjects = async (
  pool: Pool,
): Promise<MergedSchedulerProject[]> => {
  const rows = await listSchedulerProjects(pool);
  return rows.map((row) => toMergedSchedulerProject(row));
};
