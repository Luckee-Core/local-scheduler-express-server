import type { Pool } from 'pg';
import type { MergedScheduledTask } from '../../model/scheduled-task';
import { getLatestSchedulerRunForTask } from '../../data/scheduler_runs';
import { getScheduledTaskById } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { mergeScheduledTaskRow } from './merge-scheduled-task';

/**
 * Returns one merged scheduled task by id.
 */
export const processGetScheduledTask = async (
  pool: Pool,
  taskId: string,
): Promise<MergedScheduledTask | null> => {
  const row = await getScheduledTaskById(pool, taskId);
  if (!row) {
    return null;
  }
  const local = readSchedulerLocal();
  const latest = await getLatestSchedulerRunForTask(pool, taskId);
  return mergeScheduledTaskRow(
    row,
    local,
    latest?.finishedAt ?? null,
    latest?.status ?? null,
  );
};
