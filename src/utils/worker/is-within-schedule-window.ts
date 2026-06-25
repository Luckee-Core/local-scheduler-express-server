import { DateTime } from 'luxon';
import type { TaskSchedule } from '../../data/task-registry/types';

/**
 * True when now falls inside the task schedule window (weekday + hour range in task timezone).
 */
export const isWithinScheduleWindow = (
  schedule: TaskSchedule,
  now: DateTime = DateTime.now(),
): boolean => {
  const zoned = now.setZone(schedule.timezone || 'America/New_York');
  const weekday = zoned.weekday;
  const hour = zoned.hour;
  return (
    schedule.weekdays.includes(weekday) &&
    hour >= schedule.hourStart &&
    hour < schedule.hourEnd
  );
};
