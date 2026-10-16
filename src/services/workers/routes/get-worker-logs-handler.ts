import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processGetWorkerLogs } from '../process-get-worker-logs';

/**
 * GET /api/workers/:workerProjectId/logs — tail worker log file.
 */
export const getWorkerLogsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getWorkerLogsHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const workerProjectId = req.params.workerProjectId;
    if (!workerProjectId || Array.isArray(workerProjectId)) {
      res.status(400).json({ success: false, error: 'Invalid worker id' });
      return;
    }

    const rawLines = req.query.lines;
    const lines =
      typeof rawLines === 'string' ? Number.parseInt(rawLines, 10) : Number(rawLines);

    const data = await processGetWorkerLogs(pool, workerProjectId, lines);
    if (!data) {
      res.status(404).json({ success: false, error: 'Worker not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [getWorkerLogsHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
