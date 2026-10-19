import type { Pool } from 'pg';
import type { MergedScheduledTask } from '../../model/scheduled-task';
import { getSchedulerProjectById } from '../../data/scheduler_project';
import { getSchedulerProjectRepoById } from '../../data/scheduler_project_repo';
import { getLatestSchedulerRunForTask } from '../../data/scheduler_runs';
import { getScheduledTaskById } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { mergeScheduledTaskRow } from './merge-scheduled-task';

/**
 * Returns one merged scheduled task by id.
 */
export const processGetScheduledTask = async (
  pool: Pool,
  taskId: string,
): Promise<MergedScheduledTask | null> => {
  const row = await getScheduledTaskById(pool, taskId);
  if (!row) {
    return null;
  }
  const repo = await getSchedulerProjectRepoById(pool, row.schedulerProjectRepoId);
  if (!repo) {
    console.error(
      `❌ [processGetScheduledTask] Missing repo ${row.schedulerProjectRepoId} for task ${taskId}`,
    );
    return null;
  }
  const project = await getSchedulerProjectById(pool, repo.schedulerProjectId);
  if (!project) {
    console.error(
      `❌ [processGetScheduledTask] Missing project ${repo.schedulerProjectId} for task ${taskId}`,
    );
    return null;
  }
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
