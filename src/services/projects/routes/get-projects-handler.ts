import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processListSchedulerProjects } from '../process-list-scheduler-projects';

/**
 * GET /api/projects — list scheduler projects.
 */
export const getProjectsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getProjectsHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const data = await processListSchedulerProjects(pool);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('❌ [getProjectsHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
