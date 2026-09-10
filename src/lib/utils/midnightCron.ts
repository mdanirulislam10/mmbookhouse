/**
 * Task 50: Midnight Cron & Time Automation Utilities
 * All operations are strictly locked to Indian Standard Time (IST, UTC+05:30).
 * Integrates server clock drift offset (Task 30) and timezone-independent math.
 */

import { getSyncedCurrentTime } from './serverTime';

export const IST_OFFSET_MS = 330 * 60 * 1000; // 5 hours 30 minutes in milliseconds
export const MS_PER_DAY = 86400000; // 24 hours in milliseconds

/**
 * Returns the current synchronized timestamp shifted to IST epoch milliseconds
 */
export function getSyncedISTTimestamp(): number {
  return getSyncedCurrentTime() + IST_OFFSET_MS;
}

/**
 * Returns current Date object shifted to IST
 */
export function getCurrentISTDate(): Date {
  return new Date(getSyncedISTTimestamp());
}

/**
 * Pure mathematical, timezone-independent calculation of milliseconds
 * remaining until next 00:00:00 (Midnight IST).
 */
export function getMillisecondsUntilMidnightIST(): number {
  const istTimestamp = getSyncedISTTimestamp();
  const msElapsedTodayIST = ((istTimestamp % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
  const msRemaining = MS_PER_DAY - msElapsedTodayIST;

  return msRemaining > 0 ? msRemaining : MS_PER_DAY;
}

/**
 * Calculates seconds remaining until next IST Midnight
 */
export function getSecondsUntilMidnightIST(): number {
  return Math.floor(getMillisecondsUntilMidnightIST() / 1000);
}

/**
 * Formats IST ISO string representation (YYYY-MM-DDTHH:mm:ss.sss+05:30)
 */
export function getISTDateString(): string {
  const ist = getCurrentISTDate();
  // ist.toISOString() outputs in UTC format (e.g. 2026-09-10T00:00:00.000Z)
  // because we added IST_OFFSET_MS, the UTC digits correspond to IST digits.
  return ist.toISOString().replace('Z', '+05:30');
}
