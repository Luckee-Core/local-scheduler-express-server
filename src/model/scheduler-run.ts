/**
 * Scheduler run domain types.
 */

export type SchedulerRunStatus = 'success' | 'failed' | 'skipped';

export type SchedulerRunTrigger = 'scheduled' | 'manual';

export type SchedulerRun = {
  id: string;
  taskId: string;
  taskName: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: SchedulerRunStatus;
  httpStatus: number | null;
  error: string | null;
  responseSummary: string | null;
  trigger: SchedulerRunTrigger;
};

export type AppendSchedulerRunInput = Omit<SchedulerRun, 'id'> & { id?: string };
