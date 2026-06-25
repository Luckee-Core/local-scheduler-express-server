import { appendRun } from '../../data/scheduler-run';
import type { MergedTask } from '../../data/task-registry/types';
import { isWithinScheduleWindow } from '../../utils/worker';
import {
  ensureWorkerReady,
  stopWorkerIfStartedByScheduler,
} from '../worker-lifecycle/spawn-worker';

export type ExecuteTaskInput = {
  task: MergedTask;
  trigger: 'scheduled' | 'manual';
  skipScheduleWindow?: boolean;
};

export type ExecuteTaskResult = {
  runId: string;
  status: 'success' | 'failed' | 'skipped';
};

/**
 * Runs one scheduled task against its worker HTTP endpoint.
 */
export const processExecuteTask = async (
  input: ExecuteTaskInput,
): Promise<ExecuteTaskResult> => {
  const { task, trigger, skipScheduleWindow = false } = input;
  const startedAt = new Date();

  if (!task.enabled) {
    const finishedAt = new Date();
    const run = appendRun({
      taskId: task.id,
      taskName: task.name,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      status: 'skipped',
      httpStatus: null,
      error: 'Task is disabled',
      responseSummary: null,
      trigger,
    });
    return { runId: run.id, status: 'skipped' };
  }

  if (!skipScheduleWindow && trigger === 'scheduled' && !isWithinScheduleWindow(task.schedule)) {
    const finishedAt = new Date();
    const run = appendRun({
      taskId: task.id,
      taskName: task.name,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      status: 'skipped',
      httpStatus: null,
      error: 'Outside schedule window',
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
    const summary = text.length > 500 ? `${text.slice(0, 500)}…` : text;

    if (!response.ok) {
      const run = appendRun({
        taskId: task.id,
        taskName: task.name,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        status: 'failed',
        httpStatus: response.status,
        error: `HTTP ${response.status}`,
        responseSummary: summary,
        trigger,
      });
      return { runId: run.id, status: 'failed' };
    }

    const run = appendRun({
      taskId: task.id,
      taskName: task.name,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
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

    const run = appendRun({
      taskId: task.id,
      taskName: task.name,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
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
