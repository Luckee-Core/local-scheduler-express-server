import cron, { type ScheduledTask } from 'node-cron';
import { processListTasks } from '../tasks/process-list-tasks';
import { processExecuteTask } from './process-execute-task';

let tickInProgress = false;
const scheduledTasks: ScheduledTask[] = [];

/**
 * Processes one scheduled tick for a task id.
 */
export const processTick = async (taskId: string): Promise<void> => {
  if (tickInProgress) {
    console.log('⏭️ Scheduler tick skipped — previous tick still running');
    return;
  }

  tickInProgress = true;
  try {
    const task = processListTasks().find((entry) => entry.id === taskId);
    if (!task) {
      console.error(`❌ Scheduled task not found: ${taskId}`);
      return;
    }

    await processExecuteTask({ task, trigger: 'scheduled' });
  } finally {
    tickInProgress = false;
  }
};

/**
 * Registers node-cron jobs for all enabled tasks.
 */
export const registerTaskJobs = (): void => {
  scheduledTasks.forEach((job) => job.stop());
  scheduledTasks.length = 0;

  const tasks = processListTasks().filter((task) => task.enabled);

  for (const task of tasks) {
    const minutes = task.schedule.intervalMinutes;
    const expression = minutes >= 60 ? `0 */${Math.floor(minutes / 60)} * * *` : `*/${minutes} * * * *`;

    const job = cron.schedule(
      expression,
      () => {
        void processTick(task.id);
      },
      { timezone: task.schedule.timezone },
    );

    scheduledTasks.push(job);
    console.log(`🕐 Registered cron for ${task.id}: ${expression} (${task.schedule.timezone})`);
  }
};

/**
 * Starts the in-process scheduler on server boot.
 */
export const initializeScheduler = (): void => {
  console.log('🚀 Initializing local scheduler…');
  registerTaskJobs();
};
