import type { Pool } from 'pg';
import type { CreateScheduledTaskInput, MergedScheduledTask } from '../../model/scheduled-task';
import { getScheduledTaskById, insertScheduledTask } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { registerTaskJobs } from '../scheduler/initialize-scheduler';
import { mergeScheduledTaskRow } from './merge-scheduled-task';
import { processUpdateScheduledTask } from './process-update-scheduled-task';

/**
 * Creates a scheduled task and refreshes cron jobs.
 */
export const processCreateScheduledTask = async (
  pool: Pool,
  input: CreateScheduledTaskInput,
  upsert: boolean,
): Promise<MergedScheduledTask> => {
  const existing = await getScheduledTaskById(pool, input.id);
  if (existing && !upsert) {
    throw new Error('Task already exists');
  }

  if (existing && upsert) {
    const updated = await processUpdateScheduledTask(pool, input.id, {
      name: input.name,
      workerProjectId: input.workerProjectId,
      enabled: input.enabled,
      worker: input.worker,
      request: input.request,
      schedule: input.schedule,
      lifecycle: input.lifecycle,
    });
    if (!updated) {
      throw new Error('Task not found');
    }
    return updated;
  }

  const row = await insertScheduledTask(pool, input);
  await registerTaskJobs(pool);
  const local = readSchedulerLocal();
  return mergeScheduledTaskRow(row, local, null, null);
};
