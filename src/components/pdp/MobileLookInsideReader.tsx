'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LookInsideSamplePage, DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getOptimizedPageUrl,
  generateBookPageSvgFallback,
  preloadAdjacentPages,
} from '@/lib/services/lookInsideService';
import { WatermarkOverlay } from './WatermarkOverlay';
import { LookInsideSkeleton } from './LookInsideSkeleton';
import { toBengaliNumerals } from '@/lib/utils/currency';
import {
  ChevronLeft,
  ChevronRight,
  Columns,
  Rows,
  Maximize,
  Minimize,
  SlidersHorizontal,
} from 'lucide-react';

export type MobileReaderMode = 'horizontal' | 'vertical';

interface MobileLookInsideReaderProps {
  pages: LookInsideSamplePage[];
  initialPageIndex?: number;
  book?: Partial<DetailedBookProduct>;
  className?: string;
}

/**
 * Task 16: Mobile Horizontal Swipe & Vertical Strip Reader Mode
 *
 * Tailored specifically for mobile viewport ergonomics:
 * 1. Horizontal Swipe Mode: Touch-gesture page turning with velocity & threshold detection.
 * 2. Vertical Strip Mode: Continuous infinite vertical scroll for effortless single-thumb reading.
 * 3. Screen-fit toggle: Fit to width vs fit to height.
 * 4. Floating bottom thumb toolbar with Prev/Next, Mode Switch, and Page Counter.
 */
