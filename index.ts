import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4120;

import { setupEarlyMiddleware } from './src/services/middleware';
setupEarlyMiddleware(app);

import { createHealthRouter } from './src/services/health';
app.use('/', createHealthRouter());
app.use('/api/health', createHealthRouter());

import { createTasksRouter } from './src/services/tasks';
app.use('/api/tasks', createTasksRouter());

import { createRunsRouter } from './src/services/runs';
app.use('/api/runs', createRunsRouter());

import { setupErrorHandling } from './src/services/middleware';
setupErrorHandling(app);

import { startServer } from './src/services/server';
import { initializeScheduler } from './src/services/scheduler';

startServer(app, {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
  onListen: () => {
    initializeScheduler();
  },
});

export default app;
