/**
 * Deployable Express repo per scheduler business.
 */

export type SchedulerExecutionType = 'local' | 'production';

export type SchedulerProjectRepoRow = {
  id: string;
  schedulerProjectId: string;
  expressRepoName: string;
  executionType: SchedulerExecutionType;
  productionBaseUrl: string | null;
  defaultPort: number | null;
  healthPath: string;
  createdAt: string;
  updatedAt: string;
};

export type MergedSchedulerProjectRepo = {
  id: string;
  schedulerProjectId: string;
  expressRepoName: string;
  executionType: SchedulerExecutionType;
  productionBaseUrl: string | null;
  healthPath: string;
};

export type UpsertSchedulerProjectRepoInput = {
  id: string;
  schedulerProjectId: string;
  expressRepoName: string;
  executionType: SchedulerExecutionType;
  productionBaseUrl?: string | null;
  defaultPort?: number | null;
  healthPath?: string;
};
