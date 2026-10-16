import type { IntervalTaskSchedule, TaskSchedule } from '../../model/scheduled-task';

/**
 * True when an interval schedule should fire at most once per window (e.g. once each morning).
 */
export const isOncePerWindowInterval = (schedule: IntervalTaskSchedule): boolean => {
  const windowMinutes = (schedule.hourEnd - schedule.hourStart) * 60;
  return schedule.intervalMinutes >= windowMinutes;
};

export const getScheduleWindowMinutes = (schedule: TaskSchedule): number | null => {
  if (schedule.kind === 'daily') {
    return null;
  }
  if (schedule.hourEnd <= schedule.hourStart) {
    return null;
  }
  return (schedule.hourEnd - schedule.hourStart) * 60;
};
