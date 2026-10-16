import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processListWorkers } from '../process-list-workers';

/**
 * GET /api/workers — list worker runtime status.
 */
export const getWorkersHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getWorkersHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const data = await processListWorkers(pool);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('❌ [getWorkersHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
