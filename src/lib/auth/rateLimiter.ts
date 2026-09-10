'use client';

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: 'cooldown_active' | 'hourly_limit_exceeded' | 'ip_limit_exceeded';
  remainingCooldownSeconds: number;
  remainingHourlyAttempts: number;
  retryAfterMinutes: number;
  errorMessage?: string;
}

interface PhoneRateLimitRecord {
  lastRequestTime: number;
  timestamps: number[]; // Requests in the last 1 hour
}

interface IpRateLimitRecord {
  timestamps: number[]; // Requests in the last 10 minutes
}

const PHONE_LIMITS_STORAGE_KEY = 'mm_rate_limits_phone';
const IP_LIMITS_STORAGE_KEY = 'mm_rate_limits_ip';

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

const MAX_HOURLY_ATTEMPTS_PER_PHONE = 3; // Task 27: 1 hour maximum 3 OTPs
const MAX_IP_ATTEMPTS_PER_WINDOW = 5; // Prevent bot SMS bombing

let memoryPhoneRecords: Record<string, PhoneRateLimitRecord> = {};
let memoryIpRecords: Record<string, IpRateLimitRecord> = {};

/**
 * Task 27: Phone & IP-based Strict Rate Limiter
 * Protects against OTP spamming, SMS bombing, and billing draining:
 * - 1 OTP per 1 minute cooldown per phone
 * - Maximum 3 OTPs per 1 hour window per phone
 * - Maximum 5 OTPs per 10 minutes per IP/client
 */
