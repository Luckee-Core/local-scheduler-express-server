import fs from 'fs';
import path from 'path';
import type { SchedulerLocalFile } from './types';

/**
 * Reads scheduler.local.json from repo root, or returns empty object if missing.
 */
export const readSchedulerLocal = (): SchedulerLocalFile => {
  const filePath = path.join(process.cwd(), 'scheduler.local.json');
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as SchedulerLocalFile;
};

/**
 * Writes scheduler.local.json to repo root.
 */
export const writeSchedulerLocal = (data: SchedulerLocalFile): void => {
  const filePath = path.join(process.cwd(), 'scheduler.local.json');
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};
