/**
 * Worker spawn manifest and API shapes (filesystem + HTTP).
 */

export type WorkerManifestPhase = 'idle' | 'starting' | 'healthy' | 'failed';

export type WorkerManifest = {
  workerProjectId: string;
  pid: number | null;
  port: number;
  logPath: string;
  expressDir: string;
  phase: WorkerManifestPhase;
  startedAt: string;
  updatedAt: string;
  lastHealthAt: string | null;
  taskId: string | null;
};

export type WorkerRuntimeStatus = {
  workerProjectId: string;
  port: number;
  expressDir: string | null;
  logPath: string;
  pid: number | null;
  phase: WorkerManifestPhase;
  startedAt: string | null;
  updatedAt: string | null;
  lastHealthAt: string | null;
  taskId: string | null;
  healthy: boolean;
};
