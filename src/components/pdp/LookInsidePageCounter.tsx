'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';

interface LookInsidePageCounterProps {
  currentPage: number; // 1-indexed
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSelect?: (pageNum: number) => void;
  showProgressBar?: boolean;
  className?: string;
}

/**
 * Task 20: Page Counter Indicator & Navigation
 * Renders bilingual counter (e.g. "পাতা ৩ / ৫" or "Page 3 of 5")
 * with progress tracking bar and tactile prev/next triggers.
 */
export const LookInsidePageCounter: React.FC<LookInsidePageCounterProps> = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onPageSelect,
  showProgressBar = true,
  className = '',
}) => {
  const { isBengali } = useLanguage();

  const progressPercent =
    totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div
      className={`flex flex-col items-center gap-1.5 select-none ${className}`}
      aria-label="Look Inside Page Counter"
    >
      {/* Controls row */}
      <div className="flex items-center gap-2 bg-neutral-900/90 text-neutral-200 px-3 py-1.5 rounded-full border border-neutral-700 shadow-md backdrop-blur-xs">
        {/* Previous page button */}
        <button
          type="button"
          onClick={onPrevPage}
          disabled={isFirstPage}
          className="p-1 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-90"
          title={isBengali ? 'পূর্ববর্তী পাতা' : 'Previous page'}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Counter label & selector */}
        {onPageSelect ? (
          <div className="flex items-center gap-1 text-xs font-semibold font-bengali tracking-wide px-1">
            <span>{isBengali ? 'পাতা' : 'Page'}</span>
            <select
              value={currentPage}
              onChange={(e) => onPageSelect(Number(e.target.value))}
              className="bg-neutral-800 text-white font-bold border border-neutral-600 rounded px-1.5 py-0.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#febd69] cursor-pointer"
              aria-label="Select sample page"
            >
              {[...Array(totalPages)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {isBengali ? toBengaliNumerals(i + 1) : i + 1}
                </option>
              ))}
            </select>
            <span className="text-neutral-400">/</span>
            <span className="text-neutral-300">
              {isBengali ? toBengaliNumerals(totalPages) : totalPages}
            </span>
          </div>
        ) : (
          <div className="text-xs font-semibold font-bengali tracking-wide px-2">
            {isBengali ? (
              <span>
                পাতা <strong className="text-[#febd69]">{toBengaliNumerals(currentPage)}</strong> / {toBengaliNumerals(totalPages)}
              </span>
            ) : (
              <span>
                Page <strong className="text-[#febd69]">{currentPage}</strong> of {totalPages}
              </span>
            )}
          </div>
        )}

        {/* Next page button */}
        <button
          type="button"
          onClick={onNextPage}
          disabled={isLastPage}
          className="p-1 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-90"
          title={isBengali ? 'পরবর্তী পাতা' : 'Next page'}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Thin reading progress bar */}
      {showProgressBar && totalPages > 1 && (
        <div
          className="w-36 h-1 bg-neutral-800 rounded-full overflow-hidden"
          title={`${progressPercent}% sample preview read`}
        >
          <div
            className="h-full bg-gradient-to-r from-[#febd69] to-[#ffa41c] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
