import type { Pool } from 'pg';
import type { MergedScheduledTask } from '../../model/scheduled-task';
import { getLatestSchedulerRunForTask } from '../../data/scheduler_runs';
import { listScheduledTasks } from '../../data/scheduled_tasks';
import { readSchedulerLocal } from '../../data/worker-local-config';
import { loadSchedulerCatalogMaps } from './load-scheduler-catalog';
import { mergeScheduledTaskRow } from './merge-scheduled-task';

/**
 * Loads all merged scheduled tasks with last-run metadata.
 */
export const processListScheduledTasks = async (pool: Pool): Promise<MergedScheduledTask[]> => {
  const rows = await listScheduledTasks(pool);
  const local = readSchedulerLocal();
  const { projectsById, reposById } = await loadSchedulerCatalogMaps(pool);

  const merged: MergedScheduledTask[] = [];
  for (const row of rows) {
    const repo = reposById.get(row.schedulerProjectRepoId);
    if (!repo) {
      console.error(
        `❌ [processListScheduledTasks] Missing repo ${row.schedulerProjectRepoId} for task ${row.id}`,
      );
      continue;
    }
    const project = projectsById.get(repo.schedulerProjectId);
    if (!project) {
      console.error(
        `❌ [processListScheduledTasks] Missing project ${repo.schedulerProjectId} for task ${row.id}`,
      );
      continue;
    }
    const latest = await getLatestSchedulerRunForTask(pool, row.id);
    merged.push(
      mergeScheduledTaskRow(
        row,
        local,
        repo,
        project,
        latest?.finishedAt ?? null,
        latest?.status ?? null,
      ),
    );
  }
  return merged;
};
