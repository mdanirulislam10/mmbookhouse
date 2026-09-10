'use client';

import React from 'react';
import { RotateCcw, Check, AlertCircle } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface DrawerFooterCounterProps {
  matchingCount: number;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onApply: () => void;
  isBengali?: boolean;
}

/**
 * Task 5: Mobile Sticky Drawer Footer with Live Match Counter
 * Pre-calculates matching count before applying, protects against zero-result traps.
 */
export const DrawerFooterCounter: React.FC<DrawerFooterCounterProps> = ({
  matchingCount,
  hasActiveFilters,
  onClearAll,
  onApply,
  isBengali = true,
}) => {
  const isZeroMatch = matchingCount === 0;

  return (
    <footer
      className="sticky bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Clear All / Reset Button */}
      <button
        type="button"
        onClick={onClearAll}
        disabled={!hasActiveFilters}
        className={`px-3 py-2 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
          hasActiveFilters
            ? 'border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            : 'border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
        aria-label={isBengali ? 'সমস্ত ফিল্টার রিসেট করুন' : 'Reset all filters'}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{isBengali ? 'রিসেট' : 'Reset'}</span>
      </button>

      {/* Apply Filters with Live Count Button */}
      <button
        type="button"
        onClick={onApply}
        disabled={isZeroMatch}
        className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-all ${
          isZeroMatch
            ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200] cursor-pointer'
        }`}
        aria-label={
          isZeroMatch
            ? isBengali
              ? 'কোনো বই মেলেনি'
              : 'No matching books'
            : isBengali
            ? `ফিল্টার প্রয়োগ করুন (${toBengaliNumerals(matchingCount)}টি বই দেখুন)`
            : `Apply Filters (See ${matchingCount} Books)`
        }
      >
        {isZeroMatch ? (
          <>
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{isBengali ? 'কোনো বই মেলেনি (০)' : '0 Books Match'}</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4 text-gray-900 stroke-[2.5]" />
            <span>
              {isBengali
                ? `ফিল্টার প্রয়োগ (${toBengaliNumerals(matchingCount)}টি বই)`
                : `Apply (${matchingCount} Books)`}
            </span>
          </>
        )}
      </button>
    </footer>
  );
};
