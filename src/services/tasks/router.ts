import { Router } from 'express';
import { deleteTaskHandler } from './routes/delete-task-handler';
import { getTaskByIdHandler } from './routes/get-task-by-id-handler';
import { getTasksHandler } from './routes/get-tasks-handler';
import { patchTaskHandler } from './routes/patch-task-handler';
import { postRunTaskNowHandler } from './routes/post-run-task-now-handler';
import { postTasksHandler } from './routes/post-tasks-handler';

/**
 * Creates the tasks API router.
 */
export const createTasksRouter = (): Router => {
  const router = Router();

  router.get('/', getTasksHandler);
  router.post('/', postTasksHandler);
  router.get('/:id', getTaskByIdHandler);
  router.patch('/:id', patchTaskHandler);
  router.delete('/:id', deleteTaskHandler);
  router.post('/:id/run-now', postRunTaskNowHandler);

  return router;
};
