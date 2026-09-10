'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Bell } from 'lucide-react';
import { DEFAULT_TICKER_NOTICES, TickerNotice } from './subnavData';
import { useLanguage } from '@/hooks/useLanguage';

interface SubnavTickerProps {
  className?: string;
  customNotices?: TickerNotice[];
  showEmergencyNotice?: boolean;
}

/**
 * Task 10: Local Malda Student Hub & Notice Ticker Component
 * Positioned at the right end of the Subnav Bar.
 * Rotates emergency announcements and provides a one-click hub for local Malda students.
 */
export const SubnavTicker: React.FC<SubnavTickerProps> = ({
  className = '',
  customNotices,
  showEmergencyNotice = false,
}) => {
  const notices = customNotices || DEFAULT_TICKER_NOTICES;
  const [currentIndex, setCurrentIndex] = useState(0);
  const { language } = useLanguage();

  // Auto-rotate notices every 5 seconds if multiple exist
  useEffect(() => {
    if (notices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notices.length]);

  const activeNotice = notices[currentIndex];
  const noticeText = activeNotice
    ? (language === 'en' ? activeNotice.textEn || activeNotice.text : activeNotice.textBn || activeNotice.text)
    : '';

  return (
    <div className={`flex items-center gap-2 text-xs select-none ${className}`}>
      {/* 1. Emergency or Dynamic Ticker Slot (Shown on laptop and desktop screens: xl+) */}
      {showEmergencyNotice && activeNotice && (
        <div
          role="status"
          aria-live="polite"
          className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-medium text-[11px] transition-all duration-300"
        >
          <Bell className="w-3 h-3 text-amber-400 shrink-0 animate-bounce" />
          {activeNotice.href ? (
            <Link
              href={activeNotice.href}
              className="hover:underline hover:text-white truncate max-w-[280px]"
            >
              {noticeText}
            </Link>
          ) : (
            <span className="truncate max-w-[280px]">{noticeText}</span>
          )}
        </div>
      )}

      {/* 2. Malda Student Hub Dedicated Local Link (Compact on mobile to preserve category swipe space) */}
      <Link
        href="/malda-student-hub"
        aria-label={language === 'bn' ? 'মালদা স্টুডেন্ট হাব ও বিশেষ নোটিশ' : 'Malda Student Hub & Local Notice'}
        className="amazon-nav-box flex items-center gap-1 py-1 px-1.5 sm:px-2 text-amber-300 hover:text-amber-200 font-bold whitespace-nowrap text-xs transition-colors shrink-0 group"
      >
        <MapPin className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
        <span className="hidden sm:inline">{language === 'bn' ? 'মালদা স্টুডেন্ট হাব' : 'Malda Student Hub'}</span>
        <span className="sm:hidden text-[11px]">{language === 'bn' ? 'মালদা' : 'Malda'}</span>
        <span className="hidden sm:inline text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1 rounded-sm font-semibold ml-0.5">
          {language === 'bn' ? 'লোকাল' : 'Local'}
        </span>
      </Link>
    </div>
  );
};
