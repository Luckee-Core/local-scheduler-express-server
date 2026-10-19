import type { Pool } from 'pg';
import type { MergedScheduledTask, UpdateScheduledTaskInput } from '../../model/scheduled-task';
import { getSchedulerProjectById } from '../../data/scheduler_project';
import { getSchedulerProjectRepoById } from '../../data/scheduler_project_repo';
import { getLatestSchedulerRunForTask } from '../../data/scheduler_runs';
import { getScheduledTaskById, updateScheduledTask } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { registerTaskJobs } from '../scheduler/initialize-scheduler';
import { mergeScheduledTaskRow } from './merge-scheduled-task';
import { validateTaskLifecycleForRepo } from './utils/validate-task-lifecycle-for-repo';

/**
 * Updates a scheduled task and refreshes cron jobs.
 */
export const processUpdateScheduledTask = async (
  pool: Pool,
  taskId: string,
  input: UpdateScheduledTaskInput,
): Promise<MergedScheduledTask | null> => {
  const existing = await getScheduledTaskById(pool, taskId);
  if (!existing) {
    return null;
  }

  const schedulerProjectRepoId = input.schedulerProjectRepoId ?? existing.schedulerProjectRepoId;
  const lifecycle = input.lifecycle ?? existing.lifecycle;
  const repo = await getSchedulerProjectRepoById(pool, schedulerProjectRepoId);
  if (!repo) {
    throw new Error(`Scheduler project repo not found: ${schedulerProjectRepoId}`);
  }

  const project = await getSchedulerProjectById(pool, repo.schedulerProjectId);
  if (!project) {
    throw new Error(`Scheduler project not found: ${repo.schedulerProjectId}`);
  }

  const lifecycleError = validateTaskLifecycleForRepo(repo, lifecycle);
  if (lifecycleError) {
    throw new Error(lifecycleError);
  }

  const patch: UpdateScheduledTaskInput = {
    ...input,
    schedulerProjectRepoId,
    workerProjectId: input.workerProjectId ?? schedulerProjectRepoId,
    lifecycle,
  };

  const row = await updateScheduledTask(pool, taskId, patch);
  if (!row) {
    return null;
  }
  await registerTaskJobs(pool);
  const local = readSchedulerLocal();
  const latest = await getLatestSchedulerRunForTask(pool, taskId);
  return mergeScheduledTaskRow(
    row,
    local,
    repo,
    project,
    latest?.finishedAt ?? null,
    latest?.status ?? null,
  );
};
