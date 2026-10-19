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
    `SELECT id, name, worker_project_id, scheduler_project_repo_id, enabled, worker, request, schedule, lifecycle, created_at, updated_at
     FROM scheduled_tasks WHERE id = $1`,
    [id],
  );
  if (existing.rows.length === 0) {
    return null;
  }

  const row = mapScheduledTaskRow(existing.rows[0]);
  const now = new Date().toISOString();

  const name = input.name ?? row.name;
  const schedulerProjectRepoId = input.schedulerProjectRepoId ?? row.schedulerProjectRepoId;
  const workerProjectId = input.workerProjectId ?? schedulerProjectRepoId;
  const enabled = input.enabled ?? row.enabled;
  const worker = input.worker ?? row.worker;
  const request = input.request ?? row.request;
  const schedule = input.schedule ?? row.schedule;
  const lifecycle = input.lifecycle ?? row.lifecycle;

  const result = await pool.query(
    `UPDATE scheduled_tasks SET
      name = $2,
      worker_project_id = $3,
      scheduler_project_repo_id = $4,
      enabled = $5,
      worker = $6::jsonb,
      request = $7::jsonb,
      schedule = $8::jsonb,
      lifecycle = $9,
      updated_at = $10::timestamptz
     WHERE id = $1
     RETURNING id, name, worker_project_id, scheduler_project_repo_id, enabled, worker, request, schedule, lifecycle, created_at, updated_at`,
    [
      id,
      name,
      workerProjectId,
      schedulerProjectRepoId,
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
