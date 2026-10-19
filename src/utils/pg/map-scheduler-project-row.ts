import type { SchedulerProjectRow } from '../../model/scheduler-project';

type DbSchedulerProjectRow = {
  id: string;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
};

/**
 * Maps a Postgres row to SchedulerProjectRow.
 */
export const mapSchedulerProjectRow = (row: DbSchedulerProjectRow): SchedulerProjectRow => ({
  id: row.id,
  name: row.name,
  createdAt:
    row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  updatedAt:
    row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
});
