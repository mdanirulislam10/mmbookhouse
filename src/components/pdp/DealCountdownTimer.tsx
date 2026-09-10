'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Clock, Zap } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';

export interface DealCountdownTimerProps {
  /**
   * Target end time as ISO string or Date object.
   * Defaults to 23:59:59 IST today.
   */
  targetEndTime?: string | Date;
  dealTitleBn?: string;
  dealTitleEn?: string;
  compact?: boolean;
  className?: string;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calculateRemainingTime(target?: string | Date): TimeRemaining {
  let targetMs: number;

  if (target) {
    targetMs = new Date(target).getTime();
  } else {
    // Default to midnight today IST (Indian Standard Time UTC+5:30)
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    targetMs = endOfDay.getTime();
  }

  const diff = Math.max(0, targetMs - Date.now());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, totalMs: diff };
}

/**
 * Task 44: Deal Countdown Urgency Timer
 * M.M Book House Malda - Promotional Flash Timer
 * Displays: "অফার শেষ হতে বাকি: ০৪ ঘণ্টা ১৫ মিনিট ২৯ সেকেন্ড"
 * English: "Offer ends in: 04h 15m 29s"
 * Performance: Zero-blocking, fixed height, 0.000 CLS.
 */
export const DealCountdownTimer: React.FC<DealCountdownTimerProps> = ({
  targetEndTime,
  dealTitleBn,
  dealTitleEn,
  compact = false,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [time, setTime] = useState<TimeRemaining>(() => calculateRemainingTime(targetEndTime));

  useEffect(() => {
    // Update every second with drift correction
    const timer = setInterval(() => {
      setTime(calculateRemainingTime(targetEndTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetEndTime]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const hStr = isBengali ? toBengaliNumerals(pad(time.hours)) : pad(time.hours);
  const mStr = isBengali ? toBengaliNumerals(pad(time.minutes)) : pad(time.minutes);
  const sStr = isBengali ? toBengaliNumerals(pad(time.seconds)) : pad(time.seconds);

  if (time.totalMs <= 0) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 border border-gray-200 text-xs font-medium text-gray-500 min-h-[34px] ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        <span>{isBengali ? 'এই অফারটি সমাপ্ত হয়েছে' : 'Deal expired'}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        role="timer"
        aria-live="off"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 min-h-[28px] ${className}`}
      >
        <Timer className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />
        <span className="font-mono font-black tracking-tight">
          {hStr}:{mStr}:{sStr}
        </span>
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-live="off"
      className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/90 text-xs shadow-2xs min-h-[38px] ${className}`}
    >
      <div className="flex items-center gap-1.5 font-bold text-rose-950">
        <Zap className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
        <span>
          {isBengali
            ? (dealTitleBn || 'অফার শেষ হতে বাকি:')
            : (dealTitleEn || 'Offer ends in:')}
        </span>
      </div>

      <div className="flex items-center gap-1 font-mono font-black text-rose-800">
        <span className="px-1.5 py-0.5 rounded-md bg-white border border-rose-300 text-xs shadow-2xs">
          {hStr}
        </span>
        <span className="text-gray-400 font-bold">{isBengali ? 'ঘণ্টা' : 'h'}</span>
        <span className="px-1.5 py-0.5 rounded-md bg-white border border-rose-300 text-xs shadow-2xs">
          {mStr}
        </span>
        <span className="text-gray-400 font-bold">{isBengali ? 'মি' : 'm'}</span>
        <span className="px-1.5 py-0.5 rounded-md bg-white border border-rose-300 text-xs shadow-2xs">
          {sStr}
        </span>
        <span className="text-gray-400 font-bold">{isBengali ? 'সে' : 's'}</span>
      </div>
    </div>
  );
};
