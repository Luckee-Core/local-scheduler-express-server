import fs from 'fs';
import path from 'path';
import type { TaskRegistryFile } from './types';

/**
 * Reads the committed task registry from data/tasks.registry.json.
 */
export const readTaskRegistry = (): TaskRegistryFile => {
  const filePath = path.join(process.cwd(), 'data', 'tasks.registry.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as TaskRegistryFile;
};
