import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processListScheduledTasks } from '../process-list-scheduled-tasks';

/**
 * GET /api/tasks — list merged scheduled tasks.
 */
export const getTasksHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getTasksHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const data = await processListScheduledTasks(pool);
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('❌ [getTasksHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
