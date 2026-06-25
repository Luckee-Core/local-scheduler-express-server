import fs from 'fs';
import path from 'path';
import type { SchedulerRun } from './types';

const getRunsDir = (): string =>
  process.env.SCHEDULER_RUNS_DIR?.trim() || '/tmp/local-scheduler/runs';

/**
 * Lists run records newest first.
 */
export const listRuns = (limit = 100): SchedulerRun[] => {
  const dir = getRunsDir();
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const filePath = path.join(dir, name);
      const stat = fs.statSync(filePath);
      return { filePath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);

  return files.map(({ filePath }) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as SchedulerRun;
  });
};

/**
 * Returns the latest run for a task id, if any.
 */
export const getLatestRunForTask = (taskId: string): SchedulerRun | null => {
  const runs = listRuns(500);
  return runs.find((run) => run.taskId === taskId) ?? null;
};
