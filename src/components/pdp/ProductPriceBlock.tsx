'use client';

import React from 'react';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { BadgePercent, Zap } from 'lucide-react';

interface ProductPriceBlockProps {
  price: number;
  mrp: number;
  discount?: string;
  className?: string;
}

export const ProductPriceBlock: React.FC<ProductPriceBlockProps> = ({
  price,
  mrp,
  discount,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();

  const savingsAmount = Math.max(0, mrp - price);
  const discountPercent =
    discount || `${Math.round(((mrp - price) / mrp) * 100)}%`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Primary Price Row */}
      <div className="flex items-baseline gap-2.5 flex-wrap">
        {/* Big Bold Offer Price */}
        <span className="text-2xl sm:text-3xl font-black text-[#b12704] tracking-tight">
          {formatINR(price, language)}
        </span>

        {/* Discount Percentage Badge */}
        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-black px-2 py-0.5 rounded-md bg-[#cc0c39]/10 text-[#cc0c39] border border-[#cc0c39]/20">
          <BadgePercent className="w-3.5 h-3.5" />
          <span>-{discountPercent} {isBengali ? 'ছাড়' : 'OFF'}</span>
        </span>
      </div>

      {/* MRP & Savings Row */}
      <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 flex-wrap">
        <span>
          {isBengali ? 'সর্বোচ্চ খুচরা মূল্য (M.R.P.): ' : 'M.R.P.: '}
          <span className="line-through text-gray-400 font-medium">
            {formatINR(mrp, language)}
          </span>
        </span>

        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {isBengali
            ? `সাশ্রয়: ${formatINR(savingsAmount, language)}`
            : `You Save: ${formatINR(savingsAmount, language)}`}
        </span>
      </div>

      <p className="text-[11px] text-gray-500">
        {isBengali
          ? 'সমস্ত কর অন্তর্ভুক্ত (Inclusive of all taxes)'
          : 'Inclusive of all taxes'}
      </p>
    </div>
  );
};
