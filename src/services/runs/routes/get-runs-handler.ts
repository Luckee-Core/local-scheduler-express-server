import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processListRuns } from '../process-list-runs';

/**
 * GET /api/runs — list run history.
 */
export const getRunsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getRunsHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const rawLimit = req.query.limit;
    const limit =
      typeof rawLimit === 'string' ? Number.parseInt(rawLimit, 10) : Number(rawLimit);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 100;
    const data = await processListRuns(pool, safeLimit);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('❌ [getRunsHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
