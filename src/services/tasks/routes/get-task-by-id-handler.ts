import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processGetScheduledTask } from '../process-get-scheduled-task';

/**
 * GET /api/tasks/:id — one merged task.
 */
export const getTaskByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [getTaskByIdHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid task id' });
      return;
    }

    const data = await processGetScheduledTask(pool, id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [getTaskByIdHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
