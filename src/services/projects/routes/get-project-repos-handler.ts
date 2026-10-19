import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processListSchedulerProjectReposByProjectId } from '../process-list-scheduler-project-repos-by-project-id';

/**
 * GET /api/projects/:id/repos — repos for one business.
 */
export const getProjectReposHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getProjectReposHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid project id' });
      return;
    }

    const data = await processListSchedulerProjectReposByProjectId(pool, id);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('❌ [getProjectReposHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
