import fs from 'fs';
import path from 'path';
import type { SchedulerRun } from './types';

const getRunsDir = (): string =>
  process.env.SCHEDULER_RUNS_DIR?.trim() || '/tmp/local-scheduler/runs';

/**
 * Fetches one run record by id.
 */
export const getRunById = (id: string): SchedulerRun | null => {
  const filePath = path.join(getRunsDir(), `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as SchedulerRun;
};
