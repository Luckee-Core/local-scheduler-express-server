import { readSchedulerLocal } from '../../data/worker-local-config';
import type { MergedScheduledTask } from '../../model/scheduled-task';
import { buildSpawnableWorker } from '../../utils/worker/build-spawnable-worker';
import type { EnsureWorkerReadyOptions, EnsureWorkerReadyResult } from './spawn-worker';
import { ensureWorkerReady } from './spawn-worker';

export type EnsureTaskWorkersReadyResult = EnsureWorkerReadyResult & {
  /** Workers started by scheduler this run, in start order (deps first). */
  startedWorkerProjectIds: string[];
};

/**
 * Ensures dependency workers then the task's primary worker are healthy.
 */
export const ensureTaskWorkersReady = async (
  task: MergedScheduledTask,
  options?: EnsureWorkerReadyOptions,
): Promise<EnsureTaskWorkersReadyResult> => {
  const local = readSchedulerLocal();
  const dependsOn = local.workers?.[task.workerProjectId]?.dependsOn ?? [];
  const startedWorkerProjectIds: string[] = [];

  for (const depId of dependsOn) {
    const dep = buildSpawnableWorker(depId, local);
    if (!dep) {
      throw new Error(
        `Dependency worker ${depId} is not configured in scheduler.local.json (required by ${task.workerProjectId})`,
      );
    }
    console.log(`🔗 [ensureTaskWorkersReady] Ensuring dependency ${depId} for task ${task.id}`);
    const depReady = await ensureWorkerReady(dep, options);
    if (depReady.startedByScheduler) {
      startedWorkerProjectIds.push(depId);
    }
  }

  const primary = buildSpawnableWorker(task.workerProjectId, local, {
    defaultPort: task.worker.defaultPort,
    healthPath: task.worker.healthPath,
    startCommand: task.worker.startCommand,
  });

  if (!primary) {
    throw new Error(
      `Worker ${task.workerProjectId} has no expressDir in scheduler.local.json`,
    );
  }

  const ready = await ensureWorkerReady(primary, options);
  if (ready.startedByScheduler) {
    startedWorkerProjectIds.push(task.workerProjectId);
  }

  return {
    ...ready,
    startedWorkerProjectIds,
  };
};
