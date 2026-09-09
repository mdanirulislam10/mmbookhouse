'use client';

import React from 'react';
import { Sparkles, Recycle, Check, Tag, ShieldCheck } from 'lucide-react';
import { FacetOption } from '@/types/catalog-filter';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface BookConditionFilterProps {
  options: FacetOption[];
  selectedConditions: string[];
  onToggleCondition: (conditionId: string) => void;
  isBengali?: boolean;
}

export const BookConditionFilter: React.FC<BookConditionFilterProps> = ({
  options,
  selectedConditions,
  onToggleCondition,
  isBengali = true,
}) => {
  const conditionMeta: Record<
    string,
    {
      icon: React.ComponentType<{ className?: string }>;
      badgeBn: string;
      badgeEn: string;
      descBn: string;
      descEn: string;
      highlightBadge?: string;
    }
  > = {
    new: {
      icon: Sparkles,
      badgeBn: 'নতুন বই',
      badgeEn: 'New Edition',
      descBn: 'সরাসরি প্রেস থেকে আসা ব্র্যান্ড নিউ ফ্রেশ প্রিন্ট',
      descEn: 'Brand new, untouched direct publisher copy',
      highlightBadge: 'ফ্রেশ প্রিন্ট',
    },
    used: {
      icon: Recycle,
      badgeBn: 'ব্যবহৃত বই (সেকেন্ড-হ্যান্ড)',
      badgeEn: 'Used / Pre-owned',
      descBn: '১০০% ভেরিফাইড পূর্ণাঙ্গ পেজ, শিক্ষার্থীদের জন্য ৫০-৭০% সাশ্রয়',
      descEn: 'Verified complete pages, saves 50–70% for students',
      highlightBadge: 'বাজেট সেভার',
    },
  };

  return (
    <div className="space-y-2 select-none">
      {options.map((option) => {
        const isChecked = selectedConditions.includes(option.id);
        const meta = conditionMeta[option.id] || {
          icon: Sparkles,
          badgeBn: option.labelBn,
          badgeEn: option.label,
          descBn: 'স্ট্যান্ডার্ড বই',
          descEn: 'Standard condition',
        };
        const IconComponent = meta.icon;
        const isUsed = option.id === 'used';
        const disabled = option.disabled || option.count === 0;

        return (
          <div
            key={option.id}
            onClick={() => !disabled && onToggleCondition(option.id)}
            className={`relative p-2.5 rounded-lg border transition-all cursor-pointer ${
              disabled
                ? 'opacity-35 cursor-not-allowed bg-gray-50 border-gray-100'
                : isChecked
                ? 'bg-amber-50/90 border-amber-600 shadow-2xs'
                : 'border-gray-200/90 hover:border-amber-300 hover:bg-gray-50/70'
            }`}
          >
            {/* Top row: Icon, Name, and Highlights Badge */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1 rounded-md ${
                    isChecked
                      ? 'bg-amber-600 text-white'
                      : isUsed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>

                <span className={`text-xs font-bold ${isChecked ? 'text-amber-950' : 'text-gray-900'}`}>
                  {isBengali ? meta.badgeBn : meta.badgeEn}
                </span>

                {meta.highlightBadge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                      isUsed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {isUsed ? <Tag className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                    <span>{meta.highlightBadge}</span>
                  </span>
                )}
              </div>

              {/* Selection Checkbox */}
              <div
                className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-all ${
                  isChecked
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>

            {/* Description note */}
            <p className="text-[10px] text-gray-500 leading-normal pl-7">
              {isBengali ? meta.descBn : meta.descEn}
            </p>

            {/* Book Count Footer */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 pl-7 mt-1">
              <span>{isBengali ? 'উপলব্ধ স্টক:' : 'Available Stock:'}</span>
              <span className="font-semibold text-gray-700">
                {isBengali ? toBengaliNumerals(option.count) : option.count} টি বই
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
