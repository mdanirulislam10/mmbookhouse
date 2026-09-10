'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/services/holidayCalendar';
import { isMaldaTownPincode, getIndiaStandardTime } from '@/lib/services/slaEngine';

export interface OrderCutoffTimerProps {
  pincode?: string;
  compact?: boolean;
  className?: string;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isSameDayTarget: boolean;
  isPassed: boolean;
}

function calculateRemaining(pincode: string): TimeRemaining {
  const ist = getIndiaStandardTime();
  const currentHour = ist.getHours();
  const currentMin = ist.getMinutes();
  const currentSec = ist.getSeconds();
  const isMalda = isMaldaTownPincode(pincode);

  let targetHour = 17; // Default 5:00 PM IST
  let isSameDayTarget = false;

  if (isMalda && currentHour < 14) {
    targetHour = 14; // 2:00 PM IST cutoff for same-day
    isSameDayTarget = true;
  } else if (currentHour < 17) {
    targetHour = 17; // 5:00 PM IST cutoff for tomorrow
    isSameDayTarget = false;
  } else {
    // Past today's cutoffs; countdown to tomorrow's 14:00 or 17:00 batch
    targetHour = isMalda ? 38 : 41; // 24 + 14 or 24 + 17
    isSameDayTarget = false;
  }

  const currentSecondsTotal = currentHour * 3600 + currentMin * 60 + currentSec;
  const targetSecondsTotal = targetHour * 3600;
  let diffSec = targetSecondsTotal - currentSecondsTotal;

  if (diffSec < 0) diffSec = 0;

  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  return {
    hours,
    minutes,
    seconds,
    isSameDayTarget,
    isPassed: diffSec <= 0,
  };
}

export const OrderCutoffTimer: React.FC<OrderCutoffTimerProps> = ({
  pincode = '732101',
  compact = false,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState<TimeRemaining>({
    hours: 2,
    minutes: 30,
    seconds: 0,
    isSameDayTarget: false,
    isPassed: false,
  });

  useEffect(() => {
    setMounted(true);
    setRemaining(calculateRemaining(pincode));

    const interval = setInterval(() => {
      setRemaining(calculateRemaining(pincode));
    }, 1000);

    return () => clearInterval(interval);
  }, [pincode]);

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-200/80 ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>{isBengali ? 'কাট-অফ টাইমার লোড হচ্ছে...' : 'Loading order cut-off timer...'}</span>
      </div>
    );
  }

  const { hours, minutes, seconds, isSameDayTarget } = remaining;

  // Bengali formatted string
  const hoursBn = toBengaliNumerals(hours);
  const minsBn = toBengaliNumerals(minutes);
  const secsBn = toBengaliNumerals(seconds);

  const timeTextBn = `${hours > 0 ? `${hoursBn} ঘণ্টা ` : ''}${minsBn} মিনিট ${secsBn} সেকেন্ড`;
  const timeTextEn = `${hours > 0 ? `${hours} hr ` : ''}${minutes} min ${seconds} sec`;

  const targetLabelBn = isSameDayTarget
    ? 'আজই ডেলিভারি পেতে'
    : 'আগামীকাল পেতে';
  const targetLabelEn = isSameDayTarget
    ? 'To get it Today'
    : 'To get it Tomorrow';

  return (
    <div
      aria-label="Order Cutoff Countdown"
      className={`inline-flex items-center gap-1.5 rounded-md transition-all select-none ${
        compact
          ? 'text-[11px] px-2 py-0.5 bg-amber-50/90 text-amber-900 border border-amber-200'
          : 'text-xs px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 border border-amber-200/90 shadow-xs'
      } ${className}`}
    >
      {isSameDayTarget ? (
        <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-bounce shrink-0" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      )}

      <span className="font-medium">
        {isBengali ? `${targetLabelBn} অর্ডার সম্পন্ন করুন ` : `${targetLabelEn}, order within `}
        <strong className="font-bold text-red-700 font-mono tracking-tight bg-white/80 px-1 py-0.5 rounded border border-amber-200 shadow-2xs inline-block">
          {isBengali ? timeTextBn : timeTextEn}
        </strong>
        {isBengali ? '-এর মধ্যে' : ''}
      </span>
    </div>
  );
};
