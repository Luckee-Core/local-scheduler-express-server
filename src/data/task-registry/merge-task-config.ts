import { DateTime } from 'luxon';
import type { MergedTask, SchedulerLocalFile, TaskRegistryEntry } from './types';

/**
 * Computes the next run ISO timestamp for an interval schedule (approximate).
 */
export const computeNextRunAt = (
  schedule: TaskRegistryEntry['schedule'],
  from: DateTime = DateTime.now(),
): string | null => {
  const zone = schedule.timezone || 'America/New_York';
  let cursor = from.setZone(zone);

  for (let i = 0; i < 7 * 24 * 4; i += 1) {
    const weekday = cursor.weekday;
    const hour = cursor.hour;
    const inWeekday = schedule.weekdays.includes(weekday);
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
        schedule.weekdays.includes(candidate.weekday) &&
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

/**
 * Pure merge of registry entry + local overrides into a MergedTask view.
 */
export const mergeTaskEntry = (
  entry: TaskRegistryEntry,
  local: SchedulerLocalFile,
  lastRunAt: string | null,
  lastRunStatus: string | null,
): MergedTask => {
  const workerLocal = local.workers?.[entry.workerProjectId];
  const taskLocal = local.tasks?.[entry.id];
  const enabled =
    taskLocal?.enabled !== undefined ? taskLocal.enabled : entry.enabledByDefault;

  return {
    ...entry,
    enabled,
    expressDir: workerLocal?.expressDir ?? null,
    port: workerLocal?.port ?? entry.worker.defaultPort,
    nvmSh: workerLocal?.nvmSh ?? null,
    nextRunAt: enabled ? computeNextRunAt(entry.schedule) : null,
    lastRunAt,
    lastRunStatus,
  };
};
