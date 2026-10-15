/**
 * Health Check Router
 */

import { Router, Request, Response } from 'express';
import { getManagedPgPool } from '../managed';

/**
 * Creates health check router.
 */
export const createHealthRouter = (): Router => {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    const pool = getManagedPgPool();
    res.json({
      status: 'ok',
      message: 'Local Scheduler Express Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: pool ? 'ok' : 'unavailable',
    });
  });

  return router;
};
