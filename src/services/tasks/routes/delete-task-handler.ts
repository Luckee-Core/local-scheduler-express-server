import { Request, Response } from 'express';
import { getManagedPgPool } from '../../managed';
import { processDeleteScheduledTask } from '../process-delete-scheduled-task';

/**
 * DELETE /api/tasks/:id — remove a scheduled task.
 */
export const deleteTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = getManagedPgPool();
    if (!pool) {
      console.error('❌ [deleteTaskHandler] Postgres pool unavailable');
      res.status(500).json({ success: false, error: 'Service unavailable' });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid task id' });
      return;
    }

    const deleted = await processDeleteScheduledTask(pool, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    console.error('❌ [deleteTaskHandler]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
