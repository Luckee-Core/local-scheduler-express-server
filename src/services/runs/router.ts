import { Router } from 'express';
import { getRunsHandler } from './routes/get-runs-handler';
import { getRunByIdHandler } from './routes/get-run-by-id-handler';

/**
 * Creates the runs API router.
 */
export const createRunsRouter = (): Router => {
  const router = Router();
  router.get('/', getRunsHandler);
  router.get('/:id', getRunByIdHandler);
  return router;
};
