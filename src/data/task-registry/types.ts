/**
 * Task registry and merged task types.
 */

export type TaskSchedule = {
  kind: 'interval';
  intervalMinutes: number;
  timezone: string;
  weekdays: number[];
  hourStart: number;
  hourEnd: number;
};

export type TaskRegistryEntry = {
  id: string;
  name: string;
  workerProjectId: string;
  worker: {
    expressRepoName: string;
    defaultPort: number;
    healthPath: string;
    startCommand: string;
  };
  request: {
    method: string;
    path: string;
    authEnvKey?: string;
  };
  schedule: TaskSchedule;
  lifecycle: 'start_if_needed_stop_if_started';
  enabledByDefault: boolean;
};

export type TaskRegistryFile = {
  tasks: TaskRegistryEntry[];
};

export type SchedulerLocalWorker = {
  expressDir?: string;
  port?: number;
  nvmSh?: string;
};

export type SchedulerLocalTaskOverride = {
  enabled?: boolean;
};

export type SchedulerLocalFile = {
  workers?: Record<string, SchedulerLocalWorker>;
  tasks?: Record<string, SchedulerLocalTaskOverride>;
};

export type MergedTask = TaskRegistryEntry & {
  enabled: boolean;
  expressDir: string | null;
  port: number;
  nvmSh: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
};
