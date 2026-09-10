'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isBengali?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalResults?: number;
}

/**
 * Task 46 & 47: Amazon-Standard Numbered Pagination Component
 * - Displays smart windowed page numbers (e.g. 1 2 3 ... 10)
 * - Prev/Next navigation with disabled boundary states
 * - Fully accessible keyboard navigation and ARIA attributes
 * - Bengali numeral localization
 * - Configurable items per page selector (12, 24, 48)
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isBengali = true,
  pageSize,
  onPageSizeChange,
  totalResults,
}) => {
  if (totalPages <= 1 && (!onPageSizeChange || (totalResults !== undefined && totalResults <= 12))) {
    return null;
  }

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Generate pagination items with ellipses
  const getPaginationItems = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        'ellipsis-start',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      'ellipsis-start',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis-end',
      totalPages,
    ];
  };

  const paginationItems = getPaginationItems();
  const formatNum = (num: number) => (isBengali ? toBengaliNumerals(num) : String(num));

  return (
    <nav
      role="navigation"
      aria-label={isBengali ? 'পৃষ্ঠা নম্বর' : 'Pagination Navigation'}
      className="my-8 flex flex-col items-center justify-center gap-3"
    >
      {/* Desktop & Tablet Pagination */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={isBengali ? 'পূর্ববর্তী পৃষ্ঠা' : 'Previous page'}
          aria-disabled={currentPage <= 1}
          className={`flex h-10 items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            currentPage <= 1
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-300 bg-white text-gray-700 shadow-sm hover:border-[#e77600] hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{isBengali ? 'পূর্ববর্তী' : 'Previous'}</span>
        </button>

        {/* Page Number Buttons */}
        <div className="hidden items-center gap-1 sm:flex sm:gap-1.5">
          {paginationItems.map((item, index) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-10 w-8 items-center justify-center text-sm font-bold text-gray-400 select-none"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const pageNum = item as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageClick(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={
                  isBengali
                    ? `পৃষ্ঠা ${toBengaliNumerals(pageNum)}`
                    : `Page ${pageNum}`
                }
                className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-md px-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-2 border-[#e77600] bg-[#fef8f2] font-bold text-[#b12704] shadow-sm'
                    : 'border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-[#e77600] hover:bg-gray-50'
                }`}
              >
                {formatNum(pageNum)}
              </button>
            );
          })}
        </div>

        {/* Mobile Compact Page Indicator */}
        <div className="flex items-center px-2 text-sm font-medium text-gray-700 sm:hidden">
          <span>
            {isBengali ? (
              <>
                পৃষ্ঠা <strong className="text-gray-900">{toBengaliNumerals(currentPage)}</strong> /{' '}
                {toBengaliNumerals(totalPages)}
              </>
            ) : (
              <>
                Page <strong className="text-gray-900">{currentPage}</strong> of {totalPages}
              </>
            )}
          </span>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={isBengali ? 'পরবর্তী পৃষ্ঠা' : 'Next page'}
          aria-disabled={currentPage >= totalPages}
          className={`flex h-10 items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            currentPage >= totalPages
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-300 bg-white text-gray-700 shadow-sm hover:border-[#e77600] hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          <span className="hidden sm:inline">{isBengali ? 'পরবর্তী' : 'Next'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Task 47: Optimal Items Per Page Selector */}
      {onPageSizeChange && pageSize && (
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
          <span>{isBengali ? 'প্রতি পৃষ্ঠায় বই:' : 'Books per page:'}</span>
          <div className="inline-flex rounded-md shadow-2xs border border-gray-200 overflow-hidden bg-white">
            {[12, 24, 48].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPageSizeChange(size)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  pageSize === size
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isBengali ? toBengaliNumerals(size) : size}
              </button>
            ))}
          </div>
          {totalResults !== undefined && (
            <span className="hidden sm:inline text-[11px] text-gray-400">
              {isBengali
                ? `(মোট ${toBengaliNumerals(totalResults)}টি বই)`
                : `(${totalResults} total books)`}
            </span>
          )}
        </div>
      )}
    </nav>
  );
};
