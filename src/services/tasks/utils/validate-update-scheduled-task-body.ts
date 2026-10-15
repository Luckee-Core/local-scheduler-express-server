import type { UpdateScheduledTaskInput } from '../../../model/scheduled-task';
import { parseTaskRequest, parseTaskSchedule, parseTaskWorker } from './parse-task-nested-fields';

type ValidationResult =
  | { success: true; data: UpdateScheduledTaskInput }
  | { success: false; error: string };

/**
 * Validates PATCH /api/tasks/:id body (partial update).
 */
export const validateUpdateScheduledTaskBody = (body: unknown): ValidationResult => {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }

  const record = body as Record<string, unknown>;
  const data: UpdateScheduledTaskInput = {};

  if (record.name !== undefined) {
    if (typeof record.name !== 'string' || record.name.trim().length === 0) {
      return { success: false, error: 'name must be a non-empty string' };
    }
    data.name = record.name.trim();
  }

  if (record.workerProjectId !== undefined) {
    if (typeof record.workerProjectId !== 'string' || record.workerProjectId.trim().length === 0) {
      return { success: false, error: 'workerProjectId must be a non-empty string' };
    }
    data.workerProjectId = record.workerProjectId.trim();
  }

  if (record.enabled !== undefined) {
    if (typeof record.enabled !== 'boolean') {
      return { success: false, error: 'enabled must be a boolean' };
    }
    data.enabled = record.enabled;
  }

  if (record.worker !== undefined) {
    const parsed = parseTaskWorker(record.worker);
    if (!parsed.success) {
      return parsed;
    }
    data.worker = parsed.data;
  }

  if (record.request !== undefined) {
    const parsed = parseTaskRequest(record.request);
    if (!parsed.success) {
      return parsed;
    }
    data.request = parsed.data;
  }

  if (record.schedule !== undefined) {
    const parsed = parseTaskSchedule(record.schedule);
    if (!parsed.success) {
      return parsed;
    }
    data.schedule = parsed.data;
  }

  if (record.lifecycle !== undefined) {
    if (record.lifecycle !== 'start_if_needed_stop_if_started') {
      return { success: false, error: 'lifecycle must be start_if_needed_stop_if_started' };
    }
    data.lifecycle = record.lifecycle;
  }

  if (
    Object.keys(data).length === 0
  ) {
    return { success: false, error: 'No updatable fields provided' };
  }

  return { success: true, data };
};
