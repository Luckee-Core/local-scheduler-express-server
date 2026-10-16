import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processGetWorker } from '../process-get-worker';

/**
 * GET /api/workers/:workerProjectId — worker runtime status.
 */
export const getWorkerByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getWorkerByIdHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const workerProjectId = req.params.workerProjectId;
    if (!workerProjectId || Array.isArray(workerProjectId)) {
      res.status(400).json({ success: false, error: 'Invalid worker id' });
      return;
    }

    const data = await processGetWorker(pool, workerProjectId);
    if (!data) {
      res.status(404).json({ success: false, error: 'Worker not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [getWorkerByIdHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
