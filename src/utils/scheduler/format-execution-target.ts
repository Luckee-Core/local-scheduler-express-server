import type { SchedulerProjectRepoRow } from '../../model/scheduler-project-repo';

/**
 * Human-readable execution target for dashboard UI.
 */
export const formatExecutionTarget = (
  repo: SchedulerProjectRepoRow,
  port: number,
): string => {
  if (repo.executionType === 'production' && repo.productionBaseUrl) {
    try {
      const host = new URL(repo.productionBaseUrl).host;
      return `production · ${host}`;
    } catch {
      return `production · ${repo.productionBaseUrl}`;
    }
  }
  return `local · 127.0.0.1:${port}`;
};
