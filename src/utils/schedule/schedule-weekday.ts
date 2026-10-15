import type { DateTime } from 'luxon';

/**
 * Maps stored weekday (0=Sun JS-style, 1–6 Mon–Sat, 7=Sun Luxon-style) to cron DOW (0=Sun … 6=Sat).
 */
export const scheduleWeekdayToCron = (day: number): number => (day === 0 || day === 7 ? 0 : day);

/**
 * True when the zoned instant's weekday is included in schedule.weekdays.
 */
export const isScheduleWeekday = (weekdays: number[], zoned: DateTime): boolean => {
  const luxonWeekday = zoned.weekday;
  return weekdays.some((day) => {
    if (day === 0 || day === 7) {
      return luxonWeekday === 7;
    }
    return day === luxonWeekday;
  });
};
