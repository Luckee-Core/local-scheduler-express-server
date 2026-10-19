import type { ScheduledTaskLifecycle } from '../../../model/scheduled-task';
import type { SchedulerProjectRepoRow } from '../../../model/scheduler-project-repo';

/**
 * Ensures lifecycle matches scheduler repo execution type.
 */
export const validateTaskLifecycleForRepo = (
  repo: SchedulerProjectRepoRow,
  lifecycle: ScheduledTaskLifecycle,
): string | null => {
  if (repo.executionType === 'production' && lifecycle !== 'call_only') {
    return 'production scheduler repos require lifecycle call_only';
  }
  if (repo.executionType === 'local' && lifecycle !== 'start_if_needed_stop_if_started') {
    return 'local scheduler repos require lifecycle start_if_needed_stop_if_started';
  }
  return null;
};
