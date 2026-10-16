import type { Pool } from 'pg';
import type { WorkerRuntimeStatus } from '../../model/worker-runtime';
import { listScheduledTasks } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { processResolveWorkerRuntime } from './process-resolve-worker-runtime';

type WorkerConfigEntry = {
  workerProjectId: string;
  port: number;
  healthPath: string;
  expressDir: string | null;
};

const collectWorkerConfigs = async (pool: Pool): Promise<WorkerConfigEntry[]> => {
  const rows = await listScheduledTasks(pool);
  const local = readSchedulerLocal();
  const byId = new Map<string, WorkerConfigEntry>();

  for (const row of rows) {
    const workerLocal = local.workers?.[row.workerProjectId];
    byId.set(row.workerProjectId, {
      workerProjectId: row.workerProjectId,
      port: workerLocal?.port ?? row.worker.defaultPort,
      healthPath: workerLocal?.healthPath ?? row.worker.healthPath,
      expressDir: workerLocal?.expressDir ?? null,
    });
  }

  if (local.workers) {
    for (const [workerProjectId, workerLocal] of Object.entries(local.workers)) {
      if (!byId.has(workerProjectId)) {
        byId.set(workerProjectId, {
          workerProjectId,
          port: workerLocal.port ?? 3022,
          healthPath: workerLocal.healthPath ?? '/api/health',
          expressDir: workerLocal.expressDir ?? null,
        });
      }
    }
  }

  return Array.from(byId.values());
};

/**
 * Lists runtime status for all known workers.
 */
export const processListWorkers = async (pool: Pool): Promise<WorkerRuntimeStatus[]> => {
  const configs = await collectWorkerConfigs(pool);
  return configs.map((config) =>
    processResolveWorkerRuntime({
      workerProjectId: config.workerProjectId,
      port: config.port,
      healthPath: config.healthPath,
      expressDir: config.expressDir,
    }),
  );
};
