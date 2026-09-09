'use client';

import React from 'react';
import { AlertCircle, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useNoticeBar } from '@/hooks/useNoticeBar';
import { useLanguage } from '@/hooks/useLanguage';

interface TopNoticeBarProps {
  className?: string;
  onOpenLocationModal?: () => void;
  onOpenBulkModal?: () => void;
}

export const TopNoticeBar: React.FC<TopNoticeBarProps> = ({
  className = '',
  onOpenLocationModal,
  onOpenBulkModal,
}) => {
  const {
    currentNotice,
    currentIndex,
    totalNotices,
    isVisible,
    setIsPaused,
    nextNotice,
    prevNotice,
    dismissNotice,
  } = useNoticeBar();
  const { isBengali } = useLanguage();

  if (!isVisible || !currentNotice || !currentNotice.isActive) {
    return null;
  }

  const handleLinkClick = () => {
    if (currentNotice.linkUrl === '#location') {
      onOpenLocationModal?.();
    } else if (currentNotice.linkUrl === '#bulk') {
      onOpenBulkModal?.();
    }
  };

  return (
    <aside
      role="region"
      aria-label="দোকানের জরুরি বিজ্ঞপ্তি ও বিশেষ অফার ব্যানার"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`w-full min-h-[32px] bg-[#febd69] text-gray-950 text-xs py-1 px-2 sm:px-4 flex items-center justify-between gap-2 border-b border-[#f08804]/40 shadow-2xs transition-all select-none ${className}`}
    >
      {/* Left: Previous Notice Arrow (Desktop) */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={prevNotice}
          aria-label="পূর্ববর্তী নোটিশ দেখুন"
          className="p-1 rounded hover:bg-black/10 text-gray-900 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Live Rotating Message & Ticker Content */}
      <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1 justify-center text-center overflow-hidden">
        {currentNotice.type === 'emergency' ? (
          <AlertCircle className="w-3.5 h-3.5 text-amber-950 shrink-0 animate-pulse" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-amber-950 shrink-0" />
        )}

        <span className="font-semibold leading-tight truncate sm:whitespace-normal">
          {isBengali ? currentNotice.messageBn : currentNotice.message}
        </span>

        {currentNotice.linkText && (
          <button
            type="button"
            onClick={handleLinkClick}
            className="hidden sm:inline-flex items-center font-extrabold text-amber-950 hover:text-black underline transition-colors shrink-0 ml-1 text-[11px] cursor-pointer"
          >
            {currentNotice.linkText}
          </button>
        )}

        {/* Ticker Indicator Dots/Badge */}
        <span className="hidden md:inline-block text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full font-mono text-gray-800 font-bold shrink-0">
          {currentIndex + 1}/{totalNotices}
        </span>
      </div>

      {/* Right: Next Arrow & Dismiss Button */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={nextNotice}
          aria-label="পরবর্তী নোটিশ দেখুন"
          className="hidden sm:inline-block p-1 rounded hover:bg-black/10 text-gray-900 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={dismissNotice}
          aria-label="বিজ্ঞপ্তিটি বন্ধ করুন"
          className="p-1 rounded-md text-amber-950 hover:text-black hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
