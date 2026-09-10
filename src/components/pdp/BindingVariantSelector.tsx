'use client';

import React from 'react';
import { BookVariantOption } from '@/types/catalog-filter';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { Check } from 'lucide-react';

interface BindingVariantSelectorProps {
  variants?: BookVariantOption[];
  selectedFormat: 'paperback' | 'hardcover' | 'bundle';
  onSelectFormat: (format: 'paperback' | 'hardcover' | 'bundle') => void;
  className?: string;
}

export const BindingVariantSelector: React.FC<BindingVariantSelectorProps> = ({
  variants,
  selectedFormat,
  onSelectFormat,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();

  if (!variants || variants.length <= 1) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-bold text-gray-700 block">
        {isBengali ? 'বাঁধাই ও সংস্করণ নির্বাচন করুন:' : 'Select Format & Binding:'}
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        {variants.map((variant) => {
          const isSelected = selectedFormat === variant.format;
          const discount = Math.round(
            ((variant.mrp - variant.price) / variant.mrp) * 100
          );

          return (
            <button
              key={variant.format}
              type="button"
              onClick={() => onSelectFormat(variant.format)}
              className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-2 ring-amber-200'
                  : 'border-gray-200 hover:border-amber-300 bg-white'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <p className="text-xs font-bold text-gray-900 leading-tight">
                {isBengali ? variant.formatBn : variant.format.toUpperCase()}
              </p>

              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm font-black text-[#b12704]">
                  {formatINR(variant.price, language)}
                </span>
                <span className="text-[11px] text-gray-400 line-through">
                  {formatINR(variant.mrp, language)}
                </span>
              </div>

              {discount > 0 && (
                <span className="inline-block mt-1 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                  {isBengali ? `${toBengaliNumerals(discount)}% ছাড়` : `${discount}% OFF`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
