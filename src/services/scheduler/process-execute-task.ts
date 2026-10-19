import type { Pool } from 'pg';
import { getSchedulerProjectRepoById } from '../../data/scheduler_project_repo';
import { insertSchedulerRun } from '../../data/scheduler_runs';
import { readSchedulerLocal } from '../../data/worker-local-config';
import type { MergedScheduledTask } from '../../model/scheduled-task';
import { ensureProductionHealth } from '../../utils/scheduler/ensure-production-health';
import { resolveTaskExecutionTarget } from '../../utils/scheduler/resolve-task-execution-target';
import { readWorkerLogTail } from '../../utils/worker/read-worker-log-tail';
import { workerLogPath } from '../../utils/worker/worker-manifest';
import { ensureTaskWorkersReady } from '../worker-lifecycle/ensure-task-workers-ready';
import { stopWorkerIfStartedByScheduler } from '../worker-lifecycle/spawn-worker';

export type ExecuteTaskInput = {
  pool: Pool;
  task: MergedScheduledTask;
  trigger: 'scheduled' | 'manual';
};

export type ExecuteTaskResult = {
  runId: string;
  status: 'success' | 'failed' | 'skipped';
};

const RUN_SUMMARY_MAX = 4000;

const truncateForRun = (value: string): string =>
  value.length > RUN_SUMMARY_MAX ? `${value.slice(0, RUN_SUMMARY_MAX)}…` : value;

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
 * Manual runs always call the worker; only scheduled ticks honor `task.enabled`.
 */
export const processExecuteTask = async (
  input: ExecuteTaskInput,
): Promise<ExecuteTaskResult> => {
  const { pool, task, trigger } = input;
  const startedAt = new Date();

  if (trigger === 'scheduled' && !task.enabled) {
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

  const startedWorkerProjectIds: string[] = [];
  let skipWorkerLifecycle = task.schedulerProjectRepo.executionType === 'production';

  try {
    console.log(
      `🚀 [processExecuteTask] Task ${task.id} (${trigger}) repo=${task.schedulerProjectRepoId} type=${task.schedulerProjectRepo.executionType}`,
    );

    const repoRow = await getSchedulerProjectRepoById(pool, task.schedulerProjectRepoId);
    if (!repoRow) {
      throw new Error(`Scheduler project repo not found: ${task.schedulerProjectRepoId}`);
    }

    const local = readSchedulerLocal();
    const target = resolveTaskExecutionTarget(task, repoRow, local);
    skipWorkerLifecycle = target.skipWorkerLifecycle;

    let baseUrl = target.baseUrl;

    if (target.skipWorkerLifecycle) {
      await ensureProductionHealth(target.healthUrl);
    } else {
      const ready = await ensureTaskWorkersReady(task, { taskId: task.id });
      startedWorkerProjectIds.push(...ready.startedWorkerProjectIds);
      baseUrl = ready.baseUrl;
      if (ready.startedWorkerProjectIds.length > 0) {
        console.log(`✅ [processExecuteTask] Spawned workers`, ready.startedWorkerProjectIds);
      }
    }

    const url = `${baseUrl}${task.request.path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (task.request.authEnvKey) {
      const secret = process.env[task.request.authEnvKey]?.trim();
      if (!secret) {
        throw new Error(`Missing env ${task.request.authEnvKey} for task ${task.id}`);
      }
      headers.Authorization = `Bearer ${secret}`;
      headers['x-cron-secret'] = secret;
    }

    console.log(`📥 [processExecuteTask] ${task.request.method} ${url} (${trigger})`);

    const response = await fetch(url, {
      method: task.request.method,
      headers,
      body: task.request.method === 'GET' ? undefined : JSON.stringify({}),
    });

    const text = await response.text();
    const finishedAt = new Date();
    const summary = truncateForRun(text);

    if (!response.ok) {
      console.log(`📤 [processExecuteTask] HTTP ${response.status} for ${task.id}`);
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

    console.log(`✅ [processExecuteTask] Task ${task.id} completed`);
    return { runId: run.id, status: 'success' };
  } catch (error) {
    const finishedAt = new Date();
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [processExecuteTask] Task ${task.id} failed:`, message);

    let responseSummary: string | null = null;
    if (!skipWorkerLifecycle) {
      const logPath = workerLogPath(task.workerProjectId);
      const tail = readWorkerLogTail(logPath, 30);
      if (tail.length > 0) {
        responseSummary = truncateForRun(`worker log (${logPath}):\n${tail}`);
      }
    }

    const run = await persistRun(pool, {
      taskId: task.id,
      taskName: task.name,
      startedAt,
      finishedAt,
      status: 'failed',
      httpStatus: null,
      error: truncateForRun(message),
      responseSummary,
      trigger,
    });
    return { runId: run.id, status: 'failed' };
  } finally {
    if (startedWorkerProjectIds.length > 0) {
      const stopOrder = [...startedWorkerProjectIds].reverse();
      console.log(`📤 [processExecuteTask] Stopping scheduler-spawned workers`, stopOrder);
      for (const workerProjectId of stopOrder) {
        stopWorkerIfStartedByScheduler(workerProjectId);
      }
    }
  }
};
