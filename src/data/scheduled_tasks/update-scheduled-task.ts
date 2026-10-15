import type { Pool } from 'pg';
import type { ScheduledTaskRow, UpdateScheduledTaskInput } from '../../model/scheduled-task';
import { mapScheduledTaskRow } from '../../utils/pg/map-scheduled-task-row';

/**
 * Updates a scheduled task by id.
 */
export const updateScheduledTask = async (
  pool: Pool,
  id: string,
  input: UpdateScheduledTaskInput,
): Promise<ScheduledTaskRow | null> => {
  const existing = await pool.query(
    `SELECT id, name, worker_project_id, enabled, worker, request, schedule, lifecycle, created_at, updated_at
     FROM scheduled_tasks WHERE id = $1`,
    [id],
  );
  if (existing.rows.length === 0) {
    return null;
  }

  const row = mapScheduledTaskRow(existing.rows[0]);
  const now = new Date().toISOString();

  const name = input.name ?? row.name;
  const workerProjectId = input.workerProjectId ?? row.workerProjectId;
  const enabled = input.enabled ?? row.enabled;
  const worker = input.worker ?? row.worker;
  const request = input.request ?? row.request;
  const schedule = input.schedule ?? row.schedule;
  const lifecycle = input.lifecycle ?? row.lifecycle;

  const result = await pool.query(
    `UPDATE scheduled_tasks SET
      name = $2,
      worker_project_id = $3,
      enabled = $4,
      worker = $5::jsonb,
      request = $6::jsonb,
      schedule = $7::jsonb,
      lifecycle = $8,
      updated_at = $9::timestamptz
     WHERE id = $1
     RETURNING id, name, worker_project_id, enabled, worker, request, schedule, lifecycle, created_at, updated_at`,
    [
      id,
      name,
      workerProjectId,
      enabled,
      JSON.stringify(worker),
      JSON.stringify(request),
      JSON.stringify(schedule),
      lifecycle,
      now,
    ],
  );
  return mapScheduledTaskRow(result.rows[0]);
};
