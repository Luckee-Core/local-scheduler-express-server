import { Router } from 'express';
import { getWorkerByIdHandler } from './routes/get-worker-by-id-handler';
import { getWorkerLogsHandler } from './routes/get-worker-logs-handler';
import { getWorkersHandler } from './routes/get-workers-handler';

/**
 * Creates the workers API router.
 */
export const createWorkersRouter = (): Router => {
  const router = Router();
  router.get('/', getWorkersHandler);
  router.get('/:workerProjectId/logs', getWorkerLogsHandler);
  router.get('/:workerProjectId', getWorkerByIdHandler);
  return router;
};
