'use client';

import React from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface DrawerFooterCounterProps {
  matchingCount: number;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onApply: () => void;
  isBengali?: boolean;
}

export const DrawerFooterCounter: React.FC<DrawerFooterCounterProps> = ({
  matchingCount,
  hasActiveFilters,
  onClearAll,
  onApply,
  isBengali = true,
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      {/* Clear All Button */}
      <button
        type="button"
        onClick={onClearAll}
        disabled={!hasActiveFilters}
        className={`px-3 py-2 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
          hasActiveFilters
            ? 'border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            : 'border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{isBengali ? 'রিসেট করুন' : 'Clear All'}</span>
      </button>

      {/* Apply Filters with Live Count Button */}
      <button
        type="button"
        onClick={onApply}
        className="flex-1 py-2.5 px-4 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200] font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Check className="w-4 h-4 text-gray-900" />
        <span>
          {isBengali
            ? `ফিল্টার প্রয়োগ করুন (${toBengaliNumerals(matchingCount)}টি বই দেখুন)`
            : `Apply Filters (See ${matchingCount} Books)`}
        </span>
      </button>
    </div>
  );
};
