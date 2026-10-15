import type { CreateScheduledTaskInput } from '../../../model/scheduled-task';
import { parseTaskRequest, parseTaskSchedule, parseTaskWorker } from './parse-task-nested-fields';

const ID_PATTERN = /^[a-z0-9-]+$/;

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
  const lifecycle = record.lifecycle;

  const data: CreateScheduledTaskInput = {
    id,
    name: name.trim(),
    workerProjectId: workerProjectId.trim(),
    enabled: typeof enabled === 'boolean' ? enabled : undefined,
    worker: workerParsed.data,
    request: requestParsed.data,
    schedule: scheduleParsed.data,
    lifecycle:
      lifecycle === 'start_if_needed_stop_if_started' ? lifecycle : undefined,
  };

  return { success: true, data };
};
