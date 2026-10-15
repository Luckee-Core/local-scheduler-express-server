/**
 * Machine-local worker paths (scheduler.local.json — workers only).
 */

export type SchedulerLocalWorker = {
  expressDir?: string;
  port?: number;
  nvmSh?: string;
};

export type SchedulerLocalFile = {
  workers?: Record<string, SchedulerLocalWorker>;
};
