import { DateTime } from 'luxon';
import type { TaskSchedule } from '../../model/scheduled-task';
import { isOncePerWindowInterval } from './schedule-window';
import { isScheduleWeekday } from './schedule-weekday';

/**
 * Computes the next run ISO timestamp for a task schedule (approximate).
 */
export const computeNextRunAt = (
  schedule: TaskSchedule,
  from: DateTime = DateTime.now(),
): string | null => {
  const zone = schedule.timezone || 'America/New_York';
  let cursor = from.setZone(zone);

  if (schedule.kind === 'daily') {
    for (let i = 0; i < 14; i += 1) {
      const candidate = cursor.set({
        hour: schedule.hour,
        minute: schedule.minute,
        second: 0,
        millisecond: 0,
      });
      if (isScheduleWeekday(schedule.weekdays, candidate) && candidate >= from.setZone(zone)) {
        return candidate.toUTC().toISO();
      }
      cursor = cursor.plus({ days: 1 }).startOf('day');
    }
    return null;
  }

  for (let i = 0; i < 7 * 24 * 4; i += 1) {
    const hour = cursor.hour;
    const inWeekday = isScheduleWeekday(schedule.weekdays, cursor);
    const inHours = hour >= schedule.hourStart && hour < schedule.hourEnd;

    if (inWeekday && inHours) {
      if (isOncePerWindowInterval(schedule)) {
        const candidate = cursor.set({
          hour: schedule.hourStart,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        if (candidate >= from.setZone(zone)) {
          return candidate.toUTC().toISO();
        }
      } else {
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
    }

    cursor = cursor.plus({ minutes: schedule.intervalMinutes });
  }

  return null;
};
