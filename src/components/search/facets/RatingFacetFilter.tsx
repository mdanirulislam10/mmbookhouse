'use client';

import React from 'react';
import { Star, X } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface RatingOption {
  stars: number;
  label: string;
  labelBn: string;
}

const RATING_OPTIONS: RatingOption[] = [
  { stars: 4, label: '4 Stars & Up', labelBn: '৪★ ও তদূর্ধ্ব' },
  { stars: 3, label: '3 Stars & Up', labelBn: '৩★ ও তদূর্ধ্ব' },
  { stars: 2, label: '2 Stars & Up', labelBn: '২★ ও তদূর্ধ্ব' },
  { stars: 1, label: '1 Star & Up', labelBn: '১★ ও তদূর্ধ্ব' },
];

interface RatingFacetFilterProps {
  minRating: number;
  onSelectRating: (rating: number) => void;
  ratingCounts?: Record<number, number>;
  isBengali?: boolean;
}

/**
 * Task 18: Amazon-Style Golden Star Customer Review Filter (গোল্ডেন স্টার কাস্টমার রিভিউ ফিল্টার)
 * Renders interactive golden star visual ratings with "& Up" / "& তদূর্ধ্ব" thresholds.
 */
export const RatingFacetFilter: React.FC<RatingFacetFilterProps> = ({
  minRating,
  onSelectRating,
  ratingCounts = {},
  isBengali = true,
}) => {
  return (
    <div className="space-y-1" role="radiogroup" aria-label={isBengali ? 'গ্রাহক রেটিং ফিল্টার' : 'Customer rating filter'}>
      {RATING_OPTIONS.map((opt) => {
        const isSelected = minRating === opt.stars;
        const count = ratingCounts[opt.stars] ?? 0;
        const disabled = count === 0;

        return (
          <button
            key={opt.stars}
            type="button"
            disabled={disabled}
            onClick={() => onSelectRating(isSelected ? 0 : opt.stars)}
            className={`w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg text-xs transition-all text-left select-none ${
              disabled
                ? 'opacity-35 cursor-not-allowed bg-transparent'
                : isSelected
                ? 'bg-amber-50/90 text-amber-950 font-semibold border border-amber-300 shadow-2xs cursor-pointer ring-1 ring-amber-400/40'
                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-950 cursor-pointer'
            }`}
          >
            {/* Stars Visual Row */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isFilled = starIdx <= opt.stars;
                  return (
                    <Star
                      key={starIdx}
                      className={`w-3.5 h-3.5 ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-100 text-gray-300'
                      }`}
                    />
                  );
                })}
              </div>

              <span className={`text-[11px] font-medium ${isSelected ? 'text-amber-950 font-bold' : 'text-gray-600'}`}>
                {isBengali ? opt.labelBn : opt.label}
              </span>
            </div>

            {/* Book count badge */}
            <span
              className={`text-[11px] font-mono tabular-nums shrink-0 ${
                isSelected ? 'text-amber-800 font-bold' : 'text-gray-400'
              }`}
            >
              ({isBengali ? toBengaliNumerals(count) : count})
            </span>
          </button>
        );
      })}

      {minRating > 0 && (
        <button
          type="button"
          onClick={() => onSelectRating(0)}
          className="mt-1 w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/50 rounded transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
          <span>{isBengali ? 'রেটিং ফিল্টার সরান' : 'Remove rating filter'}</span>
        </button>
      )}
    </div>
  );
};
