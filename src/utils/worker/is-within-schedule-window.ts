import { DateTime } from 'luxon';
import type { TaskSchedule } from '../../model/scheduled-task';
import { isScheduleWeekday } from '../schedule/schedule-weekday';

/**
 * True when now falls inside the task schedule window (weekday + hour range in task timezone).
 */
export const isWithinScheduleWindow = (
  schedule: TaskSchedule,
  now: DateTime = DateTime.now(),
): boolean => {
  const zoned = now.setZone(schedule.timezone || 'America/New_York');
  const hour = zoned.hour;
  return (
    isScheduleWeekday(schedule.weekdays, zoned) &&
    hour >= schedule.hourStart &&
    hour < schedule.hourEnd
  );
};
