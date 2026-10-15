import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import type { MergedScheduledTask } from '../../model/scheduled-task';
import { isExpressHealthOk } from '../../utils/worker';

const getWorkersDir = (): string =>
  process.env.SCHEDULER_WORKERS_DIR?.trim() || '/tmp/local-scheduler/workers';

const pidFilePath = (workerProjectId: string): string => {
  const dir = getWorkersDir();
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${workerProjectId}.pid`);
};

const readPid = (workerProjectId: string): number | null => {
  const filePath = pidFilePath(workerProjectId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  const pid = Number.parseInt(raw, 10);
  return Number.isFinite(pid) ? pid : null;
};

const writePid = (workerProjectId: string, pid: number): void => {
  fs.writeFileSync(pidFilePath(workerProjectId), String(pid), 'utf8');
};

const clearPid = (workerProjectId: string): void => {
  const filePath = pidFilePath(workerProjectId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export type SpawnWorkerResult = {
  pid: number;
  logPath: string;
};

/**
 * Spawns a worker Express process in the background.
 */
export const spawnWorker = (task: MergedScheduledTask): SpawnWorkerResult => {
  if (!task.expressDir) {
    throw new Error(
      `Worker ${task.workerProjectId} has no expressDir in scheduler.local.json`,
    );
  }

  const logPath = path.join(getWorkersDir(), `${task.workerProjectId}.log`);
  const nvmPrefix = task.nvmSh ? `source "${task.nvmSh}" && ` : '';
  const command =
    `${nvmPrefix}cd "${task.expressDir}" && export PORT=${task.port} && ` +
    `${task.worker.startCommand} >> "${logPath}" 2>&1`;

  const child = spawn('/bin/zsh', ['-lc', command], {
    detached: true,
    stdio: 'ignore',
  });

  if (!child.pid) {
    throw new Error(`Failed to spawn worker for ${task.workerProjectId}`);
  }

  child.unref();
  writePid(task.workerProjectId, child.pid);

  return { pid: child.pid, logPath };
};

const sleepMs = (ms: number): void => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // intentional busy wait
  }
};

export type EnsureWorkerReadyResult = {
  startedByScheduler: boolean;
  baseUrl: string;
};

/**
 * Waits up to maxWaitMs for worker health.
 */
export const waitForWorkerHealth = (
  port: number,
  healthPath: string,
  maxWaitMs = 120000,
): boolean => {
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    if (isExpressHealthOk(port, healthPath)) {
      return true;
    }
    sleepMs(1000);
  }
  return isExpressHealthOk(port, healthPath);
};

/**
 * Ensures worker is healthy; spawns if needed.
 */
export const ensureWorkerReady = async (
  task: MergedScheduledTask,
): Promise<EnsureWorkerReadyResult> => {
  const baseUrl = `http://127.0.0.1:${task.port}`;
  const healthPath = task.worker.healthPath;

  if (isExpressHealthOk(task.port, healthPath)) {
    return { startedByScheduler: false, baseUrl };
  }

  if (!task.expressDir) {
    throw new Error(
      `Worker ${task.workerProjectId} is not running and expressDir is not configured`,
    );
  }

  console.log(`🚀 Starting worker ${task.workerProjectId} on port ${task.port}`);
  spawnWorker(task);

  const healthy = waitForWorkerHealth(task.port, healthPath);
  if (!healthy) {
    throw new Error(`Worker ${task.workerProjectId} did not become healthy within 120s`);
  }

  console.log(`✅ Worker ${task.workerProjectId} is healthy`);
  return { startedByScheduler: true, baseUrl };
};

/**
 * Stops worker only if scheduler recorded a PID for it.
 */
export const stopWorkerIfStartedByScheduler = (workerProjectId: string): void => {
  const pid = readPid(workerProjectId);
  if (!pid) {
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    console.log(`📤 Stopped worker ${workerProjectId} (pid ${pid})`);
  } catch (error) {
    console.error(`❌ Failed to stop worker ${workerProjectId}:`, error);
  } finally {
    clearPid(workerProjectId);
  }
};

/**
 * Returns true if scheduler owns the worker pid file.
 */
export const wasStartedByScheduler = (workerProjectId: string): boolean =>
  readPid(workerProjectId) !== null;
