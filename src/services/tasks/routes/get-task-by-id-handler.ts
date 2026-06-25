import { Request, Response } from 'express';
import { processGetTask } from '../process-list-tasks';

/**
 * GET /api/tasks/:id — one merged task.
 */
export const getTaskByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid task id' });
      return;
    }

    const data = processGetTask(id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ GET /api/tasks/:id:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
