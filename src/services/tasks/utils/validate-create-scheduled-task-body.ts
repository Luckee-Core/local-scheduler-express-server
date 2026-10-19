import type { CreateScheduledTaskInput, ScheduledTaskLifecycle } from '../../../model/scheduled-task';
import { parseTaskRequest, parseTaskSchedule, parseTaskWorker } from './parse-task-nested-fields';

const ID_PATTERN = /^[a-z0-9-]+$/;

const LIFECYCLE_VALUES: ScheduledTaskLifecycle[] = [
  'start_if_needed_stop_if_started',
  'call_only',
];

type ValidationResult =
  | { success: true; data: CreateScheduledTaskInput }
  | { success: false; error: string };

/**
 * Validates POST /api/tasks body.
 */
export const validateCreateScheduledTaskBody = (body: unknown): ValidationResult => {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }

  const record = body as Record<string, unknown>;
  const id = record.id;
  const name = record.name;
  const workerProjectId = record.workerProjectId;
  const worker = record.worker;
  const request = record.request;
  const schedule = record.schedule;

  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    return { success: false, error: 'id must be a lowercase slug (a-z, 0-9, hyphen)' };
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { success: false, error: 'name is required' };
  }
  if (typeof workerProjectId !== 'string' || workerProjectId.trim().length === 0) {
    return { success: false, error: 'workerProjectId is required' };
  }

  const workerParsed = parseTaskWorker(worker);
  if (!workerParsed.success) {
    return workerParsed;
  }

  const requestParsed = parseTaskRequest(request);
  if (!requestParsed.success) {
    return requestParsed;
  }

  const scheduleParsed = parseTaskSchedule(schedule);
  if (!scheduleParsed.success) {
    return scheduleParsed;
  }

  const enabled = record.enabled;
  const lifecycleRaw = record.lifecycle;
  let lifecycle: ScheduledTaskLifecycle | undefined;
  if (lifecycleRaw !== undefined) {
    if (
      typeof lifecycleRaw !== 'string' ||
      !LIFECYCLE_VALUES.includes(lifecycleRaw as ScheduledTaskLifecycle)
    ) {
      return { success: false, error: 'lifecycle must be start_if_needed_stop_if_started or call_only' };
    }
    lifecycle = lifecycleRaw as ScheduledTaskLifecycle;
  }

  const schedulerProjectRepoIdRaw =
    record.schedulerProjectRepoId ?? record.schedulerProjectId;
  let schedulerProjectRepoId: string | undefined;
  if (schedulerProjectRepoIdRaw !== undefined) {
    if (
      typeof schedulerProjectRepoIdRaw !== 'string' ||
      schedulerProjectRepoIdRaw.trim().length === 0
    ) {
      return { success: false, error: 'schedulerProjectRepoId must be a non-empty string' };
    }
    schedulerProjectRepoId = schedulerProjectRepoIdRaw.trim();
  }

  const data: CreateScheduledTaskInput = {
    id,
    name: name.trim(),
    workerProjectId: workerProjectId.trim(),
    schedulerProjectRepoId,
    enabled: typeof enabled === 'boolean' ? enabled : undefined,
    worker: workerParsed.data,
    request: requestParsed.data,
    schedule: scheduleParsed.data,
    lifecycle,
  };

  return { success: true, data };
};