export const rateLimiter = {
  /**
   * Load phone records from storage
   */
  getPhoneRecords(): Record<string, PhoneRateLimitRecord> {
    if (typeof window === 'undefined') return memoryPhoneRecords;
    try {
      const raw = localStorage.getItem(PHONE_LIMITS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return memoryPhoneRecords;
    }
  },

  /**
   * Save phone records to storage
   */
  savePhoneRecords(records: Record<string, PhoneRateLimitRecord>): void {
    if (typeof window === 'undefined') {
      memoryPhoneRecords = records;
      return;
    }
    try {
      localStorage.setItem(PHONE_LIMITS_STORAGE_KEY, JSON.stringify(records));
    } catch {
      memoryPhoneRecords = records;
    }
  },

  /**
   * Load IP/client records
   */
  getIpRecords(): Record<string, IpRateLimitRecord> {
    if (typeof window === 'undefined') return memoryIpRecords;
    try {
      const raw = localStorage.getItem(IP_LIMITS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return memoryIpRecords;
    }
  },

  /**
   * Save IP records
   */
  saveIpRecords(records: Record<string, IpRateLimitRecord>): void {
    if (typeof window === 'undefined') {
      memoryIpRecords = records;
      return;
    }
    try {
      localStorage.setItem(IP_LIMITS_STORAGE_KEY, JSON.stringify(records));
    } catch {
      memoryIpRecords = records;
    }
  },

  /**
   * Check if a phone number and client IP are allowed to request an OTP
   */
  checkRateLimit(phoneNumber: string, clientIdentifier = 'default_ip'): RateLimitCheckResult {
    const now = Date.now();
    const phoneRecords = this.getPhoneRecords();
    const ipRecords = this.getIpRecords();

    const phoneRecord = phoneRecords[phoneNumber] || {
      lastRequestTime: 0,
      timestamps: [],
    };

    const ipRecord = ipRecords[clientIdentifier] || {
      timestamps: [],
    };

    // Filter out timestamps older than 1 hour for phone
    const recentPhoneTimestamps = phoneRecord.timestamps.filter((ts) => now - ts < ONE_HOUR_MS);

    // Filter out timestamps older than 10 mins for IP
    const recentIpTimestamps = ipRecord.timestamps.filter((ts) => now - ts < TEN_MINUTES_MS);

    // 1. Rule 1: 1 Minute Cooldown per Phone (Task 27)
    const timeSinceLast = now - phoneRecord.lastRequestTime;
    if (phoneRecord.lastRequestTime > 0 && timeSinceLast < ONE_MINUTE_MS) {
      const remainingSec = Math.ceil((ONE_MINUTE_MS - timeSinceLast) / 1000);
      return {
        allowed: false,
        reason: 'cooldown_active',
        remainingCooldownSeconds: remainingSec,
        remainingHourlyAttempts: Math.max(0, MAX_HOURLY_ATTEMPTS_PER_PHONE - recentPhoneTimestamps.length),
        retryAfterMinutes: 1,
        errorMessage: `অতিরিক্ত ওটিপি অনুরোধ প্রতিরোধে অনুগ্রহ করে ${remainingSec} সেকেন্ড অপেক্ষা করুন।`,
      };
    }

    // 2. Rule 2: Max 3 OTPs per 1 Hour per Phone (Task 27)
    if (recentPhoneTimestamps.length >= MAX_HOURLY_ATTEMPTS_PER_PHONE) {
      const oldestInWindow = recentPhoneTimestamps[0];
      const timeUntilFree = ONE_HOUR_MS - (now - oldestInWindow);
      const minutesLeft = Math.max(1, Math.ceil(timeUntilFree / (60 * 1000)));

      return {
        allowed: false,
        reason: 'hourly_limit_exceeded',
        remainingCooldownSeconds: 0,
        remainingHourlyAttempts: 0,
        retryAfterMinutes: minutesLeft,
        errorMessage: `আপনি এই ঘণ্টায় সর্বোচ্চ ৩টি ওটিপি অনুরোধ করেছেন। নিরাপত্তার স্বার্থে অনুগ্রহ করে ${minutesLeft} মিনিট পর পুনরায় চেষ্টা করুন।`,
      };
    }

    // 3. Rule 3: Max 5 OTPs per IP per 10 minutes (Anti-SMS Bombing)
    if (recentIpTimestamps.length >= MAX_IP_ATTEMPTS_PER_WINDOW) {
      return {
        allowed: false,
        reason: 'ip_limit_exceeded',
        remainingCooldownSeconds: 0,
        remainingHourlyAttempts: 0,
        retryAfterMinutes: 10,
        errorMessage: 'আপনার ডিভাইস/আইপি থেকে অতিরিক্ত অনুরোধ এসেছে। অনুগ্রহ করে ১০ মিনিট পর চেষ্টা করুন।',
      };
    }

    // Allowed!
    return {
      allowed: true,
      remainingCooldownSeconds: 0,
      remainingHourlyAttempts: Math.max(0, MAX_HOURLY_ATTEMPTS_PER_PHONE - recentPhoneTimestamps.length),
      retryAfterMinutes: 0,
    };
  },

  /**
   * Record a successfully sent OTP request
   */
  recordAttempt(phoneNumber: string, clientIdentifier = 'default_ip'): void {
    const now = Date.now();
    const phoneRecords = this.getPhoneRecords();
    const ipRecords = this.getIpRecords();

    // Update phone record
    const phoneRecord = phoneRecords[phoneNumber] || {
      lastRequestTime: 0,
      timestamps: [],
    };
    const updatedPhoneTimestamps = [...phoneRecord.timestamps.filter((ts) => now - ts < ONE_HOUR_MS), now];
    phoneRecords[phoneNumber] = {
      lastRequestTime: now,
      timestamps: updatedPhoneTimestamps,
    };
    this.savePhoneRecords(phoneRecords);

    // Update IP record
    const ipRecord = ipRecords[clientIdentifier] || {
      timestamps: [],
    };
    const updatedIpTimestamps = [...ipRecord.timestamps.filter((ts) => now - ts < TEN_MINUTES_MS), now];
    ipRecords[clientIdentifier] = {
      timestamps: updatedIpTimestamps,
    };
    this.saveIpRecords(ipRecords);
  },

  /**
   * Reset rate limits for testing or admin manual unblock
   */
  resetLimits(phoneNumber?: string): void {
    if (phoneNumber) {
      const records = this.getPhoneRecords();
      delete records[phoneNumber];
      this.savePhoneRecords(records);
    } else {
      memoryPhoneRecords = {};
      memoryIpRecords = {};
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(PHONE_LIMITS_STORAGE_KEY);
          localStorage.removeItem(IP_LIMITS_STORAGE_KEY);
        } catch {
          // Ignore
        }
      }
    }
  },
};
