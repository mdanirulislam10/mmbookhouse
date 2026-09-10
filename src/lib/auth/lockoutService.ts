'use client';

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  remainingMinutes: number;
  lockExpiry: number;
  message?: string;
}

const LOCKOUT_STORAGE_KEY = 'mm_account_lockout_records';
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes (Task 29)

let memoryLockoutRecords: Record<string, number> = {};

/**
 * Task 29: 5-Failed Attempts Brute Force Protection & 15-Minute Lockout Engine
 * Blocks brute force OTP guessing and dictionary attacks by locking the phone/IP for 15 minutes.
 */
export const lockoutService = {
  /**
   * Load lockout records
   */
  getLockoutRecords(): Record<string, number> {
    if (typeof window === 'undefined') return memoryLockoutRecords;
    try {
      const data = localStorage.getItem(LOCKOUT_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return memoryLockoutRecords;
    }
  },

  /**
   * Save lockout records
   */
  saveLockoutRecords(records: Record<string, number>): void {
    if (typeof window === 'undefined') {
      memoryLockoutRecords = records;
      return;
    }
    try {
      localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(records));
    } catch {
      memoryLockoutRecords = records;
    }
  },

  /**
   * Apply a 15-minute lockout to a phone number or identifier
   */
  lockAccount(phoneNumber: string): LockoutStatus {
    const records = this.getLockoutRecords();
    const expiry = Date.now() + LOCKOUT_DURATION_MS;
    records[phoneNumber] = expiry;
    this.saveLockoutRecords(records);

    return {
      isLocked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      remainingMinutes: 15,
      lockExpiry: expiry,
      message: 'পরপর ৫ বার ভুল ওটিপি দেওয়ার কারণে আপনার অ্যাকাউন্ট সাময়িকভাবে ১৫ মিনিটের জন্য স্থগিত করা হয়েছে।',
    };
  },

  /**
   * Check if a phone number is currently in a 15-minute lockout
   */
  checkLockout(phoneNumber: string): LockoutStatus {
    const records = this.getLockoutRecords();
    const expiry = records[phoneNumber];

    if (!expiry) {
      return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0, lockExpiry: 0 };
    }

    const now = Date.now();
    if (now >= expiry) {
      // 15-minute lock has expired: clean up
      delete records[phoneNumber];
      this.saveLockoutRecords(records);
      return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0, lockExpiry: 0 };
    }

    // Still locked
    const remainingMs = expiry - now;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    return {
      isLocked: true,
      remainingSeconds,
      remainingMinutes,
      lockExpiry: expiry,
      message: `নিরাপত্তাজনিত কারণে আপনার অ্যাকাউন্ট আরও ${remainingMinutes} মিনিট স্থগিত থাকবে।`,
    };
  },

  /**
   * Unlock an account immediately (Admin / Testing support)
   */
  unlockAccount(phoneNumber: string): void {
    const records = this.getLockoutRecords();
    delete records[phoneNumber];
    this.saveLockoutRecords(records);
  },
};
