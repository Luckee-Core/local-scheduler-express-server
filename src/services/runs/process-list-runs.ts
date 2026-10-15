import type { Pool } from 'pg';
import { getSchedulerRunById, listSchedulerRuns } from '../../data/scheduler_runs';

/**
 * Lists scheduler run history.
 */
export const processListRuns = async (pool: Pool, limit?: number) =>
  listSchedulerRuns(pool, limit ?? 100);

/**
 * Returns one run by id.
 */
export const processGetRun = async (pool: Pool, runId: string) =>
  getSchedulerRunById(pool, runId);
