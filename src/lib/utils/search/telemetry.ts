/**
 * Module 5: Search Performance Telemetry & Slow Query Monitoring
 * 
 * - Task 49: Slow query alert and telemetry monitoring (> 500ms execution warning)
 */

export interface SlowQueryRecord {
  query: string;
  category: string;
  durationMs: number;
  clientIp?: string;
  timestamp: number;
}

export interface SearchTelemetryMetrics {
  totalSearches: number;
  slowSearchesCount: number;
  averageExecutionTimeMs: number;
  maxExecutionTimeMs: number;
  slowQueryLog: SlowQueryRecord[];
}

const SLOW_QUERY_THRESHOLD_MS = 500;
const MAX_SLOW_LOG_SIZE = 50;

let totalSearches = 0;
let slowSearchesCount = 0;
let totalExecutionTimeMs = 0;
let maxExecutionTimeMs = 0;
const slowQueryLog: SlowQueryRecord[] = [];

/**
 * Records execution time for a search query and triggers an alert if > 500ms.
 */
export function recordSearchTiming(
  query: string,
  durationMs: number,
  category = 'all',
  clientIp?: string
): boolean {
  totalSearches++;
  totalExecutionTimeMs += durationMs;
  if (durationMs > maxExecutionTimeMs) {
    maxExecutionTimeMs = durationMs;
  }

  const isSlow = durationMs > SLOW_QUERY_THRESHOLD_MS;

  if (isSlow) {
    slowSearchesCount++;
    const record: SlowQueryRecord = {
      query,
      category,
      durationMs,
      clientIp: clientIp ? anonymizeIp(clientIp) : undefined,
      timestamp: Date.now(),
    };

    slowQueryLog.unshift(record);
    if (slowQueryLog.length > MAX_SLOW_LOG_SIZE) {
      slowQueryLog.pop();
    }

    // Task 49: Structured telemetry warning log
    console.warn(
      `[SEARCH TELEMETRY WARNING] Slow query detected (>500ms): query="${query}", category="${category}", duration=${durationMs}ms`
    );
  }

  return isSlow;
}

/**
 * Returns current performance telemetry metrics.
 */
export function getSearchTelemetryMetrics(): SearchTelemetryMetrics {
  const avg = totalSearches > 0 ? Math.round(totalExecutionTimeMs / totalSearches) : 0;
  return {
    totalSearches,
    slowSearchesCount,
    averageExecutionTimeMs: avg,
    maxExecutionTimeMs,
    slowQueryLog: [...slowQueryLog],
  };
}

/**
 * Reset telemetry state (primarily for automated testing).
 */
export function resetSearchTelemetry(): void {
  totalSearches = 0;
  slowSearchesCount = 0;
  totalExecutionTimeMs = 0;
  maxExecutionTimeMs = 0;
  slowQueryLog.length = 0;
}

function anonymizeIp(ip: string): string {
  if (!ip) return '';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : ip;
  }
  return ip.substring(0, 8) + '...';
}
