'use client';

import React from 'react';
import { Globe, Check } from 'lucide-react';
import { FacetOption } from '@/types/catalog-filter';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface LanguageFacetFilterProps {
  options: FacetOption[];
  selectedLanguages: string[];
  onToggleLanguage: (langId: string) => void;
  isBengali?: boolean;
}

/**
 * Task 16: Multilingual Catalog Filter (বহুভাষিক ক্যাটালগ ফিল্টার)
 * Supports filtering books by Bengali, English, Bilingual (EN+BN), and Hindi.
 */
export const LanguageFacetFilter: React.FC<LanguageFacetFilterProps> = ({
  options,
  selectedLanguages,
  onToggleLanguage,
  isBengali = true,
}) => {
  const getLanguageMeta = (langId: string) => {
    switch (langId) {
      case 'bengali':
        return {
          code: 'BN',
          badge: isBengali ? 'বাংলা' : 'Bengali',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'english':
        return {
          code: 'EN',
          badge: isBengali ? 'ইংরেজি' : 'English',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'bilingual':
        return {
          code: 'EN+BN',
          badge: isBengali ? 'দ্বিভাষিক' : 'Bilingual',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'hindi':
        return {
          code: 'HI',
          badge: isBengali ? 'হিন্দি' : 'Hindi',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      default:
        return {
          code: langId.toUpperCase(),
          badge: langId,
          badgeBg: 'bg-gray-50 text-gray-700 border-gray-200',
        };
    }
  };

  return (
    <div className="space-y-1.5" role="group" aria-label={isBengali ? 'ভাষা নির্বাচন' : 'Language selection'}>
      {options.map((option) => {
        const isSelected = selectedLanguages.includes(option.id);
        const disabled = option.disabled || option.count === 0;
        const meta = getLanguageMeta(option.id);

        return (
          <label
            key={option.id}
            className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg text-xs transition-all select-none ${
              disabled
                ? 'opacity-35 cursor-not-allowed bg-transparent'
                : isSelected
                ? 'bg-amber-50/90 text-amber-950 font-semibold border border-amber-200/80 shadow-2xs cursor-pointer'
                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Checkbox indicator */}
              <div
                className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              <input
                type="checkbox"
                checked={isSelected}
                disabled={disabled}
                onChange={() => onToggleLanguage(option.id)}
                className="sr-only"
                aria-label={isBengali ? option.labelBn : option.label}
              />

              {/* Language Name and Local Badge */}
              <div className="flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{isBengali ? option.labelBn : option.label}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${meta.badgeBg}`}
                >
                  {meta.code}
                </span>
              </div>
            </div>

            {/* Book count badge */}
            <span
              className={`text-[11px] font-mono tabular-nums shrink-0 ml-1 ${
                isSelected ? 'text-amber-800 font-bold' : 'text-gray-400'
              }`}
            >
              ({isBengali ? toBengaliNumerals(option.count) : option.count})
            </span>
          </label>
        );
      })}
    </div>
  );
};
