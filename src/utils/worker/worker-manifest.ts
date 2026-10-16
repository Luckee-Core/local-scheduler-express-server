import fs from 'fs';
import path from 'path';
import type { WorkerManifest, WorkerManifestPhase } from '../../model/worker-runtime';
import { getWorkersDir } from './get-workers-dir';

export const workerLogPath = (workerProjectId: string): string =>
  path.join(getWorkersDir(), `${workerProjectId}.log`);

export const workerPidPath = (workerProjectId: string): string =>
  path.join(getWorkersDir(), `${workerProjectId}.pid`);

export const workerManifestPath = (workerProjectId: string): string =>
  path.join(getWorkersDir(), `${workerProjectId}.manifest.json`);

const ensureWorkersDir = (): void => {
  fs.mkdirSync(getWorkersDir(), { recursive: true });
};

/**
 * Reads worker manifest from disk when present.
 */
export const readWorkerManifest = (workerProjectId: string): WorkerManifest | null => {
  const filePath = workerManifestPath(workerProjectId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as WorkerManifest;
  } catch {
    return null;
  }
};

export type WriteWorkerManifestInput = {
  workerProjectId: string;
  pid: number | null;
  port: number;
  logPath: string;
  expressDir: string;
  phase: WorkerManifestPhase;
  startedAt?: string;
  lastHealthAt?: string | null;
  taskId?: string | null;
};

/**
 * Writes or updates worker manifest JSON.
 */
export const writeWorkerManifest = (input: WriteWorkerManifestInput): WorkerManifest => {
  ensureWorkersDir();
  const existing = readWorkerManifest(input.workerProjectId);
  const now = new Date().toISOString();
  const manifest: WorkerManifest = {
    workerProjectId: input.workerProjectId,
    pid: input.pid,
    port: input.port,
    logPath: input.logPath,
    expressDir: input.expressDir,
    phase: input.phase,
    startedAt: input.startedAt ?? existing?.startedAt ?? now,
    updatedAt: now,
    lastHealthAt: input.lastHealthAt ?? existing?.lastHealthAt ?? null,
    taskId: input.taskId ?? existing?.taskId ?? null,
  };
  fs.writeFileSync(workerManifestPath(input.workerProjectId), JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
};

/**
 * Removes worker manifest file.
 */
export const clearWorkerManifest = (workerProjectId: string): void => {
  const filePath = workerManifestPath(workerProjectId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
