'use client';

import React from 'react';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { AlertCircle } from 'lucide-react';

interface DealClaimBarProps {
  claimedPercentage: number;
  totalStock?: number;
  claimedStock?: number;
  isExpired?: boolean;
  className?: string;
}

/**
 * Task 23: Limited Stock "Claim Meter" Progress Bar
 * Displays Amazon signature orange progress fill and urgency indicator
 */
export const DealClaimBar: React.FC<DealClaimBarProps> = ({
  claimedPercentage,
  totalStock,
  claimedStock,
  isExpired = false,
  className = '',
}) => {
  const safePercentage = Math.min(100, Math.max(0, claimedPercentage));
  const remainingStock = totalStock && claimedStock ? Math.max(0, totalStock - claimedStock) : null;
  const isAlmostGone = safePercentage >= 80;

  if (isExpired) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div className="bg-gray-400 h-full w-full" />
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-500 font-bengali">
          <span>ডিলের মেয়াদ শেষ</span>
          <span>১০০% ক্লোজড</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={safePercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="ডিল স্টক ক্লেইম মিটার"
        className="w-full bg-gray-200 h-2 sm:h-2.5 rounded-full overflow-hidden border border-gray-300/40 shadow-inner"
      >
        <div
          className={`h-full transition-all duration-700 ease-out rounded-full ${
            isAlmostGone
              ? 'bg-gradient-to-r from-amber-500 to-[#cc0c39]'
              : 'bg-gradient-to-r from-amber-400 to-[#e47911]'
          }`}
          style={{ width: `${safePercentage}%` }}
        />
      </div>

      {/* Claimed Status & Urgency Labels */}
      <div className="flex items-center justify-between text-[11px] font-bengali">
        <span className="font-bold text-gray-700">
          <span className={isAlmostGone ? 'text-[#cc0c39] font-black' : 'text-[#e47911] font-bold'}>
            {toBengaliNumerals(safePercentage)}%
          </span>{' '}
          বিক্রি হয়ে গেছে
        </span>

        {remainingStock !== null && (
          <span
            className={`flex items-center gap-1 font-semibold ${
              isAlmostGone ? 'text-rose-600 font-bold' : 'text-gray-500'
            }`}
          >
            {isAlmostGone && <AlertCircle className="w-3 h-3 text-rose-500 flex-shrink-0" />}
            <span>
              {isAlmostGone ? 'দ্রুত শেষ হচ্ছে! ' : ''}
              মজুত: {toBengaliNumerals(remainingStock)}টি
            </span>
          </span>
        )}
      </div>
    </div>
  );
};
