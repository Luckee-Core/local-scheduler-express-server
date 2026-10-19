/**
 * Scheduler business (product) catalog.
 */

export type SchedulerProjectRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type MergedSchedulerProject = {
  id: string;
  name: string;
};

export type UpsertSchedulerProjectInput = {
  id: string;
  name: string;
};
