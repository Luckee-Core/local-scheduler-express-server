import { Router, Request, Response } from 'express';
import { getTasksHandler } from './routes/get-tasks-handler';
import { getTaskByIdHandler } from './routes/get-task-by-id-handler';
import { patchTaskHandler } from './routes/patch-task-handler';
import { postRunTaskNowHandler } from './routes/post-run-task-now-handler';

/**
 * Creates the tasks API router.
 */
export const createTasksRouter = (): Router => {
  const router = Router();

  router.get('/', getTasksHandler);
  router.get('/:id', getTaskByIdHandler);
  router.patch('/:id', patchTaskHandler);
  router.post('/:id/run-now', postRunTaskNowHandler);

  return router;
};
