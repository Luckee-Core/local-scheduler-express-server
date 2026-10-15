import fs from 'fs';
import path from 'path';
import type { SchedulerLocalFile } from '../../model/worker-local-config';

/**
 * Reads scheduler.local.json from repo root (workers map only).
 */
export const readSchedulerLocal = (): SchedulerLocalFile => {
  const filePath = path.join(process.cwd(), 'scheduler.local.json');
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as SchedulerLocalFile & { tasks?: unknown };
  return { workers: parsed.workers };
};
