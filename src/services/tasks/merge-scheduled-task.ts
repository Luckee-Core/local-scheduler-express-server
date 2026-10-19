import type { MergedScheduledTask, ScheduledTaskRow } from '../../model/scheduled-task';
import type { SchedulerProjectRow } from '../../model/scheduler-project';
import type { SchedulerProjectRepoRow } from '../../model/scheduler-project-repo';
import type { SchedulerLocalFile } from '../../model/worker-local-config';
import { computeNextRunAt } from '../../utils/schedule/compute-next-run-at';
import { formatExecutionTarget } from '../../utils/scheduler/format-execution-target';
import { toMergedSchedulerProject } from '../../utils/scheduler/to-merged-scheduler-project';
import { toMergedSchedulerProjectRepo } from '../../utils/scheduler/to-merged-scheduler-project-repo';

/**
 * Merges a DB task row with local worker paths, repo, business, and optional last-run metadata.
 */
export const mergeScheduledTaskRow = (
  row: ScheduledTaskRow,
  local: SchedulerLocalFile,
  repo: SchedulerProjectRepoRow,
  project: SchedulerProjectRow,
  lastRunAt: string | null,
  lastRunStatus: string | null,
): MergedScheduledTask => {
  const workerLocal = local.workers?.[repo.id];
  const port = workerLocal?.port ?? repo.defaultPort ?? row.worker.defaultPort;

  return {
    id: row.id,
    name: row.name,
    workerProjectId: row.workerProjectId,
    schedulerProjectRepoId: row.schedulerProjectRepoId,
    schedulerProject: toMergedSchedulerProject(project),
    schedulerProjectRepo: toMergedSchedulerProjectRepo(repo),
    executionTarget: formatExecutionTarget(repo, port),
    worker: row.worker,
    request: row.request,
    schedule: row.schedule,
    lifecycle: row.lifecycle,
    enabled: row.enabled,
    expressDir: workerLocal?.expressDir ?? null,
    port,
    nvmSh: workerLocal?.nvmSh ?? null,
    nextRunAt: row.enabled ? computeNextRunAt(row.schedule) : null,
    lastRunAt,
    lastRunStatus,
  };
};
