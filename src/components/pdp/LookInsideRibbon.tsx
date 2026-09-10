'use client';

import React from 'react';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import { hasLookInsidePreview } from '@/lib/services/lookInsideService';

export type LookInsideRibbonVariant = 'ribbon' | 'button' | 'floating-pill' | 'banner';

interface LookInsideRibbonProps {
  book?: Partial<DetailedBookProduct> | null;
  onClick?: () => void;
  variant?: LookInsideRibbonVariant;
  className?: string;
}

/**
 * Task 11: Amazon Signature "🔍 Look Inside (ভেতরের পাতা দেখুন)" Ribbon & Action Button
 * Task 19: Smart Graceful Fallback (Cleanly hides when book has no sample pages)
 *
 * Features:
 * - Animated pulsing glowing badge/ribbon on book cover.
 * - Invites readers to inspect TOC, Preface, and sample pages (60%+ conversion boost).
 * - Multi-variant rendering: ribbon on image cover, prominent CTA button, or floating badge.
 * - Zero broken links: immediately returns null if book lacks valid sample pages.
 */
export const LookInsideRibbon: React.FC<LookInsideRibbonProps> = ({
  book,
  onClick,
  variant = 'ribbon',
  className = '',
}) => {
  const { isBengali } = useLanguage();

  // Task 19: Graceful Fallback - completely hide if no sample pages exist
  if (!hasLookInsidePreview(book)) {
    return null;
  }

  const sampleCount = book?.lookInside?.samplePages?.length || 5;

  // Handle keyboard activation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  // 1. Classic Amazon Ribbon Banner (Positioned on top of book cover image)
  if (variant === 'ribbon') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={
          isBengali
            ? 'বইটির ভেতরের পাতা দেখুন (Look Inside)'
            : 'Look Inside book sample pages'
        }
        className={`group absolute top-0 left-0 right-0 z-20 cursor-pointer select-none transition-all duration-300 ${className}`}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-[#007185] via-[#005a6a] to-[#007185] text-white py-1.5 px-3 shadow-md group-hover:shadow-lg transition-all border-b border-cyan-400/30 flex items-center justify-center gap-2">
          {/* Animated radar pulsing ring */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-200" />
          </span>

          <Search className="w-3.5 h-3.5 text-cyan-200 group-hover:scale-110 transition-transform" />

          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide font-bengali">
            <span className="text-[#febd69]">Look Inside</span>
            <span className="opacity-90">•</span>
            <span>{isBengali ? 'ভেতরের পাতা দেখুন' : 'Sample Pages'}</span>
          </div>

          <Sparkles className="w-3 h-3 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Shimmer sweep effect across ribbon */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        </div>
      </div>
    );
  }

  // 2. Floating Corner Pill Badge (top-right of image container)
  if (variant === 'floating-pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md text-[#007185] dark:text-cyan-400 border border-cyan-500/30 shadow-md hover:shadow-xl hover:bg-[#007185] hover:text-white dark:hover:bg-cyan-600 transition-all duration-200 active:scale-95 ${className}`}
        aria-label="Open Look Inside preview"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007185]" />
        </span>
        <BookOpen className="w-3.5 h-3.5" />
        <span className="text-xs font-bold font-bengali">
          {isBengali ? 'ভেতরের পাতা' : 'Look Inside'}
        </span>
      </button>
    );
  }

  // 3. Prominent CTA Action Button (under gallery or next to Add to Cart)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-50 hover:bg-cyan-50/70 text-[#007185] hover:text-[#005a6a] border-2 border-[#007185]/30 hover:border-[#007185] transition-all duration-200 shadow-2xs hover:shadow-md active:scale-98 font-bengali ${className}`}
      aria-label="Look Inside book preview"
    >
      <div className="relative">
        <BookOpen className="w-4 h-4 text-[#007185] group-hover:rotate-6 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007185]" />
        </span>
      </div>

      <span className="text-xs sm:text-sm font-bold tracking-tight">
        {isBengali ? '🔍 Look Inside (ভেতরের পাতা দেখুন)' : '🔍 Look Inside (Sample Pages)'}
      </span>

      <span className="text-[11px] font-medium bg-[#007185]/10 text-[#007185] px-1.5 py-0.5 rounded-sm">
        {sampleCount}P
      </span>
    </button>
  );
};
