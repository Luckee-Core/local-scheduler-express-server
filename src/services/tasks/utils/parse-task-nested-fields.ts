import type { TaskRequest, TaskSchedule, TaskWorker } from '../../../model/scheduled-task';

type ParseResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Parses worker JSON from create/update bodies.
 */
export const parseTaskWorker = (worker: unknown): ParseResult<TaskWorker> => {
  if (!worker || typeof worker !== 'object') {
    return { success: false, error: 'worker must be an object' };
  }
  const workerRec = worker as Record<string, unknown>;
  if (typeof workerRec.expressRepoName !== 'string') {
    return { success: false, error: 'worker.expressRepoName is required' };
  }
  if (typeof workerRec.defaultPort !== 'number') {
    return { success: false, error: 'worker.defaultPort is required' };
  }
  if (typeof workerRec.healthPath !== 'string' || !workerRec.healthPath.startsWith('/')) {
    return { success: false, error: 'worker.healthPath must start with /' };
  }
  if (typeof workerRec.startCommand !== 'string') {
    return { success: false, error: 'worker.startCommand is required' };
  }
  return {
    success: true,
    data: {
      expressRepoName: workerRec.expressRepoName,
      defaultPort: workerRec.defaultPort,
      healthPath: workerRec.healthPath,
      startCommand: workerRec.startCommand,
    },
  };
};

/**
 * Parses request JSON from create/update bodies.
 */
export const parseTaskRequest = (request: unknown): ParseResult<TaskRequest> => {
  if (!request || typeof request !== 'object') {
    return { success: false, error: 'request must be an object' };
  }
  const requestRec = request as Record<string, unknown>;
  const method = requestRec.method;
  if (method !== 'GET' && method !== 'POST') {
    return { success: false, error: 'request.method must be GET or POST' };
  }
  if (typeof requestRec.path !== 'string' || !requestRec.path.startsWith('/')) {
    return { success: false, error: 'request.path must start with /' };
  }
  return {
    success: true,
    data: {
      method,
      path: requestRec.path,
      authEnvKey:
        typeof requestRec.authEnvKey === 'string' ? requestRec.authEnvKey : undefined,
    },
  };
};

/**
 * Parses schedule JSON from create/update bodies.
 */
export const parseTaskSchedule = (schedule: unknown): ParseResult<TaskSchedule> => {
  if (!schedule || typeof schedule !== 'object') {
    return { success: false, error: 'schedule must be an object' };
  }
  const scheduleRec = schedule as Record<string, unknown>;
  const intervalMinutes = scheduleRec.intervalMinutes;
  if (typeof intervalMinutes !== 'number' || intervalMinutes < 1 || intervalMinutes > 1440) {
    return { success: false, error: 'schedule.intervalMinutes must be between 1 and 1440' };
  }
  const hourStart = typeof scheduleRec.hourStart === 'number' ? scheduleRec.hourStart : 8;
  const hourEnd = typeof scheduleRec.hourEnd === 'number' ? scheduleRec.hourEnd : 17;
  if (hourStart < 0 || hourStart > 23 || hourEnd < 0 || hourEnd > 23) {
    return { success: false, error: 'schedule hourStart and hourEnd must be 0–23' };
  }
  const weekdays = Array.isArray(scheduleRec.weekdays)
    ? scheduleRec.weekdays.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6)
    : [1, 2, 3, 4, 5];
  if (weekdays.length === 0) {
    return { success: false, error: 'schedule.weekdays must include at least one day' };
  }
  return {
    success: true,
    data: {
      kind: 'interval',
      intervalMinutes,
      timezone:
        typeof scheduleRec.timezone === 'string' ? scheduleRec.timezone : 'America/New_York',
      weekdays,
      hourStart,
      hourEnd,
    },
  };
};
