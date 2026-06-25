import { Request, Response } from 'express';
import { processGetRun } from '../process-list-runs';

/**
 * GET /api/runs/:id — one run record.
 */
export const getRunByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid run id' });
      return;
    }

    const data = processGetRun(id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Run not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ GET /api/runs/:id:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
