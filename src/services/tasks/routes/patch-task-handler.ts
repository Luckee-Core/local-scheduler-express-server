import { Request, Response } from 'express';
import { processPatchTask } from '../process-list-tasks';

/**
 * PATCH /api/tasks/:id — update enabled flag in scheduler.local.json.
 */
export const patchTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: 'Invalid task id' });
      return;
    }

    const body = req.body as { enabled?: unknown };
    if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
      res.status(400).json({ success: false, error: 'enabled must be a boolean' });
      return;
    }

    const data = processPatchTask(id, {
      enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
    });

    if (!data) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ PATCH /api/tasks/:id:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
