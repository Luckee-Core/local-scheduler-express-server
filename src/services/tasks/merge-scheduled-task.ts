import type { MergedScheduledTask, ScheduledTaskRow } from '../../model/scheduled-task';
import type { SchedulerLocalFile } from '../../model/worker-local-config';
import { computeNextRunAt } from '../../utils/schedule/compute-next-run-at';

/**
 * Merges a DB task row with local worker paths and optional last-run metadata.
 */
export const mergeScheduledTaskRow = (
  row: ScheduledTaskRow,
  local: SchedulerLocalFile,
  lastRunAt: string | null,
  lastRunStatus: string | null,
): MergedScheduledTask => {
  const workerLocal = local.workers?.[row.workerProjectId];

  return {
    id: row.id,
    name: row.name,
    workerProjectId: row.workerProjectId,
    worker: row.worker,
    request: row.request,
    schedule: row.schedule,
    lifecycle: row.lifecycle,
    enabled: row.enabled,
    expressDir: workerLocal?.expressDir ?? null,
    port: workerLocal?.port ?? row.worker.defaultPort,
    nvmSh: workerLocal?.nvmSh ?? null,
    nextRunAt: row.enabled ? computeNextRunAt(row.schedule) : null,
    lastRunAt,
    lastRunStatus,
  };
};
