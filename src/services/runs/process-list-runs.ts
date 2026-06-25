import { getRunById, listRuns } from '../../data/scheduler-run';

/**
 * Lists scheduler run history.
 */
export const processListRuns = (limit?: number) => listRuns(limit ?? 100);

/**
 * Returns one run by id.
 */
export const processGetRun = (runId: string) => getRunById(runId);
