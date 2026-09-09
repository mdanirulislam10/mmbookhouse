'use client';

import React from 'react';
import { BadgePercent, Check, X } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface DiscountOption {
  threshold: number;
  label: string;
  labelBn: string;
  badgeColor: string;
}

const DISCOUNT_OPTIONS: DiscountOption[] = [
  {
    threshold: 50,
    label: '50% Off or more',
    labelBn: '৫০% বা তার বেশি ছাড়',
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
  },
  {
    threshold: 35,
    label: '35% Off or more',
    labelBn: '৩৫% বা তার বেশি ছাড়',
    badgeColor: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  {
    threshold: 25,
    label: '25% Off or more',
    labelBn: '২৫% বা তার বেশি ছাড়',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    threshold: 10,
    label: '10% Off or more',
    labelBn: '১০% বা তার বেশি ছাড়',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
];

interface DiscountRangeFilterProps {
  selectedDiscount?: number;
  onSelectDiscount: (discount: number | undefined) => void;
  discountCounts?: Record<number, number>;
  isBengali?: boolean;
}

/**
 * Task 17: Amazon-Style Discount Range Badge Filter (অ্যামাজন-স্টাইল ডিসকাউন্ট রেঞ্জ ব্যাজ)
 * Allows customers to quickly filter products by minimum discount percentage threshold.
 */
export const DiscountRangeFilter: React.FC<DiscountRangeFilterProps> = ({
  selectedDiscount,
  onSelectDiscount,
  discountCounts = {},
  isBengali = true,
}) => {
  return (
    <div className="space-y-1.5" role="radiogroup" aria-label={isBengali ? 'ছাড়ের পরিমাণ নির্বাচন' : 'Discount range selection'}>
      {DISCOUNT_OPTIONS.map((opt) => {
        const isSelected = selectedDiscount === opt.threshold;
        const count = discountCounts[opt.threshold] ?? 0;
        const disabled = count === 0;

        return (
          <button
            key={opt.threshold}
            type="button"
            disabled={disabled}
            onClick={() => onSelectDiscount(isSelected ? undefined : opt.threshold)}
            className={`w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg text-xs transition-all text-left select-none ${
              disabled
                ? 'opacity-35 cursor-not-allowed bg-transparent'
                : isSelected
                ? 'bg-amber-50/90 text-amber-950 font-semibold border border-amber-300 shadow-2xs cursor-pointer ring-1 ring-amber-400/40'
                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-950 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Radio-like indicator */}
              <div
                className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                  isSelected
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              <div className="flex items-center gap-1.5 truncate">
                <BadgePercent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-700' : 'text-gray-400'}`} />
                <span className="truncate">{isBengali ? opt.labelBn : opt.label}</span>
              </div>
            </div>

            {/* Discount pill badge & count */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono ${opt.badgeColor}`}>
                {isBengali ? `${toBengaliNumerals(opt.threshold)}%+` : `${opt.threshold}%+`}
              </span>
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  isSelected ? 'text-amber-800 font-bold' : 'text-gray-400'
                }`}
              >
                ({isBengali ? toBengaliNumerals(count) : count})
              </span>
            </div>
          </button>
        );
      })}

      {selectedDiscount !== undefined && (
        <button
          type="button"
          onClick={() => onSelectDiscount(undefined)}
          className="mt-1 w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/50 rounded transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
          <span>{isBengali ? 'ছাড় ফিল্টার সরান' : 'Remove discount filter'}</span>
        </button>
      )}
    </div>
  );
};
