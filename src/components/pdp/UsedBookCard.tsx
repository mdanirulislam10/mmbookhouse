'use client';

import React, { useState } from 'react';
import { UsedBookCondition } from '@/types/pdp';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { BookMarked, CheckCircle, Info, ChevronDown } from 'lucide-react';

interface UsedBookCardProps {
  usedOption?: UsedBookCondition;
  onSelectUsed?: () => void;
  isSelected?: boolean;
  className?: string;
}

export const UsedBookCard: React.FC<UsedBookCardProps> = ({
  usedOption,
  onSelectUsed,
  isSelected = false,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();
  const [showNote, setShowNote] = useState(false);

  if (!usedOption || !usedOption.isAvailable) return null;

  const savings = Math.max(0, usedOption.mrp - usedOption.price);

  return (
    <div
      onClick={onSelectUsed}
      className={`rounded-xl border p-3.5 transition-all cursor-pointer select-none ${
        isSelected
          ? 'border-amber-500 bg-amber-50/60 shadow-2xs ring-2 ring-amber-200'
          : 'border-dashed border-gray-300 hover:border-amber-400 bg-gray-50/60 hover:bg-white'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-100 text-orange-800">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">
                {isBengali ? 'ব্যবহৃত / পুরাতন বইয়ের অপশন' : 'Used / Pre-owned Option'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900">
                {isBengali ? 'সাশ্রয়ী বিকল্প' : 'Budget Saver'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isBengali ? usedOption.conditionNoteBn : usedOption.conditionNote}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-black text-gray-900">
            {formatINR(usedOption.price, language)}
          </div>
          <div className="text-[10px] text-gray-400 line-through">
            {formatINR(usedOption.mrp, language)}
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px]">
        <span className="text-emerald-700 font-bold">
          {isBengali
            ? `অতিরিক্ত ${formatINR(savings, language)} সাশ্রয়`
            : `Save extra ${formatINR(savings, language)}`}
        </span>

        {usedOption.sellerName && (
          <span className="text-gray-500">
            {isBengali ? 'বিক্রেতা: ' : 'Seller: '}
            <strong className="text-gray-700">{usedOption.sellerName}</strong>
          </span>
        )}
      </div>
    </div>
  );
};
