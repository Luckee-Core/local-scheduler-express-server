import type { TaskSchedule } from '../../model/scheduled-task';
import { scheduleWeekdayToCron } from './schedule-weekday';

/**
 * Builds a node-cron expression that only fires inside the task's weekday + hour window.
 * hourEnd is exclusive (same as isWithinScheduleWindow).
 */
export const buildCronExpression = (schedule: TaskSchedule): string | null => {
  const { intervalMinutes, hourStart, hourEnd, weekdays } = schedule;

  if (hourEnd <= hourStart) {
    return null;
  }

  const cronDays = [...new Set(weekdays.map(scheduleWeekdayToCron))]
    .sort((a, b) => a - b)
    .join(',');
  if (!cronDays) {
    return null;
  }

  const hourRange = `${hourStart}-${hourEnd - 1}`;

  if (intervalMinutes >= 60) {
    const everyHours = Math.floor(intervalMinutes / 60);
    if (everyHours < 1) {
      return null;
    }
    return `0 */${everyHours} ${hourRange} * * ${cronDays}`;
  }

  if (intervalMinutes < 1) {
    return null;
  }

  return `*/${intervalMinutes} ${hourRange} * * ${cronDays}`;
};
