import { Request, Response } from 'express';
import { processListTasks } from '../process-list-tasks';

/**
 * GET /api/tasks — list merged scheduled tasks.
 */
export const getTasksHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = processListTasks();
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('❌ GET /api/tasks:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
