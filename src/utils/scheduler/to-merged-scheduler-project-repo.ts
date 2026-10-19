import type {
  MergedSchedulerProjectRepo,
  SchedulerProjectRepoRow,
} from '../../model/scheduler-project-repo';

/**
 * API subset of a scheduler project repo row.
 */
export const toMergedSchedulerProjectRepo = (
  row: SchedulerProjectRepoRow,
): MergedSchedulerProjectRepo => ({
  id: row.id,
  schedulerProjectId: row.schedulerProjectId,
  expressRepoName: row.expressRepoName,
  executionType: row.executionType,
  productionBaseUrl: row.productionBaseUrl,
  healthPath: row.healthPath,
});
