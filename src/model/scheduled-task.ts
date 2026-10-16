/**
 * Scheduled task domain types (aligned with local-scheduler-web).
 */

export type IntervalTaskSchedule = {
  kind: 'interval';
  intervalMinutes: number;
  timezone: string;
  weekdays: number[];
  hourStart: number;
  hourEnd: number;
};

export type DailyTaskSchedule = {
  kind: 'daily';
  hour: number;
  minute: number;
  timezone: string;
  weekdays: number[];
};

export type TaskSchedule = IntervalTaskSchedule | DailyTaskSchedule;

export type TaskWorker = {
  expressRepoName: string;
  defaultPort: number;
  healthPath: string;
  startCommand: string;
};

export type TaskRequest = {
  method: string;
  path: string;
  authEnvKey?: string;
};

export type ScheduledTaskLifecycle = 'start_if_needed_stop_if_started';

export type ScheduledTaskRow = {
  id: string;
  name: string;
  workerProjectId: string;
  enabled: boolean;
  worker: TaskWorker;
  request: TaskRequest;
  schedule: TaskSchedule;
  lifecycle: ScheduledTaskLifecycle;
  createdAt: string;
  updatedAt: string;
};

export type CreateScheduledTaskInput = {
  id: string;
  name: string;
  workerProjectId: string;
  enabled?: boolean;
  worker: TaskWorker;
  request: TaskRequest;
  schedule: TaskSchedule;
  lifecycle?: ScheduledTaskLifecycle;
};

export type UpdateScheduledTaskInput = {
  name?: string;
  workerProjectId?: string;
  enabled?: boolean;
  worker?: TaskWorker;
  request?: TaskRequest;
  schedule?: TaskSchedule;
  lifecycle?: ScheduledTaskLifecycle;
};

/** API list/detail shape with machine paths and run metadata. */
export type MergedScheduledTask = {
  id: string;
  name: string;
  workerProjectId: string;
  worker: TaskWorker;
  request: TaskRequest;
  schedule: TaskSchedule;
  lifecycle: ScheduledTaskLifecycle;
  enabled: boolean;
  expressDir: string | null;
  port: number;
  nvmSh: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
};
