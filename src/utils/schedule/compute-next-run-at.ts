import { DateTime } from 'luxon';
import type { TaskSchedule } from '../../model/scheduled-task';
import { isScheduleWeekday } from './schedule-weekday';

/**
 * Computes the next run ISO timestamp for an interval schedule (approximate).
 */
export const computeNextRunAt = (
  schedule: TaskSchedule,
  from: DateTime = DateTime.now(),
): string | null => {
  const zone = schedule.timezone || 'America/New_York';
  let cursor = from.setZone(zone);

  for (let i = 0; i < 7 * 24 * 4; i += 1) {
    const hour = cursor.hour;
    const inWeekday = isScheduleWeekday(schedule.weekdays, cursor);
    const inHours = hour >= schedule.hourStart && hour < schedule.hourEnd;

    if (inWeekday && inHours) {
      const minutesPastInterval =
        (cursor.hour * 60 + cursor.minute) % schedule.intervalMinutes;
      if (minutesPastInterval === 0 && cursor >= from.setZone(zone)) {
        return cursor.toUTC().toISO();
      }
      const addMinutes = schedule.intervalMinutes - minutesPastInterval;
      const candidate = cursor.plus({ minutes: addMinutes });
      if (
        isScheduleWeekday(schedule.weekdays, candidate) &&
        candidate.hour >= schedule.hourStart &&
        candidate.hour < schedule.hourEnd
      ) {
        return candidate.toUTC().toISO();
      }
    }

    cursor = cursor.plus({ minutes: schedule.intervalMinutes });
  }

  return null;
};
