'use client';

import React from 'react';
import { BookOpen, BookMarked, Layers, Check } from 'lucide-react';
import { FacetOption } from '@/types/catalog-filter';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface BindingFormatFilterProps {
  options: FacetOption[];
  selectedFormats: string[];
  onToggleFormat: (formatId: string) => void;
  isBengali?: boolean;
}

/**
 * Task 14: Binding Format Filter with full ARIA keyboard accessibility
 * Supports Paperback, Hardcover, and Combo Bundle with zero-trap protection.
 */
export const BindingFormatFilter: React.FC<BindingFormatFilterProps> = ({
  options,
  selectedFormats,
  onToggleFormat,
  isBengali = true,
}) => {
  const formatMetadata: Record<
    string,
    {
      icon: React.ComponentType<{ className?: string }>;
      subtitleBn: string;
      subtitleEn: string;
    }
  > = {
    paperback: {
      icon: BookOpen,
      subtitleBn: 'হালকা ও সাশ্রয়ী সাধারণ বাঁধাই',
      subtitleEn: 'Lightweight & budget-friendly softcover',
    },
    hardcover: {
      icon: BookMarked,
      subtitleBn: 'মজবুত বোর্ড বাঁধাই ও দীর্ঘস্থায়ী',
      subtitleEn: 'Durable library binding for long-term use',
    },
    bundle: {
      icon: Layers,
      subtitleBn: 'কমপ্লিট বইয়ের সেট ও প্র্যাকটিস প্যাকেজ',
      subtitleEn: 'Complete multi-book preparation package',
    },
  };

  return (
    <div className="space-y-1.5 select-none" role="group" aria-label={isBengali ? 'বাঁধাইয়ের ধরন ফিল্টার' : 'Binding format filter'}>
      {options.map((option) => {
        const isChecked = selectedFormats.includes(option.id);
        const meta = formatMetadata[option.id] || {
          icon: BookOpen,
          subtitleBn: 'স্ট্যান্ডার্ড ফরম্যাট',
          subtitleEn: 'Standard format',
        };
        const IconComponent = meta.icon;
        const disabled = option.disabled || (option.count === 0 && !isChecked);

        return (
          <div
            key={option.id}
            role="checkbox"
            aria-checked={isChecked}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && onToggleFormat(option.id)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!disabled) onToggleFormat(option.id);
              }
            }}
            className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all select-none focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              disabled
                ? 'opacity-35 cursor-not-allowed bg-gray-50 border-gray-100'
                : isChecked
                ? 'bg-amber-50/80 border-amber-500 shadow-2xs text-amber-950 cursor-pointer'
                : 'border-gray-200/80 hover:border-amber-300 hover:bg-gray-50/80 text-gray-700 cursor-pointer'
            }`}
          >
            {/* Format Icon with background */}
            <div
              className={`p-1.5 rounded-md shrink-0 transition-colors ${
                isChecked
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </div>

            {/* Label and Subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 leading-snug">
                <span className={`text-xs font-semibold ${isChecked ? 'text-amber-950' : 'text-gray-900'}`}>
                  {isBengali ? option.labelBn : option.label}
                </span>

                <span className="text-[10px] text-gray-400 font-normal shrink-0">
                  ({isBengali ? toBengaliNumerals(option.count) : option.count})
                </span>
              </div>

              <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                {isBengali ? meta.subtitleBn : meta.subtitleEn}
              </p>
            </div>

            {/* Selection Checkbox indicator */}
            <div
              className={`w-3.5 h-3.5 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                isChecked
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
