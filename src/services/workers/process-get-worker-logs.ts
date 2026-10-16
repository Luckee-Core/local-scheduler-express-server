import type { Pool } from 'pg';
import { readWorkerLogTail } from '../../utils/worker/read-worker-log-tail';
import { processGetWorker } from './process-get-worker';

export type WorkerLogsResult = {
  workerProjectId: string;
  logPath: string;
  content: string;
  lineCount: number;
};

/**
 * Returns tail of worker log file.
 */
export const processGetWorkerLogs = async (
  pool: Pool,
  workerProjectId: string,
  lines: number,
): Promise<WorkerLogsResult | null> => {
  const worker = await processGetWorker(pool, workerProjectId);
  if (!worker) {
    return null;
  }

  const safeLines = Number.isFinite(lines) && lines > 0 ? Math.min(Math.floor(lines), 500) : 200;
  const content = readWorkerLogTail(worker.logPath, safeLines);

  return {
    workerProjectId,
    logPath: worker.logPath,
    content,
    lineCount: safeLines,
  };
};
