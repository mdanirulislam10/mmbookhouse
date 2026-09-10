'use client';

import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  AlertTriangle,
  Info,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface ShippingDisruptionBannerProps {
  isActive?: boolean;
  severity?: 'warning' | 'alert' | 'info';
  messageBn?: string;
  messageEn?: string;
  affectedAreaBn?: string;
  affectedAreaEn?: string;
  dismissible?: boolean;
  storageKey?: string;
  className?: string;
}

/**
 * Task 26: Shipping Disruption Notice Banner
 * "প্রাকৃতিক দুর্যোগ বা কুরিয়ার ধর্মঘটের জন্য অ্যাডমিন ডিসরাপশন নোটিস ব্যানার"
 * "ভারী বৃষ্টির কারণে উত্তরবঙ্গে ডেলিভারিতে ২৪ ঘণ্টা বিলম্ব হতে পারে—আমরা দুঃখিত"
 */
export const ShippingDisruptionBanner: React.FC<ShippingDisruptionBannerProps> = ({
  isActive = true,
  severity = 'warning',
  messageBn = 'ভারী বৃষ্টির কারণে উত্তরবঙ্গে ডেলিভারিতে ২৪ ঘণ্টা বিলম্ব হতে পারে—আমরা আন্তরিকভাবে দুঃখিত।',
  messageEn = 'Due to heavy rainfall across North Bengal, courier deliveries may experience an estimated 24-hour delay. We sincerely appreciate your patience.',
  affectedAreaBn = 'উত্তরবঙ্গ ও সংলগ্ন জেলাসমূহ',
  affectedAreaEn = 'North Bengal & Adjacent Districts',
  dismissible = true,
  storageKey = 'mm_disruption_banner_closed',
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (dismissible && typeof window !== 'undefined') {
      const closed = sessionStorage.getItem(storageKey);
      if (closed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [dismissible, storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (dismissible && typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
  };

  if (!isActive || isDismissed) {
    return null;
  }

  const severityStyles = {
    warning: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      iconBg: 'bg-amber-100 text-amber-700',
      tagBg: 'bg-amber-200/80 text-amber-900',
      Icon: AlertTriangle,
    },
    alert: {
      bg: 'bg-rose-50 border-rose-300 text-rose-950',
      iconBg: 'bg-rose-100 text-rose-700',
      tagBg: 'bg-rose-200/80 text-rose-900',
      Icon: ShieldAlert,
    },
    info: {
      bg: 'bg-sky-50 border-sky-300 text-sky-950',
      iconBg: 'bg-sky-100 text-sky-700',
      tagBg: 'bg-sky-200/80 text-sky-900',
      Icon: Info,
    },
  };

  const currentTheme = severityStyles[severity] || severityStyles.warning;
  const CurrentIcon = currentTheme.Icon;

  return (
    <div
      role="alert"
      className={`rounded-xl border p-3 sm:p-3.5 shadow-2xs transition-all ${currentTheme.bg} ${className}`}
      data-testid="shipping-disruption-banner"
    >
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-lg shrink-0 ${currentTheme.iconBg}`}>
          <CurrentIcon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs sm:text-sm leading-snug">
              {isBengali ? 'ডেলিভারি নোটিস ও আবহাওয়া সতর্কতা' : 'Delivery & Weather Advisory'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${currentTheme.tagBg}`}
            >
              {isBengali ? affectedAreaBn : affectedAreaEn}
            </span>
          </div>

          <p className="text-xs mt-1 leading-relaxed opacity-95">
            {isBengali ? messageBn : messageEn}
          </p>

          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] opacity-80">
            <Clock className="w-3 h-3 shrink-0" />
            <span>
              {isBengali
                ? 'আমাদের কুরিয়ার টিম যথাসম্ভব দ্রুত পার্সেল পৌঁছে দিতে সক্রিয় আছে।'
                : 'Our logistics partners are working around the clock to expedite all affected orders.'}
            </span>
          </div>
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isBengali ? 'নোটিস বন্ধ করুন' : 'Dismiss notice'}
            className="p-1 rounded-md hover:bg-black/5 text-gray-500 hover:text-gray-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
