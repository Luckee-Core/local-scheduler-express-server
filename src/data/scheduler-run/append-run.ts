import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { AppendRunInput, SchedulerRun } from './types';

const getRunsDir = (): string =>
  process.env.SCHEDULER_RUNS_DIR?.trim() || '/tmp/local-scheduler/runs';

const ensureRunsDir = (): string => {
  const dir = getRunsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/**
 * Appends a run record as a JSON file.
 */
export const appendRun = (input: AppendRunInput): SchedulerRun => {
  const dir = ensureRunsDir();
  const run: SchedulerRun = {
    id: input.id ?? randomUUID(),
    taskId: input.taskId,
    taskName: input.taskName,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    durationMs: input.durationMs,
    status: input.status,
    httpStatus: input.httpStatus,
    error: input.error,
    responseSummary: input.responseSummary,
    trigger: input.trigger,
  };
  const filePath = path.join(dir, `${run.id}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  return run;
};
