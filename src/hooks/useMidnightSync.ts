'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMillisecondsUntilMidnightIST,
  getSecondsUntilMidnightIST,
} from '@/lib/utils/midnightCron';

import { syncServerTime } from '@/lib/utils/serverTime';

interface MidnightSyncResult {
  secondsUntilMidnight: number;
  formattedCountdown: string; // HH:MM:SS
  triggerManualSync: () => void;
}

/**
 * Task 50: Client-Side Midnight Auto-Switching Hook
 * Automatically notifies components when IST Midnight occurs
 * so new daily deals and banners load dynamically without a full page refresh.
 */
export function useMidnightSync(onMidnightReached?: () => void): MidnightSyncResult {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(getSecondsUntilMidnightIST());

  const triggerManualSync = useCallback(() => {
    onMidnightReached?.();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mm_midnight_deal_refresh'));
    }
  }, [onMidnightReached]);

  useEffect(() => {
    // 0. Sync server clock offset
    syncServerTime().then(() => {
      setSecondsRemaining(getSecondsUntilMidnightIST());
    });

    // 1. Tick every second for live countdown
    const interval = setInterval(() => {
      const remaining = getSecondsUntilMidnightIST();
      setSecondsRemaining(remaining);

      // Trigger if we crossed exactly midnight (00:00:00)
      if (remaining <= 0) {
        triggerManualSync();
      }
    }, 1000);

    // 2. Exact timeout precisely aligned to midnight ms
    const msUntilMidnight = getMillisecondsUntilMidnightIST();
    const timeout = setTimeout(() => {
      triggerManualSync();
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [triggerManualSync]);

  // Format HH:MM:SS
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const formattedCountdown = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    secondsUntilMidnight: secondsRemaining,
    formattedCountdown,
    triggerManualSync,
  };
}
