import type { Pool } from 'pg';
import { deleteScheduledTask } from '../../data/scheduled_tasks';
import { registerTaskJobs } from '../scheduler/initialize-scheduler';

/**
 * Deletes a scheduled task and refreshes cron jobs.
 */
export const processDeleteScheduledTask = async (pool: Pool, taskId: string): Promise<boolean> => {
  const deleted = await deleteScheduledTask(pool, taskId);
  if (deleted) {
    await registerTaskJobs(pool);
  }
  return deleted;
};
