import { DateTime } from 'luxon';
import type { TaskSchedule } from '../../model/scheduled-task';
import { isOncePerWindowInterval } from '../schedule/schedule-window';
import { isScheduleWeekday } from '../schedule/schedule-weekday';

/**
 * True when now falls inside the task schedule window (weekday + time in task timezone).
 */
export const isWithinScheduleWindow = (
  schedule: TaskSchedule,
  now: DateTime = DateTime.now(),
): boolean => {
  const zoned = now.setZone(schedule.timezone || 'America/New_York');

  if (schedule.kind === 'daily') {
    return (
      isScheduleWeekday(schedule.weekdays, zoned) &&
      zoned.hour === schedule.hour &&
      zoned.minute === schedule.minute
    );
  }

  const hour = zoned.hour;
  const inHours = hour >= schedule.hourStart && hour < schedule.hourEnd;

  if (!isScheduleWeekday(schedule.weekdays, zoned) || !inHours) {
    return false;
  }

  if (isOncePerWindowInterval(schedule)) {
    return zoned.minute === 0;
  }

  return true;
};
