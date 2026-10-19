import type { Pool } from 'pg';
import type { CreateScheduledTaskInput, MergedScheduledTask } from '../../model/scheduled-task';
import { getSchedulerProjectById } from '../../data/scheduler_project';
import { getSchedulerProjectRepoById } from '../../data/scheduler_project_repo';
import { getScheduledTaskById, insertScheduledTask } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { registerTaskJobs } from '../scheduler/initialize-scheduler';
import { mergeScheduledTaskRow } from './merge-scheduled-task';
import { processUpdateScheduledTask } from './process-update-scheduled-task';
import { validateTaskLifecycleForRepo } from './utils/validate-task-lifecycle-for-repo';

/**
 * Creates a scheduled task and refreshes cron jobs.
 */
export const processCreateScheduledTask = async (
  pool: Pool,
  input: CreateScheduledTaskInput,
  upsert: boolean,
): Promise<MergedScheduledTask> => {
  const schedulerProjectRepoId = input.schedulerProjectRepoId ?? input.workerProjectId;
  const repo = await getSchedulerProjectRepoById(pool, schedulerProjectRepoId);
  if (!repo) {
    throw new Error(`Scheduler project repo not found: ${schedulerProjectRepoId}`);
  }

  const project = await getSchedulerProjectById(pool, repo.schedulerProjectId);
  if (!project) {
    throw new Error(`Scheduler project not found: ${repo.schedulerProjectId}`);
  }

  const lifecycle = input.lifecycle ?? 'start_if_needed_stop_if_started';
  const lifecycleError = validateTaskLifecycleForRepo(repo, lifecycle);
  if (lifecycleError) {
    throw new Error(lifecycleError);
  }

  const normalizedInput: CreateScheduledTaskInput = {
    ...input,
    workerProjectId: schedulerProjectRepoId,
    schedulerProjectRepoId,
    lifecycle,
  };

  const existing = await getScheduledTaskById(pool, input.id);
  if (existing && !upsert) {
    throw new Error('Task already exists');
  }

  if (existing && upsert) {
    const updated = await processUpdateScheduledTask(pool, input.id, {
      name: normalizedInput.name,
      workerProjectId: normalizedInput.workerProjectId,
      schedulerProjectRepoId: normalizedInput.schedulerProjectRepoId,
      enabled: normalizedInput.enabled,
      worker: normalizedInput.worker,
      request: normalizedInput.request,
      schedule: normalizedInput.schedule,
      lifecycle: normalizedInput.lifecycle,
    });
    if (!updated) {
      throw new Error('Task not found');
    }
    return updated;
  }

  const row = await insertScheduledTask(pool, normalizedInput);
  await registerTaskJobs(pool);
  const local = readSchedulerLocal();
  return mergeScheduledTaskRow(row, local, repo, project, null, null);
};
