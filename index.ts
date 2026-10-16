import express from 'express';
import dotenv from 'dotenv';
import { setupEarlyMiddleware, setupErrorHandling } from './src/services/middleware';
import { createHealthRouter } from './src/services/health';
import { createTasksRouter } from './src/services/tasks';
import { createRunsRouter } from './src/services/runs';
import { createWorkersRouter } from './src/services/workers';
import { startServer } from './src/services/server';
import { initializeScheduler } from './src/services/scheduler';
import { getManagedPgPool, initializePgPool } from './src/services/managed';

dotenv.config();

const PORT = Number(process.env.PORT) || 3022;

const bootstrap = async (): Promise<void> => {
  await initializePgPool();

  const app = express();
  setupEarlyMiddleware(app);

  app.use('/api/health', createHealthRouter());
  app.use('/api/tasks', createTasksRouter());
  app.use('/api/runs', createRunsRouter());
  app.use('/api/workers', createWorkersRouter());

  setupErrorHandling(app);

  startServer(app, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    onListen: () => {
      const pool = getManagedPgPool();
      if (pool) {
        void initializeScheduler(pool);
      } else {
        console.error('❌ Scheduler not started — DATABASE_URL / pool unavailable');
      }
    },
  });
};

bootstrap().catch((error) => {
  console.error('❌ Failed during startup', error);
  process.exit(1);
});
