import type { SpawnableWorker } from '../../model/spawnable-worker';
import type { SchedulerLocalFile } from '../../model/worker-local-config';

export type SpawnableWorkerDefaults = {
  defaultPort: number;
  healthPath: string;
  startCommand: string;
};

/**
 * Builds spawn config for a worker project id from scheduler.local.json.
 */
export const buildSpawnableWorker = (
  workerProjectId: string,
  local: SchedulerLocalFile,
  defaults?: SpawnableWorkerDefaults,
): SpawnableWorker | null => {
  const entry = local.workers?.[workerProjectId];
  if (!entry?.expressDir) {
    return null;
  }

  return {
    workerProjectId,
    expressDir: entry.expressDir,
    port: entry.port ?? defaults?.defaultPort ?? 3022,
    nvmSh: entry.nvmSh ?? null,
    healthPath: entry.healthPath ?? defaults?.healthPath ?? '/api/health',
    startCommand: entry.startCommand ?? defaults?.startCommand ?? 'npm start',
  };
};
