import type { WorkerRuntimeStatus } from '../../model/worker-runtime';
import { probeExpressHealth } from '../../utils/worker/probe-express-health';
import { readWorkerManifest, workerLogPath } from '../../utils/worker/worker-manifest';

export type ResolveWorkerRuntimeInput = {
  workerProjectId: string;
  port: number;
  healthPath: string;
  expressDir: string | null;
};

/**
 * Builds worker runtime status from manifest, disk paths, and live health probe.
 */
export const processResolveWorkerRuntime = (
  input: ResolveWorkerRuntimeInput,
): WorkerRuntimeStatus => {
  const manifest = readWorkerManifest(input.workerProjectId);
  const logPath = manifest?.logPath ?? workerLogPath(input.workerProjectId);
  const probe = probeExpressHealth(input.port, input.healthPath);
  const healthy = probe.ok;

  let phase = manifest?.phase ?? 'idle';
  if (healthy && phase === 'starting') {
    phase = 'healthy';
  }
  if (!healthy && phase === 'healthy') {
    phase = 'idle';
  }

  return {
    workerProjectId: input.workerProjectId,
    port: input.port,
    expressDir: input.expressDir ?? manifest?.expressDir ?? null,
    logPath,
    pid: manifest?.pid ?? null,
    phase,
    startedAt: manifest?.startedAt ?? null,
    updatedAt: manifest?.updatedAt ?? null,
    lastHealthAt: healthy ? new Date().toISOString() : manifest?.lastHealthAt ?? null,
    taskId: manifest?.taskId ?? null,
    healthy,
  };
};
