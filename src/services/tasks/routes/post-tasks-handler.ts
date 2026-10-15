import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processCreateScheduledTask } from '../process-create-scheduled-task';
import { validateCreateScheduledTaskBody } from '../utils/validate-create-scheduled-task-body';

/**
 * POST /api/tasks — create (or upsert) a scheduled task.
 */
export const postTasksHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [postTasksHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const validation = validateCreateScheduledTaskBody(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const upsert = req.query.upsert === 'true';
    const data = await processCreateScheduledTask(pool, validation.data, upsert);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [postTasksHandler]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Task already exists' ? 409 : 500;
    res.status(status).json({ success: false, error: message });
  }
};
