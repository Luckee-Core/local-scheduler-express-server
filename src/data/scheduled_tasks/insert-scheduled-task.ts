import type { Pool } from 'pg';
import type { CreateScheduledTaskInput, ScheduledTaskRow } from '../../model/scheduled-task';
import { mapScheduledTaskRow } from '../../utils/pg/map-scheduled-task-row';

/**
 * Inserts a scheduled task row.
 */
export const insertScheduledTask = async (
  pool: Pool,
  input: CreateScheduledTaskInput,
): Promise<ScheduledTaskRow> => {
  const now = new Date().toISOString();
  const lifecycle = input.lifecycle ?? 'start_if_needed_stop_if_started';
  const enabled = input.enabled ?? true;

  const result = await pool.query(
    `INSERT INTO scheduled_tasks (
      id, name, worker_project_id, enabled, worker, request, schedule, lifecycle, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9::timestamptz, $10::timestamptz)
    RETURNING id, name, worker_project_id, enabled, worker, request, schedule, lifecycle, created_at, updated_at`,
    [
      input.id,
      input.name,
      input.workerProjectId,
      enabled,
      JSON.stringify(input.worker),
      JSON.stringify(input.request),
      JSON.stringify(input.schedule),
      lifecycle,
      now,
      now,
    ],
  );
  return mapScheduledTaskRow(result.rows[0]);
};
