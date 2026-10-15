import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processGetRun } from '../process-list-runs';

/**
 * GET /api/runs/:id — one run record.
 */
export const getRunByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getRunByIdHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid run id' });
      return;
    }

    const data = await processGetRun(pool, id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Run not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [getRunByIdHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
