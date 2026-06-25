import { getMergedTaskForExecution } from './process-list-tasks';
import { processExecuteTask } from '../scheduler/process-execute-task';

/**
 * Runs a task immediately (manual trigger).
 */
export const processRunTaskNow = async (taskId: string) => {
  const task = getMergedTaskForExecution(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  return processExecuteTask({
    task,
    trigger: 'manual',
    skipScheduleWindow: true,
  });
};
