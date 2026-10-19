/**
 * Seeds scheduler_project, scheduler_project_repo, and scheduled_tasks from data/*.registry.json.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { upsertSchedulerProject } from '../src/data/scheduler_project';
import { upsertSchedulerProjectRepo } from '../src/data/scheduler_project_repo';
import { insertScheduledTask, getScheduledTaskById, updateScheduledTask } from '../src/data/scheduled_tasks';
import type { ScheduledTaskLifecycle, TaskSchedule } from '../src/model/scheduled-task';
import type { SchedulerExecutionType } from '../src/model/scheduler-project-repo';
import { initializePgPool, getManagedPgPool } from '../src/services/managed';

dotenv.config();

type ProjectRegistryFile = {
  projects: Array<{ id: string; name: string }>;
};

type RepoRegistryFile = {
  repos: Array<{
    id: string;
    schedulerProjectId: string;
    expressRepoName: string;
    executionType: SchedulerExecutionType;
    productionBaseUrl?: string;
    defaultPort?: number;
    healthPath?: string;
  }>;
};

type TasksRegistryFile = {
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

const main = async (): Promise<void> => {
  await initializePgPool();
  const pool = getManagedPgPool();
  if (!pool) {
    console.error('❌ DATABASE_URL required');
    process.exit(1);
  }

  const projectPath = path.join(process.cwd(), 'data', 'scheduler-project.registry.json');
  const projectRegistry = JSON.parse(fs.readFileSync(projectPath, 'utf8')) as ProjectRegistryFile;

  for (const project of projectRegistry.projects) {
    await upsertSchedulerProject(pool, project);
    console.log(`✅ Upserted business ${project.id}`);
  }

  const repoPath = path.join(process.cwd(), 'data', 'scheduler-project-repo.registry.json');
  const repoRegistry = JSON.parse(fs.readFileSync(repoPath, 'utf8')) as RepoRegistryFile;

  for (const repo of repoRegistry.repos) {
    await upsertSchedulerProjectRepo(pool, {
      id: repo.id,
      schedulerProjectId: repo.schedulerProjectId,
      expressRepoName: repo.expressRepoName,
      executionType: repo.executionType,
      productionBaseUrl: repo.productionBaseUrl ?? null,
      defaultPort: repo.defaultPort ?? null,
      healthPath: repo.healthPath,
    });
    console.log(`✅ Upserted repo ${repo.id}`);
  }

  const registryPath = path.join(process.cwd(), 'data', 'tasks.registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as TasksRegistryFile;

  let localEnabled: Record<string, { enabled?: boolean }> = {};
  const localPath = path.join(process.cwd(), 'scheduler.local.json');
  if (fs.existsSync(localPath)) {
    const local = JSON.parse(fs.readFileSync(localPath, 'utf8')) as {
      tasks?: Record<string, { enabled?: boolean }>;
    };
    localEnabled = local.tasks ?? {};
  }

  for (const entry of registry.tasks) {
    const enabled =
      localEnabled[entry.id]?.enabled !== undefined
        ? localEnabled[entry.id].enabled!
        : entry.enabledByDefault;

    const schedulerProjectRepoId =
      entry.schedulerProjectRepoId ??
      entry.schedulerProjectId ??
      entry.workerProjectId;

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

  console.log('✅ Seed complete');
  await pool.end();
};

main().catch((error) => {
  console.error('❌ Seed failed', error);
  process.exit(1);
});
