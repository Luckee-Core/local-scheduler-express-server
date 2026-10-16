/**
 * Minimal worker shape for spawn and health checks (dispatcher, storage, etc.).
 */
export type SpawnableWorker = {
  workerProjectId: string;
  expressDir: string;
  port: number;
  nvmSh: string | null;
  healthPath: string;
  startCommand: string;
};
