import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processGetSchedulerProjectRepo } from '../process-get-scheduler-project-repo';

/**
 * GET /api/project-repos/:id — one scheduler project repo.
 */
export const getProjectRepoByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getProjectRepoByIdHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid repo id' });
      return;
    }

    const data = await processGetSchedulerProjectRepo(pool, id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Repo not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [getProjectRepoByIdHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
