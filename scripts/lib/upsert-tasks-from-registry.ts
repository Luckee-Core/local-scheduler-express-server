import fs from 'fs';
import path from 'path';
import type { Pool } from 'pg';
import { getScheduledTaskById, insertScheduledTask, updateScheduledTask } from '../../src/data/scheduled_tasks';
import type { ScheduledTaskLifecycle, TaskSchedule } from '../../src/model/scheduled-task';

export type TasksRegistryFile = {
  tasks: Array<{
    id: string;
    name: string;
    workerProjectId: string;
    schedulerProjectRepoId?: string;
    schedulerProjectId?: string;
    worker: {
      expressRepoName: string;
      defaultPort: number;
      healthPath: string;
      startCommand: string;
    };
    request: { method: string; path: string; authEnvKey?: string };
    schedule: TaskSchedule;
    lifecycle: ScheduledTaskLifecycle;
    enabledByDefault: boolean;
  }>;
};

const readLocalTaskEnabledOverrides = (): Record<string, { enabled?: boolean }> => {
  const localPath = path.join(process.cwd(), 'scheduler.local.json');
  if (!fs.existsSync(localPath)) {
    return {};
  }
  const local = JSON.parse(fs.readFileSync(localPath, 'utf8')) as {
    tasks?: Record<string, { enabled?: boolean }>;
  };
  return local.tasks ?? {};
};

/**
 * Upserts scheduled_tasks rows from a tasks registry JSON file (tasks array only).
 */
export const upsertTasksFromRegistryFile = async (
  pool: Pool,
  registryRelativePath: string,
): Promise<void> => {
  const registryPath = path.join(process.cwd(), registryRelativePath);
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as TasksRegistryFile;
  const localEnabled = readLocalTaskEnabledOverrides();

  for (const entry of registry.tasks) {
    const enabled =
      localEnabled[entry.id]?.enabled !== undefined
        ? localEnabled[entry.id].enabled!
        : entry.enabledByDefault;

    const schedulerProjectRepoId =
      entry.schedulerProjectRepoId ?? entry.schedulerProjectId ?? entry.workerProjectId;

    const input = {
      id: entry.id,
      name: entry.name,
      workerProjectId: schedulerProjectRepoId,
      schedulerProjectRepoId,
      enabled,
      worker: entry.worker,
      request: entry.request,
      schedule: entry.schedule,
      lifecycle: entry.lifecycle,
    };

    const existing = await getScheduledTaskById(pool, entry.id);
    if (existing) {
      await updateScheduledTask(pool, entry.id, input);
      console.log(`✅ Updated task ${entry.id}`);
    } else {
      await insertScheduledTask(pool, input);
      console.log(`✅ Inserted task ${entry.id}`);
    }
  }
};
