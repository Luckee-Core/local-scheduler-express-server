import type { Pool } from 'pg';
import { processExecuteTask } from '../scheduler/process-execute-task';
import { processGetScheduledTask } from './process-get-scheduled-task';

/**
 * Runs a task immediately (manual trigger). Ignores `enabled` and schedule windows.
 */
export const processRunTaskNow = async (pool: Pool, taskId: string) => {
  const task = await processGetScheduledTask(pool, taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  return processExecuteTask({
    pool,
    task,
    trigger: 'manual',
  });
};
