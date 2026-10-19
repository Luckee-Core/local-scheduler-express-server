import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processGetSchedulerProject } from '../process-get-scheduler-project';

/**
 * GET /api/projects/:id — one scheduler project.
 */
export const getProjectByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getProjectByIdHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid project id' });
      return;
    }

    const data = await processGetSchedulerProject(pool, id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [getProjectByIdHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
