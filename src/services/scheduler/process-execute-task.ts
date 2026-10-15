import type { Pool } from 'pg';
import { insertSchedulerRun } from '../../data/scheduler_runs';
import type { MergedScheduledTask } from '../../model/scheduled-task';
import {
  ensureWorkerReady,
  stopWorkerIfStartedByScheduler,
} from '../worker-lifecycle/spawn-worker';

export type ExecuteTaskInput = {
  pool: Pool;
  task: MergedScheduledTask;
  trigger: 'scheduled' | 'manual';
};

export type ExecuteTaskResult = {
  runId: string;
  status: 'success' | 'failed' | 'skipped';
};

const persistRun = async (
  pool: Pool,
  input: {
    taskId: string;
    taskName: string;
    startedAt: Date;
    finishedAt: Date;
    status: 'success' | 'failed' | 'skipped';
    httpStatus: number | null;
    error: string | null;
    responseSummary: string | null;
    trigger: 'scheduled' | 'manual';
  },
) => {
  return insertSchedulerRun(pool, {
    taskId: input.taskId,
    taskName: input.taskName,
    startedAt: input.startedAt.toISOString(),
    finishedAt: input.finishedAt.toISOString(),
    durationMs: input.finishedAt.getTime() - input.startedAt.getTime(),
    status: input.status,
    httpStatus: input.httpStatus,
    error: input.error,
    responseSummary: input.responseSummary,
    trigger: input.trigger,
  });
};

/**
 * Runs one scheduled task against its worker HTTP endpoint.
 */
export const processExecuteTask = async (
  input: ExecuteTaskInput,
): Promise<ExecuteTaskResult> => {
  const { pool, task, trigger } = input;
  const startedAt = new Date();

  if (!task.enabled) {
    const finishedAt = new Date();
    const run = await persistRun(pool, {
      taskId: task.id,
      taskName: task.name,
      startedAt,
      finishedAt,
      status: 'skipped',
      httpStatus: null,
      error: 'Task is disabled',
      responseSummary: null,
      trigger,
    });
    return { runId: run.id, status: 'skipped' };
  }

  let startedByScheduler = false;

  try {
    const ready = await ensureWorkerReady(task);
    startedByScheduler = ready.startedByScheduler;

    const url = `${ready.baseUrl}${task.request.path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (task.request.authEnvKey) {
      const secret = process.env[task.request.authEnvKey];
      if (secret) {
        headers.Authorization = `Bearer ${secret}`;
        headers['x-cron-secret'] = secret;
      }
    }

    console.log(`📥 ${task.request.method} ${url} (${trigger})`);

    const response = await fetch(url, {
      method: task.request.method,
      headers,
      body: task.request.method === 'GET' ? undefined : JSON.stringify({}),
    });

    const text = await response.text();
    const finishedAt = new Date();
    const summary = text.length > 4000 ? `${text.slice(0, 4000)}…` : text;

    if (!response.ok) {
      const run = await persistRun(pool, {
        taskId: task.id,
        taskName: task.name,
        startedAt,
        finishedAt,
        status: 'failed',
        httpStatus: response.status,
        error: `HTTP ${response.status}`,
        responseSummary: summary,
        trigger,
      });
      return { runId: run.id, status: 'failed' };
    }

    const run = await persistRun(pool, {
      taskId: task.id,
      taskName: task.name,
      startedAt,
      finishedAt,
      status: 'success',
      httpStatus: response.status,
      error: null,
      responseSummary: summary,
      trigger,
    });

    console.log(`✅ Task ${task.id} completed (${run.durationMs}ms)`);
    return { runId: run.id, status: 'success' };
  } catch (error) {
    const finishedAt = new Date();
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Task ${task.id} failed:`, message);

    const run = await persistRun(pool, {
      taskId: task.id,
      taskName: task.name,
      startedAt,
      finishedAt,
      status: 'failed',
      httpStatus: null,
      error: message,
      responseSummary: null,
      trigger,
    });
    return { runId: run.id, status: 'failed' };
  } finally {
    if (startedByScheduler) {
      stopWorkerIfStartedByScheduler(task.workerProjectId);
    }
  }
};
