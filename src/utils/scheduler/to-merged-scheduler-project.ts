import type { MergedSchedulerProject, SchedulerProjectRow } from '../../model/scheduler-project';

/**
 * API subset of a scheduler business row.
 */
export const toMergedSchedulerProject = (row: SchedulerProjectRow): MergedSchedulerProject => ({
  id: row.id,
  name: row.name,
});
