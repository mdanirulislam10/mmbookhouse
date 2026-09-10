'use client';

import React from 'react';
import { Truck, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/services/holidayCalendar';
import { formatINR } from '@/lib/utils/currency';

export interface FreeShippingProgressBarProps {
  currentAmount: number;
  threshold?: number; // default 499
  compact?: boolean;
  className?: string;
}

export const FreeShippingProgressBar: React.FC<FreeShippingProgressBarProps> = ({
  currentAmount,
  threshold = 499,
  compact = false,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();

  const isQualified = currentAmount >= threshold;
  const shortfall = Math.max(0, threshold - currentAmount);
  const percentage = Math.min(100, Math.max(0, Math.round((currentAmount / threshold) * 100)));

  return (
    <div
      aria-label="Free Shipping Eligibility Progress"
      className={`rounded-xl border transition-all ${
        isQualified
          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
          : 'bg-amber-50/50 border-amber-200/90'
      } ${compact ? 'p-2.5 text-xs' : 'p-3.5 text-sm'} ${className}`}
    >
      {/* Callout Header */}
      <div className="flex items-start gap-2 justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {isQualified ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Truck className="w-4 h-4 text-amber-600 shrink-0" />
          )}

          <div className="leading-snug">
            {isQualified ? (
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <span>{isBengali ? 'অভিনন্দন! সম্পূর্ণ ফ্রি ডেলিভারি পাচ্ছেন!' : 'Your order qualifies for FREE Delivery!'}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 inline" />
              </span>
            ) : (
              <span className="text-gray-800 font-medium">
                {isBengali ? (
                  <>
                    আর মাত্র{' '}
                    <strong className="font-extrabold text-[#b12704] font-mono">
                      ₹{toBengaliNumerals(shortfall)}
                    </strong>
                    -এর বই কিনলেই পাচ্ছেন{' '}
                    <span className="font-bold text-emerald-700">ফ্রি ডেলিভারি!</span>
                  </>
                ) : (
                  <>
                    Add{' '}
                    <strong className="font-extrabold text-[#b12704] font-mono">
                      ₹{shortfall}
                    </strong>{' '}
                    more to qualify for <span className="font-bold text-emerald-700">FREE Delivery</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Small Target Badge */}
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600 shrink-0">
          {isBengali ? `লক্ষ্য: ₹${toBengaliNumerals(threshold)}` : `Goal: ₹${threshold}`}
        </span>
      </div>

      {/* Progress Track */}
      <div className="mt-2.5">
        <div className="w-full h-2.5 bg-gray-200/80 rounded-full overflow-hidden shadow-inner relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isQualified
                ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold mt-1 font-mono">
          <span>{formatINR(currentAmount, language)}</span>
          <span>{percentage}%</span>
          <span>{formatINR(threshold, language)}</span>
        </div>
      </div>
    </div>
  );
};
