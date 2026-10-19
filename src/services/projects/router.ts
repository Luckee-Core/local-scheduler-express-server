import { Router } from 'express';
import { getProjectByIdHandler } from './routes/get-project-by-id-handler';
import { getProjectReposHandler } from './routes/get-project-repos-handler';
import { getProjectsHandler } from './routes/get-projects-handler';

/**
 * Creates the scheduler projects API router.
 */
export const createProjectsRouter = (): Router => {
  const router = Router();

  router.get('/', getProjectsHandler);
  router.get('/:id/repos', getProjectReposHandler);
  router.get('/:id', getProjectByIdHandler);

  return router;
};
