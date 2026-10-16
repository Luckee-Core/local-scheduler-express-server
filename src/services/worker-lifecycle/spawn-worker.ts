import fs from 'fs';
import { spawn } from 'child_process';
import type { SpawnableWorker } from '../../model/spawnable-worker';
import { getWorkersDir } from '../../utils/worker/get-workers-dir';
import { isExpressHealthOk, probeExpressHealth } from '../../utils/worker/index';
import { readWorkerLogTail } from '../../utils/worker/read-worker-log-tail';
import {
  clearWorkerManifest,
  workerLogPath,
  workerPidPath,
  writeWorkerManifest,
} from '../../utils/worker/worker-manifest';

const HEALTH_WAIT_MS = 120_000;
const HEALTH_POLL_MS = 1_000;
const HEALTH_PROGRESS_LOG_MS = 10_000;

const pidFilePath = (workerProjectId: string): string => workerPidPath(workerProjectId);

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
  fs.mkdirSync(getWorkersDir(), { recursive: true });
  fs.writeFileSync(pidFilePath(workerProjectId), String(pid), 'utf8');
};

const clearPid = (workerProjectId: string): void => {
  const filePath = pidFilePath(workerProjectId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type SpawnWorkerResult = {
  pid: number;
  logPath: string;
};

/**
 * Spawns a worker Express process in the background.
 */
export const spawnWorker = (worker: SpawnableWorker): SpawnWorkerResult => {
  const logPath = workerLogPath(worker.workerProjectId);
  fs.mkdirSync(getWorkersDir(), { recursive: true });
  const nvmPrefix = worker.nvmSh ? `source "${worker.nvmSh}" && ` : '';
  const runWorker =
    `${nvmPrefix}unset DATABASE_URL && cd "${worker.expressDir}" && export PORT=${worker.port} && ${worker.startCommand}`;
  // Redirect the whole shell session so nvm/cd/npm failures appear in the log file.
  const command =
    `exec >>"${logPath}" 2>&1; ` +
    `echo "[spawn-worker] $(date -u +%Y-%m-%dT%H:%M:%SZ) starting ${worker.workerProjectId}"; ` +
    `${runWorker} || echo "[spawn-worker] exit=$?"`;

  const child = spawn('/bin/zsh', ['-lc', command], {
    detached: true,
    stdio: 'ignore',
  });

  if (!child.pid) {
    throw new Error(`Failed to spawn worker for ${worker.workerProjectId}`);
  }

  child.unref();
  writePid(worker.workerProjectId, child.pid);

  return { pid: child.pid, logPath };
};

export type EnsureWorkerReadyOptions = {
  taskId?: string;
};

export type EnsureWorkerReadyResult = {
  startedByScheduler: boolean;
  baseUrl: string;
  logPath: string;
};

/**
 * Waits up to maxWaitMs for worker health with periodic progress logs.
 */
export const waitForWorkerHealthAsync = async (
  workerProjectId: string,
  port: number,
  healthPath: string,
  maxWaitMs = HEALTH_WAIT_MS,
): Promise<boolean> => {
  const started = Date.now();
  let lastProgressLog = started;

  while (Date.now() - started < maxWaitMs) {
    const probe = probeExpressHealth(port, healthPath);
    if (probe.ok) {
      return true;
    }

    const now = Date.now();
    if (now - lastProgressLog >= HEALTH_PROGRESS_LOG_MS) {
      const elapsedSec = Math.round((now - started) / 1000);
      console.log(
        `⏳ [spawn-worker] Waiting for ${workerProjectId} health (${elapsedSec}s)`,
        {
          portListening: probe.portListening,
          healthUrl: probe.healthUrl,
          failureReason: probe.failureReason,
        },
      );
      lastProgressLog = now;
    }

    await sleep(HEALTH_POLL_MS);
  }

  return isExpressHealthOk(port, healthPath);
};

const buildHealthTimeoutError = (
  workerProjectId: string,
  logPath: string,
): Error => {
  const tail = readWorkerLogTail(logPath, 40);
  const tailBlock = tail.length > 0 ? `\n--- worker log tail ---\n${tail}` : '\n(worker log empty or missing)';
  const message =
    `Worker ${workerProjectId} did not become healthy within ${HEALTH_WAIT_MS / 1000}s` +
    ` (log: ${logPath})${tailBlock}`;

  console.error(`❌ [spawn-worker] ${message}`);
  return new Error(message);
};

/**
 * Ensures worker is healthy; spawns if needed.
 */
export const ensureWorkerReady = async (
  worker: SpawnableWorker,
  options?: EnsureWorkerReadyOptions,
): Promise<EnsureWorkerReadyResult> => {
  const baseUrl = `http://127.0.0.1:${worker.port}`;
  const healthPath = worker.healthPath;
  const logPath = workerLogPath(worker.workerProjectId);

  if (isExpressHealthOk(worker.port, healthPath)) {
    console.log(`✅ [spawn-worker] Worker ${worker.workerProjectId} already healthy on :${worker.port}`);
    return { startedByScheduler: false, baseUrl, logPath };
  }

  console.log(`🚀 [spawn-worker] Starting worker ${worker.workerProjectId} on port ${worker.port}`);
  const spawned = spawnWorker(worker);

  writeWorkerManifest({
    workerProjectId: worker.workerProjectId,
    pid: spawned.pid,
    port: worker.port,
    logPath: spawned.logPath,
    expressDir: worker.expressDir,
    phase: 'starting',
    taskId: options?.taskId ?? null,
  });

  console.log(`🚀 [spawn-worker] Spawned ${worker.workerProjectId}`, {
    pid: spawned.pid,
    port: worker.port,
    expressDir: worker.expressDir,
    logPath: spawned.logPath,
    startCommand: worker.startCommand,
    nvmSh: worker.nvmSh ? 'set' : 'unset',
  });
  console.log(`📋 [spawn-worker] Worker logs: tail -f ${spawned.logPath}`);

  const healthy = await waitForWorkerHealthAsync(
    worker.workerProjectId,
    worker.port,
    healthPath,
  );

  if (!healthy) {
    writeWorkerManifest({
      workerProjectId: worker.workerProjectId,
      pid: spawned.pid,
      port: worker.port,
      logPath: spawned.logPath,
      expressDir: worker.expressDir,
      phase: 'failed',
      taskId: options?.taskId ?? null,
    });
    throw buildHealthTimeoutError(worker.workerProjectId, spawned.logPath);
  }

  const now = new Date().toISOString();
  writeWorkerManifest({
    workerProjectId: worker.workerProjectId,
    pid: spawned.pid,
    port: worker.port,
    logPath: spawned.logPath,
    expressDir: worker.expressDir,
    phase: 'healthy',
    lastHealthAt: now,
    taskId: options?.taskId ?? null,
  });

  console.log(`✅ [spawn-worker] Worker ${worker.workerProjectId} is healthy`);
  return { startedByScheduler: true, baseUrl, logPath };
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
    console.log(`📤 [spawn-worker] Stopped worker ${workerProjectId} (pid ${pid})`);
  } catch (error) {
    console.error(`❌ [spawn-worker] Failed to stop worker ${workerProjectId}:`, error);
  } finally {
    clearPid(workerProjectId);
    clearWorkerManifest(workerProjectId);
  }
};

/**
 * Returns true if scheduler owns the worker pid file.
 */
export const wasStartedByScheduler = (workerProjectId: string): boolean =>
  readPid(workerProjectId) !== null;
