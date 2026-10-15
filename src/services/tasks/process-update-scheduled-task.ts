import type { Pool } from 'pg';
import type { MergedScheduledTask, UpdateScheduledTaskInput } from '../../model/scheduled-task';
import { getLatestSchedulerRunForTask } from '../../data/scheduler_runs';
import { updateScheduledTask } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { registerTaskJobs } from '../scheduler/initialize-scheduler';
import { mergeScheduledTaskRow } from './merge-scheduled-task';

/**
 * Updates a scheduled task and refreshes cron jobs.
 */
export const processUpdateScheduledTask = async (
  pool: Pool,
  taskId: string,
  input: UpdateScheduledTaskInput,
): Promise<MergedScheduledTask | null> => {
  const row = await updateScheduledTask(pool, taskId, input);
  if (!row) {
    return null;
  }
  await registerTaskJobs(pool);
  const local = readSchedulerLocal();
  const latest = await getLatestSchedulerRunForTask(pool, taskId);
  return mergeScheduledTaskRow(
    row,
    local,
    latest?.finishedAt ?? null,
    latest?.status ?? null,
  );
};
