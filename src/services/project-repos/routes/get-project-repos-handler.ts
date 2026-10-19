import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processListSchedulerProjectRepos } from '../process-list-scheduler-project-repos';

/**
 * GET /api/project-repos — list all scheduler project repos.
 */
export const getProjectReposHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getProjectReposHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const data = await processListSchedulerProjectRepos(pool);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('❌ [getProjectReposHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
