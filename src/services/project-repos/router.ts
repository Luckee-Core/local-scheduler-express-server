import { Router } from 'express';
import { getProjectRepoByIdHandler } from './routes/get-project-repo-by-id-handler';
import { getProjectReposHandler } from './routes/get-project-repos-handler';

/**
 * Creates the scheduler project repos API router.
 */
export const createProjectReposRouter = (): Router => {
  const router = Router();

  router.get('/', getProjectReposHandler);
  router.get('/:id', getProjectRepoByIdHandler);

  return router;
};
