import type { Pool } from 'pg';
import cron, { type ScheduledTask as CronJob } from 'node-cron';
import { listScheduledTasks } from '../../data/scheduled_tasks';
import { buildCronExpression } from '../../utils/schedule/build-cron-expression';
import { isWithinScheduleWindow } from '../../utils/worker';
import { processGetScheduledTask } from '../tasks/process-get-scheduled-task';
import { processExecuteTask } from './process-execute-task';

const scheduledJobs: CronJob[] = [];
const ticksInProgress = new Set<string>();
let schedulerPool: Pool | null = null;
let registerJobsPromise: Promise<void> = Promise.resolve();

/**
 * Processes one scheduled tick for a task id.
 */
export const processTick = async (taskId: string): Promise<void> => {
  if (!schedulerPool) {
    console.error('❌ Scheduled tick skipped — database pool unavailable');
    return;
  }

  if (ticksInProgress.has(taskId)) {
    console.log(`⏭️ Scheduler tick skipped — ${taskId} still running`);
    return;
  }

  ticksInProgress.add(taskId);
  try {
    const task = await processGetScheduledTask(schedulerPool, taskId);
    if (!task) {
      console.error(`❌ Scheduled task not found: ${taskId}`);
      return;
    }

    if (!isWithinScheduleWindow(task.schedule)) {
      return;
    }

    await processExecuteTask({
      pool: schedulerPool,
      task,
      trigger: 'scheduled',
    });
  } finally {
    ticksInProgress.delete(taskId);
  }
};

/**
 * Registers node-cron jobs for all enabled tasks.
 */
export const registerTaskJobs = async (pool: Pool): Promise<void> => {
  registerJobsPromise = registerJobsPromise.then(async () => {
    schedulerPool = pool;
    scheduledJobs.forEach((job) => job.stop());
    scheduledJobs.length = 0;

    const rows = await listScheduledTasks(pool);
    const tasks = rows.filter((task) => task.enabled);

    for (const task of tasks) {
      const expression = buildCronExpression(task.schedule);
      if (!expression) {
        console.warn(
          `⚠️ Skipping cron for ${task.id}: invalid or empty schedule window`,
        );
        continue;
      }

      const job = cron.schedule(
        expression,
        () => {
          void processTick(task.id);
        },
        { timezone: task.schedule.timezone },
      );

      scheduledJobs.push(job);
      console.log(`🕐 Registered cron for ${task.id}: ${expression} (${task.schedule.timezone})`);
    }
  });

  await registerJobsPromise;
};

/**
 * Starts the in-process scheduler on server boot.
 */
export const initializeScheduler = async (pool: Pool): Promise<void> => {
  console.log('🚀 Initializing local scheduler…');
  await registerTaskJobs(pool);
};
