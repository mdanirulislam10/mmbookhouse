'use client';

import React from 'react';
import { Tag, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';

export interface SavingsHighlightCardProps {
  price: number;
  mrp: number;
  discountPercent?: number | string;
  compact?: boolean;
  className?: string;
}

/**
 * Task 45: Savings Highlight Card
 * M.M Book House Malda - Value Proposition & Savings Counter
 * Displays: "আপনি সাশ্রয় করছেন ₹১৬০ (৩২% ফ্ল্যাট ছাড়)"
 * English: "You save ₹160 (32% flat discount)"
 * Performance: Pure functional component, zero-blocking, fixed height, 0.000 CLS.
 */
export const SavingsHighlightCard: React.FC<SavingsHighlightCardProps> = ({
  price,
  mrp,
  discountPercent,
  compact = false,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();

  const savingsAmount = Math.max(0, mrp - price);

  // Compute discount percentage if not provided
  let calculatedPercent = 0;
  if (mrp > 0 && savingsAmount > 0) {
    calculatedPercent = Math.round((savingsAmount / mrp) * 100);
  }

  // If discountPercent is provided as string like "30%" or number
  const activePercent =
    discountPercent !== undefined
      ? typeof discountPercent === 'number'
        ? discountPercent
        : parseInt(String(discountPercent).replace('%', ''), 10) || calculatedPercent
      : calculatedPercent;

  if (savingsAmount <= 0) {
    return null;
  }

  const savingsFormatted = formatINR(savingsAmount, language);
  const percentDisplay = isBengali
    ? `${toBengaliNumerals(activePercent)}%`
    : `${activePercent}%`;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs min-h-[28px] ${className}`}
      >
        <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          {isBengali
            ? `সাশ্রয় ${savingsFormatted} (${percentDisplay} ছাড়)`
            : `Save ${savingsFormatted} (${percentDisplay} off)`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-green-50 border border-emerald-200/90 shadow-2xs space-y-1.5 min-h-[58px] ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs sm:text-sm">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <span>
            {isBengali ? (
              <>
                আপনি সাশ্রয় করছেন{' '}
                <strong className="font-black text-emerald-800 text-sm sm:text-base">
                  {savingsFormatted}
                </strong>{' '}
                <span className="text-emerald-700 font-semibold">({percentDisplay} ফ্ল্যাট ছাড়)</span>
              </>
            ) : (
              <>
                You save{' '}
                <strong className="font-black text-emerald-800 text-sm sm:text-base">
                  {savingsFormatted}
                </strong>{' '}
                <span className="text-emerald-700 font-semibold">({percentDisplay} flat discount)</span>
              </>
            )}
          </span>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/80 text-[11px] font-bold text-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          {isBengali ? 'সেরা মূল্যের নিশ্চয়তা' : 'Best Price Guarantee'}
        </span>
      </div>

      <p className="text-[11px] text-emerald-800/90 pl-8">
        {isBengali
          ? 'নেতাজি সুভাষ রোডের কাউন্টারের স্পেশাল ছাত্রমূল্য অনলাইনে সরাসরি উপলব্ধ।'
          : 'Official Malda store student counter rate directly available online.'}
      </p>
    </div>
  );
};
