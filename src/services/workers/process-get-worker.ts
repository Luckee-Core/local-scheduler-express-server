import type { Pool } from 'pg';
import type { WorkerRuntimeStatus } from '../../model/worker-runtime';
import { processListWorkers } from './process-list-workers';

/**
 * Returns one worker runtime status by project id.
 */
export const processGetWorker = async (
  pool: Pool,
  workerProjectId: string,
): Promise<WorkerRuntimeStatus | null> => {
  const workers = await processListWorkers(pool);
  return workers.find((worker) => worker.workerProjectId === workerProjectId) ?? null;
};
