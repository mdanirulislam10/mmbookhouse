'use client';

import { useState, useEffect, useCallback } from 'react';
import { CountdownState, DealStatus } from '@/types/deal';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { getSyncedCurrentTime, syncServerTime, isClockSynced } from '@/lib/utils/serverTime';

interface UseDealCountdownOptions {
  startTime?: string;
  endTime: string;
  onStart?: () => void;
  onExpire?: () => void;
}

/**
 * Task 21, 28 & 30: Live Countdown Timer & Server-Synced FOMO Engine
 * Features:
 * - Client-server time sync with time-drift prevention (Task 30)
 * - Scheduled deals engine with 'upcoming', 'active', 'expired' states (Task 28)
 * - Hydration-safe initial state
 * - Strict interval cleanup to prevent memory leaks
 * - English and Bengali formatted representations
 * - Automatic start/expiry callbacks and manual simulation toggle
 */
export function useDealCountdown({ startTime, endTime, onStart, onExpire }: UseDealCountdownOptions) {
  const [isMounted, setIsMounted] = useState(false);
  const [forceExpired, setForceExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    if (forceExpired) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSecondsLeft: 0,
        isExpired: true,
        isUpcoming: false,
        status: 'expired' as DealStatus,
        prefixBn: 'অফার সমাপ্ত',
      };
    }

    const now = getSyncedCurrentTime();
    const startMs = startTime ? new Date(startTime).getTime() : 0;
    const endMs = new Date(endTime).getTime();

    // Upcoming deal state (Task 28)
    if (startTime && now < startMs) {
      const diffMs = startMs - now;
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return {
        hours,
        minutes,
        seconds,
        totalSecondsLeft: totalSeconds,
        isExpired: false,
        isUpcoming: true,
        status: 'upcoming' as DealStatus,
        prefixBn: 'শুরু হতে বাকি',
      };
    }

    // Expired deal state
    if (now >= endMs) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSecondsLeft: 0,
        isExpired: true,
        isUpcoming: false,
        status: 'expired' as DealStatus,
        prefixBn: 'অফার সমাপ্ত',
      };
    }

    // Active deal state
    const diffMs = endMs - now;
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      totalSecondsLeft: totalSeconds,
      isExpired: false,
      isUpcoming: false,
      status: 'active' as DealStatus,
      prefixBn: 'শেষ হতে বাকি',
    };
  }, [startTime, endTime, forceExpired]);

  const [state, setState] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSecondsLeft: 0,
    isExpired: false,
    isUpcoming: false,
    status: 'active' as DealStatus,
    prefixBn: 'বাকি সময়',
  });

  useEffect(() => {
    setIsMounted(true);

    // Initial background sync with server clock (Task 30)
    if (!isClockSynced()) {
      syncServerTime().then(() => {
        setState(calculateTimeLeft());
      });
    }

    const initial = calculateTimeLeft();
    setState(initial);

    let prevStatus = initial.status;

    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setState(updated);

      // Handle transitions between states
      if (prevStatus === 'upcoming' && updated.status === 'active') {
        onStart?.();
      }
      if (prevStatus !== 'expired' && updated.status === 'expired' && !forceExpired) {
        clearInterval(timer);
        onExpire?.();
      }
      prevStatus = updated.status;
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onStart, onExpire]);

  // Format with leading zero
  const pad = (n: number) => String(n).padStart(2, '0');

  const formattedHours = pad(state.hours);
  const formattedMinutes = pad(state.minutes);
  const formattedSeconds = pad(state.seconds);

  const formattedTime = `${formattedHours}h : ${formattedMinutes}m : ${formattedSeconds}s`;
  const formattedTimeBn = `${toBengaliNumerals(formattedHours)}ঘণ্টা : ${toBengaliNumerals(formattedMinutes)}মি : ${toBengaliNumerals(formattedSeconds)}সে`;

  const toggleForceExpire = () => {
    setForceExpired((prev) => !prev);
  };

  const countdown: CountdownState = {
    hours: state.hours,
    minutes: state.minutes,
    seconds: state.seconds,
    totalSecondsLeft: state.totalSecondsLeft,
    isExpired: state.isExpired,
    isUpcoming: state.isUpcoming,
    status: state.status,
    formattedTime,
    formattedTimeBn,
  };

  return {
    ...countdown,
    prefixBn: state.prefixBn,
    isMounted,
    forceExpired,
    toggleForceExpire,
  };
}

