import type { TaskSchedule } from '../../model/scheduled-task';
import { isOncePerWindowInterval } from './schedule-window';
import { scheduleWeekdayToCron } from './schedule-weekday';

/**
 * Builds a 5-field node-cron expression (minute hour dom month dow).
 * node-cron prepends seconds only for 5-field expressions; 6-field expressions
 * treat the first token as seconds — avoid six-field patterns or jobs fire every minute.
 */
export const buildCronExpression = (schedule: TaskSchedule): string | null => {
  const cronDays = [...new Set(schedule.weekdays.map(scheduleWeekdayToCron))]
    .sort((a, b) => a - b)
    .join(',');
  if (!cronDays) {
    return null;
  }

  if (schedule.kind === 'daily') {
    if (
      schedule.hour < 0 ||
      schedule.hour > 23 ||
      schedule.minute < 0 ||
      schedule.minute > 59
    ) {
      return null;
    }
    return `${schedule.minute} ${schedule.hour} * * ${cronDays}`;
  }

  const { intervalMinutes, hourStart, hourEnd } = schedule;
  if (hourEnd <= hourStart) {
    return null;
  }

  const lastHour = hourEnd - 1;
  const hourPart = lastHour === hourStart ? `${hourStart}` : `${hourStart}-${lastHour}`;

  if (isOncePerWindowInterval(schedule)) {
    return `0 ${hourStart} * * ${cronDays}`;
  }

  if (intervalMinutes >= 60) {
    const everyHours = Math.floor(intervalMinutes / 60);
    if (everyHours < 1) {
      return null;
    }

    let hourField = hourPart;
    if (everyHours > 1 && lastHour > hourStart) {
      hourField = `${hourStart}-${lastHour}/${everyHours}`;
    }

    return `0 ${hourField} * * ${cronDays}`;
  }

  if (intervalMinutes < 1) {
    return null;
  }

  return `*/${intervalMinutes} ${hourPart} * * ${cronDays}`;
};
