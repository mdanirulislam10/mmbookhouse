'use client';

import { DeviceSession } from '@/types/auth';
import { sessionPersistence } from './sessionPersistence';

const SESSIONS_STORAGE_KEY_PREFIX = 'mm_device_sessions_';
let memoryUserSessions: Record<string, DeviceSession[]> = {};

export const multiDeviceSessionService = {
  /**
   * Get all active logged-in device sessions for a user
   */
  getUserSessions(userId: string): DeviceSession[] {
    if (!userId) return [];

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${SESSIONS_STORAGE_KEY_PREFIX}${userId}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore
      }
    } else if (memoryUserSessions[userId]) {
      return memoryUserSessions[userId];
    }

    // Default simulated multi-device list (Task 25)
    const initialSessions: DeviceSession[] = [
      {
        id: 'sess-current-laptop',
        deviceName: 'Windows PC (Chrome ব্রাউজার)',
        deviceType: 'desktop',
        browser: 'Google Chrome v131',
        location: 'ইংলিশ বাজার, মালদা, পশ্চিমবঙ্গ',
        ipAddress: '103.21.144.***',
        lastActive: 'এইমাত্র সক্রিয়',
        isCurrentDevice: true,
      },
      {
        id: 'sess-mobile-android',
        deviceName: 'Xiaomi Redmi Note 12 (মোবাইল ব্রাউজার)',
        deviceType: 'mobile',
        browser: 'Chrome Mobile v128',
        location: 'রতুয়া, মালদা, পশ্চিমবঙ্গ',
        ipAddress: '157.34.89.***',
        lastActive: '৩ ঘণ্টা আগে',
        isCurrentDevice: false,
      },
      {
        id: 'sess-tablet-ipad',
        deviceName: 'Apple iPad Air (Safari ব্রাউজার)',
        deviceType: 'tablet',
        browser: 'Safari Mobile v17',
        location: 'কলকাতা, পশ্চিমবঙ্গ',
        ipAddress: '49.36.12.***',
        lastActive: 'গতকাল দুপুর ২:৩০',
        isCurrentDevice: false,
      },
    ];

    memoryUserSessions[userId] = initialSessions;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${SESSIONS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(initialSessions));
      } catch {}
    }

    return initialSessions;
  },

  /**
   * Alias for getUserSessions
   */
  getDeviceSessions(userId: string): DeviceSession[] {
    return this.getUserSessions(userId);
  },

  /**
   * Terminate a specific device session
   */
  terminateSession(userId: string, sessionId: string): DeviceSession[] {
    const currentSessions = this.getUserSessions(userId);
    const updated = currentSessions.filter((s) => s.id !== sessionId);

    memoryUserSessions[userId] = updated;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${SESSIONS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
      } catch {}
    }

    return updated;
  },

  /**
   * Alias for terminateSession
   */
  revokeSession(userId: string, sessionId: string): DeviceSession[] {
    return this.terminateSession(userId, sessionId);
  },

  /**
   * Terminate all other sessions, keeping only the current device active
   */
  terminateAllOtherSessions(userId: string): DeviceSession[] {
    const currentSessions = this.getUserSessions(userId);
    const onlyCurrent = currentSessions.filter((s) => s.isCurrentDevice);

    memoryUserSessions[userId] = onlyCurrent;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${SESSIONS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(onlyCurrent));
      } catch {}
    }

    return onlyCurrent;
  },

  /**
   * Alias for terminateAllOtherSessions
   */
  revokeAllOtherSessions(userId: string): DeviceSession[] {
    return this.terminateAllOtherSessions(userId);
  },

  /**
   * Terminate all sessions globally (including current device)
   */
  terminateAllSessions(userId: string): void {
    delete memoryUserSessions[userId];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${SESSIONS_STORAGE_KEY_PREFIX}${userId}`);
      } catch {}
    }
    sessionPersistence.terminateSession(userId);
  },
};
