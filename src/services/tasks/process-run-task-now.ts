import type { Pool } from 'pg';
import { getSchedulerRunById } from '../../data/scheduler_runs';
import type { SchedulerRun } from '../../model/scheduler-run';
import { processExecuteTask } from '../scheduler/process-execute-task';
import { processGetScheduledTask } from './process-get-scheduled-task';

/**
 * Runs a task immediately (manual trigger). Ignores `enabled` and schedule windows.
 */
export const processRunTaskNow = async (pool: Pool, taskId: string): Promise<SchedulerRun> => {
  const task = await processGetScheduledTask(pool, taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const result = await processExecuteTask({
    pool,
    task,
    trigger: 'manual',
  });

  const run = await getSchedulerRunById(pool, result.runId);
  if (!run) {
    throw new Error('Run record missing after execute');
  }

  return run;
};
