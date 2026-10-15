import type { ScheduledTaskRow } from '../../model/scheduled-task';

type DbScheduledTaskRow = {
  id: string;
  name: string;
  worker_project_id: string;
  enabled: boolean;
  worker: ScheduledTaskRow['worker'];
  request: ScheduledTaskRow['request'];
  schedule: ScheduledTaskRow['schedule'];
  lifecycle: ScheduledTaskRow['lifecycle'];
  created_at: Date | string;
  updated_at: Date | string;
};

/**
 * Maps a Postgres row to ScheduledTaskRow.
 */
export const mapScheduledTaskRow = (row: DbScheduledTaskRow): ScheduledTaskRow => ({
  id: row.id,
  name: row.name,
  workerProjectId: row.worker_project_id,
  enabled: row.enabled,
  worker: row.worker,
  request: row.request,
  schedule: row.schedule,
  lifecycle: row.lifecycle,
  createdAt:
    row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  updatedAt:
    row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
});
