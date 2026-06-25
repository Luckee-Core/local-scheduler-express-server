import { Request, Response } from 'express';
import { processRunTaskNow } from '../process-run-task-now';

/**
 * POST /api/tasks/:id/run-now — execute task immediately.
 */
export const postRunTaskNowHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid task id' });
      return;
    }

    const data = await processRunTaskNow(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ POST /api/tasks/:id/run-now:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Task not found' ? 404 : 500;
    res.status(status).json({ success: false, error: message });
  }
};
