/**
 * Seeds scheduled_tasks from data/tasks.registry.json (+ enabled from scheduler.local.json).
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { initializePgPool, getManagedPgPool } from '../src/services/managed';
import { insertScheduledTask, getScheduledTaskById, updateScheduledTask } from '../src/data/scheduled_tasks';

dotenv.config();

type RegistryFile = {
  tasks: Array<{
    id: string;
    name: string;
    workerProjectId: string;
    worker: {
      expressRepoName: string;
      defaultPort: number;
      healthPath: string;
      startCommand: string;
    };
    request: { method: string; path: string; authEnvKey?: string };
    schedule: {
      kind: 'interval';
      intervalMinutes: number;
      timezone: string;
      weekdays: number[];
      hourStart: number;
      hourEnd: number;
    };
    lifecycle: 'start_if_needed_stop_if_started';
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

  const registryPath = path.join(process.cwd(), 'data', 'tasks.registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as RegistryFile;

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

    const input = {
      id: entry.id,
      name: entry.name,
      workerProjectId: entry.workerProjectId,
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
