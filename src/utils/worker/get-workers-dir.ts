/**
 * Directory for worker PID files, logs, and manifests.
 */
export const getWorkersDir = (): string =>
  process.env.SCHEDULER_WORKERS_DIR?.trim() || '/tmp/local-scheduler/workers';
