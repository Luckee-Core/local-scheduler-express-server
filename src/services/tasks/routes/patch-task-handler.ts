import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processUpdateScheduledTask } from '../process-update-scheduled-task';
import { validateUpdateScheduledTaskBody } from '../utils/validate-update-scheduled-task-body';

/**
 * PATCH /api/tasks/:id — update scheduled task fields.
 */
export const patchTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [patchTaskHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid task id' });
      return;
    }

    const validation = validateUpdateScheduledTaskBody(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const data = await processUpdateScheduledTask(pool, id, validation.data);
    if (!data) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [patchTaskHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
