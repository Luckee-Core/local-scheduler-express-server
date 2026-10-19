/**
 * Seeds scheduler_project, scheduler_project_repo, and scheduled_tasks from data/*.registry.json.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { upsertSchedulerProject } from '../src/data/scheduler_project';
import { upsertSchedulerProjectRepo } from '../src/data/scheduler_project_repo';
import type { SchedulerExecutionType } from '../src/model/scheduler-project-repo';
import { initializePgPool, getManagedPgPool } from '../src/services/managed';
import { upsertTasksFromRegistryFile } from './lib/upsert-tasks-from-registry';

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

  await upsertTasksFromRegistryFile(pool, 'data/tasks.registry.json');

  console.log('✅ Seed complete');
  await pool.end();
};

main().catch((error) => {
  console.error('❌ Seed failed', error);
  process.exit(1);
});
