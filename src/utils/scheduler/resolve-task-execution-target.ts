import type { MergedScheduledTask } from '../../model/scheduled-task';
import type { SchedulerProjectRepoRow } from '../../model/scheduler-project-repo';
import type { SchedulerLocalFile } from '../../model/worker-local-config';
import { buildSpawnableWorker } from '../worker/build-spawnable-worker';

export type TaskExecutionTarget = {
  baseUrl: string;
  healthUrl: string;
  skipWorkerLifecycle: boolean;
};

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/**
 * Resolves HTTP base URL and whether local worker spawn is required.
 */
export const resolveTaskExecutionTarget = (
  task: MergedScheduledTask,
  repo: SchedulerProjectRepoRow,
  local: SchedulerLocalFile,
): TaskExecutionTarget => {
  if (repo.executionType === 'production') {
    if (!repo.productionBaseUrl) {
      throw new Error(`Scheduler repo ${repo.id} is production but has no productionBaseUrl`);
    }
    const baseUrl = trimTrailingSlash(repo.productionBaseUrl);
    const healthPath = repo.healthPath.startsWith('/')
      ? repo.healthPath
      : `/${repo.healthPath}`;
    return {
      baseUrl,
      healthUrl: `${baseUrl}${healthPath}`,
      skipWorkerLifecycle: true,
    };
  }

  const spawnable = buildSpawnableWorker(repo.id, local, {
    defaultPort: repo.defaultPort ?? task.worker.defaultPort,
    healthPath: task.worker.healthPath,
    startCommand: task.worker.startCommand,
  });

  if (!spawnable) {
    throw new Error(`Worker ${repo.id} has no expressDir in scheduler.local.json`);
  }

  const baseUrl = `http://127.0.0.1:${spawnable.port}`;
  const healthPath = spawnable.healthPath.startsWith('/')
    ? spawnable.healthPath
    : `/${spawnable.healthPath}`;

  return {
    baseUrl,
    healthUrl: `${baseUrl}${healthPath}`,
    skipWorkerLifecycle: false,
  };
};
