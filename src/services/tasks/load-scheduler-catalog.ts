import type { Pool } from 'pg';
import type { SchedulerProjectRow } from '../../model/scheduler-project';
import type { SchedulerProjectRepoRow } from '../../model/scheduler-project-repo';
import { listSchedulerProjects } from '../../data/scheduler_project';
import { listSchedulerProjectRepos } from '../../data/scheduler_project_repo';

export type SchedulerCatalogMaps = {
  projectsById: Map<string, SchedulerProjectRow>;
  reposById: Map<string, SchedulerProjectRepoRow>;
};

/**
 * Loads businesses and repos for task merge.
 */
export const loadSchedulerCatalogMaps = async (pool: Pool): Promise<SchedulerCatalogMaps> => {
  const [projects, repos] = await Promise.all([
    listSchedulerProjects(pool),
    listSchedulerProjectRepos(pool),
  ]);
  return {
    projectsById: new Map(projects.map((row) => [row.id, row])),
    reposById: new Map(repos.map((row) => [row.id, row])),
  };
};
