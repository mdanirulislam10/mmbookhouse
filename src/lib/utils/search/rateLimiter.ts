/**
 * Module 5 - Task 44: IP-based Rate Limiting & Bot Protection
 * Enforces max 60 live search requests per minute per IP address.
 */

interface RateLimitRecord {
  timestamps: number[];
  lastCleanup: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

// In-memory sliding window IP store
const ipStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes
let lastGlobalCleanup = Date.now();
const GLOBAL_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupStaleRecords(now: number) {
  if (now - lastGlobalCleanup < GLOBAL_CLEANUP_INTERVAL_MS) return;
  lastGlobalCleanup = now;

  for (const [ip, record] of ipStore.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (validTimestamps.length === 0) {
      ipStore.delete(ip);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

export function checkRateLimit(clientIp: string): RateLimitResult {
  const now = Date.now();
  cleanupStaleRecords(now);

  const ipKey = clientIp.trim() || '127.0.0.1';
  let record = ipStore.get(ipKey);

  if (!record) {
    record = { timestamps: [now], lastCleanup: now };
    ipStore.set(ipKey, record);
    return {
      allowed: true,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
      retryAfter: 0,
    };
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + RATE_LIMIT_WINDOW_MS;
    const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      allowed: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: 0,
      resetTime,
      retryAfter,
    };
  }

  record.timestamps.push(now);
  const remaining = MAX_REQUESTS_PER_WINDOW - record.timestamps.length;
  const oldest = record.timestamps[0];
  const resetTime = oldest + RATE_LIMIT_WINDOW_MS;

  return {
    allowed: true,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining,
    resetTime,
    retryAfter: 0,
  };
}

export function extractClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',');
    if (ips.length > 0 && ips[0].trim()) {
      return ips[0].trim();
    }
  }

  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  return '127.0.0.1';
}

export function resetRateLimiter(): void {
  ipStore.clear();
}
