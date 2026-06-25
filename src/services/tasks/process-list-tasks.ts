import {
  getLatestRunForTask,
  listRuns as listAllRuns,
} from '../../data/scheduler-run';
import {
  mergeTaskEntry,
  readSchedulerLocal,
  readTaskRegistry,
  writeSchedulerLocal,
} from '../../data/task-registry';
import type { MergedTask } from '../../data/task-registry/types';

/**
 * Loads all merged tasks with last-run metadata.
 */
export const processListTasks = (): MergedTask[] => {
  const registry = readTaskRegistry();
  const local = readSchedulerLocal();

  return registry.tasks.map((entry) => {
    const latest = getLatestRunForTask(entry.id);
    return mergeTaskEntry(
      entry,
      local,
      latest?.finishedAt ?? null,
      latest?.status ?? null,
    );
  });
};

/**
 * Returns one merged task by id.
 */
export const processGetTask = (taskId: string): MergedTask | null => {
  const tasks = processListTasks();
  return tasks.find((task) => task.id === taskId) ?? null;
};

export type PatchTaskInput = {
  enabled?: boolean;
};

/**
 * Updates task overrides in scheduler.local.json.
 */
export const processPatchTask = (taskId: string, input: PatchTaskInput): MergedTask | null => {
  const registry = readTaskRegistry();
  const entry = registry.tasks.find((task) => task.id === taskId);
  if (!entry) {
    return null;
  }

  const local = readSchedulerLocal();
  const tasks = { ...(local.tasks ?? {}) };
  const current = { ...(tasks[taskId] ?? {}) };

  if (input.enabled !== undefined) {
    current.enabled = input.enabled;
  }

  tasks[taskId] = current;
  writeSchedulerLocal({ ...local, tasks });

  const latest = getLatestRunForTask(taskId);
  return mergeTaskEntry(
    entry,
    { ...local, tasks },
    latest?.finishedAt ?? null,
    latest?.status ?? null,
  );
};

/**
 * Finds merged task for execution.
 */
export const getMergedTaskForExecution = (taskId: string): MergedTask | null =>
  processGetTask(taskId);
