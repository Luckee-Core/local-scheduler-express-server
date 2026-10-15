import type { Pool } from 'pg';
import type { MergedScheduledTask } from '../../model/scheduled-task';
import { getLatestSchedulerRunForTask } from '../../data/scheduler_runs';
import { listScheduledTasks } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { mergeScheduledTaskRow } from './merge-scheduled-task';

/**
 * Loads all merged scheduled tasks with last-run metadata.
 */
export const processListScheduledTasks = async (pool: Pool): Promise<MergedScheduledTask[]> => {
  const rows = await listScheduledTasks(pool);
  const local = readSchedulerLocal();

  const merged: MergedScheduledTask[] = [];
  for (const row of rows) {
    const latest = await getLatestSchedulerRunForTask(pool, row.id);
    merged.push(
      mergeScheduledTaskRow(
        row,
        local,
        latest?.finishedAt ?? null,
        latest?.status ?? null,
      ),
    );
  }
  return merged;
};