export const MobileLookInsideReader: React.FC<MobileLookInsideReaderProps> = ({
  pages,
  initialPageIndex = 0,
  book,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [readerMode, setReaderMode] = useState<MobileReaderMode>('horizontal');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(initialPageIndex);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // Touch gesture states for horizontal swipe
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload adjacent images
  useEffect(() => {
    preloadAdjacentPages(pages, currentPageIndex, 2);
  }, [pages, currentPageIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (readerMode !== 'horizontal') return;

    const deltaX = touchStartXRef.current - touchEndXRef.current;
    const swipeThreshold = 45; // pixels

    if (deltaX > swipeThreshold && currentPageIndex < pages.length - 1) {
      // Swiped Left -> Next page
      setCurrentPageIndex((prev) => prev + 1);
    } else if (deltaX < -swipeThreshold && currentPageIndex > 0) {
      // Swiped Right -> Previous page
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const toggleMode = () => {
    setReaderMode((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  const toggleFit = () => {
    setFitToWidth((prev) => !prev);
  };

  if (!pages || pages.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden select-none touch-pan-y ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Mobile Look Inside Reader"
    >
      {/* Dynamic Watermark for Piracy Protection */}
      <WatermarkOverlay
        bookTitle={book?.title || 'M.M Book House'}
        storeName="M.M Book House Malda"
      />

      {/* Top Floating Mini Controls (Mode & Fit Toggles) */}
      <div className="absolute top-2 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {/* Mode Switcher Pill */}
        <button
          type="button"
          onClick={toggleMode}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/85 backdrop-blur-md text-neutral-200 border border-neutral-700 text-[11px] font-semibold font-bengali shadow-md active:scale-95"
          title="মোড পরিবর্তন করুন"
        >
          {readerMode === 'horizontal' ? (
            <>
              <Rows className="w-3.5 h-3.5 text-[#febd69]" />
              <span>{isBengali ? 'সোয়াইপ মোড' : 'Swipe Mode'}</span>
            </>
          ) : (
            <>
              <Columns className="w-3.5 h-3.5 text-[#febd69]" />
              <span>{isBengali ? 'স্ক্রোল মোড' : 'Scroll Strip'}</span>
            </>
          )}
        </button>

        {/* Fit Toggle */}
        <button
          type="button"
          onClick={toggleFit}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/85 backdrop-blur-md text-neutral-200 border border-neutral-700 text-[11px] font-medium font-bengali shadow-md active:scale-95"
          title="স্ক্রিন ফিট টগল"
        >
          {fitToWidth ? (
            <>
              <Minimize className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isBengali ? 'ফিট ওয়াইড' : 'Fit Width'}</span>
            </>
          ) : (
            <>
              <Maximize className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isBengali ? 'ফুল পেজ' : 'Full Page'}</span>
            </>
          )}
        </button>
      </div>

      {/* Reader Content Body */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex items-center justify-center p-2 pt-10 pb-20">
        {readerMode === 'horizontal' ? (
          /* 1. HORIZONTAL SWIPE SINGLE-PAGE VIEW */
          <div className="relative w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[420px]">
            {!loadedImages[currentPageIndex] && !failedImages[currentPageIndex] && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <LookInsideSkeleton twoPageSpread={false} />
              </div>
            )}

            <div
              className={`relative bg-[#faf8f5] rounded-sm overflow-hidden shadow-2xl transition-transform duration-300 w-full ${
                fitToWidth ? 'max-w-full' : 'max-h-[75vh] flex items-center justify-center'
              }`}
            >
              {failedImages[currentPageIndex] ? (
                <img
                  src={generateBookPageSvgFallback(pages[currentPageIndex], book?.title)}
                  alt={pages[currentPageIndex].title}
                  className="w-full h-auto object-contain pointer-events-none select-none"
                  draggable={false}
                />
              ) : (
                <img
                  src={getOptimizedPageUrl(pages[currentPageIndex].imageUrl, { width: 720 })}
                  alt={pages[currentPageIndex].title}
                  onLoad={() =>
                    setLoadedImages((prev) => ({ ...prev, [currentPageIndex]: true }))
                  }
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [currentPageIndex]: true }))
                  }
                  className={`w-full h-auto object-contain pointer-events-none select-none transition-opacity duration-200 ${
                    loadedImages[currentPageIndex] ? 'opacity-100' : 'opacity-0'
                  }`}
                  draggable={false}
                />
              )}
            </div>

            {/* Title indicator under active page */}
            <div className="mt-2 text-center text-xs text-neutral-300 font-bengali truncate max-w-[90%]">
              {pages[currentPageIndex].title}
            </div>
          </div>
        ) : (
          /* 2. VERTICAL CONTINUOUS STRIP VIEW */
          <div className="w-full max-w-md mx-auto flex flex-col gap-4 py-2">
            {pages.map((page, idx) => (
              <div
                key={page.pageNumber || idx}
                className="relative bg-[#faf8f5] rounded-sm shadow-xl overflow-hidden border border-neutral-800"
              >
                {failedImages[idx] ? (
                  <img
                    src={generateBookPageSvgFallback(page, book?.title)}
                    alt={page.title}
                    className="w-full h-auto object-contain pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <img
                    src={getOptimizedPageUrl(page.imageUrl, { width: 720 })}
                    alt={page.title}
                    loading="lazy"
                    onError={() => setFailedImages((prev) => ({ ...prev, [idx]: true }))}
                    className="w-full h-auto object-contain pointer-events-none"
                    draggable={false}
                  />
                )}
                <div className="py-1 px-3 bg-neutral-900/90 text-neutral-300 text-[10px] flex justify-between font-bengali">
                  <span>{page.title}</span>
                  <span>পাতা {toBengaliNumerals(page.pageNumber)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Thumb Navigation Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2 p-2 bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 shadow-2xl pointer-events-auto font-bengali">
        {/* Prev Thumb Button */}
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0 || readerMode === 'vertical'}
          className="p-2.5 rounded-xl bg-neutral-800 text-neutral-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center Page Count Pill */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-neutral-100">
            {isBengali ? (
              <>
                পাতা <span className="text-[#febd69]">{toBengaliNumerals(currentPageIndex + 1)}</span> / {toBengaliNumerals(pages.length)}
              </>
            ) : (
              <>
                Page <span className="text-[#febd69]">{currentPageIndex + 1}</span> of {pages.length}
              </>
            )}
          </span>
          {/* Subtle dots indicator for horizontal mode */}
          {readerMode === 'horizontal' && (
            <div className="flex items-center gap-1 mt-1">
              {pages.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentPageIndex
                      ? 'w-4 bg-[#febd69]'
                      : 'w-1.5 bg-neutral-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Next Thumb Button */}
        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPageIndex === pages.length - 1 || readerMode === 'vertical'}
          className="p-2.5 rounded-xl bg-neutral-800 text-neutral-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
