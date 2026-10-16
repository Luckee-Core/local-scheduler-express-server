/**
 * Machine-local worker paths (scheduler.local.json — workers only).
 */

export type SchedulerLocalWorker = {
  expressDir?: string;
  port?: number;
  nvmSh?: string;
  healthPath?: string;
  startCommand?: string;
  /** Worker project ids to start (and stop if spawned) before this worker. */
  dependsOn?: string[];
};

export type SchedulerLocalFile = {
  workers?: Record<string, SchedulerLocalWorker>;
};
