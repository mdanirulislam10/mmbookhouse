'use client';

import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Star, Layers, Globe, BadgePercent, IndianRupee } from 'lucide-react';
import { FilterState, FacetGroup } from '@/types/catalog-filter';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface ActiveFilterChipsProps {
  filterState: FilterState;
  facetGroups: FacetGroup[];
  subCategoryLabel?: string;
  onRemoveFilter: (
    type: 'category' | 'subCategory' | 'author' | 'publisher' | 'format' | 'condition' | 'language' | 'rating' | 'discount' | 'price',
    val?: string
  ) => void;
  onClearAll: () => void;
  isBengali?: boolean;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filterState,
  facetGroups,
  subCategoryLabel,
  onRemoveFilter,
  onClearAll,
  isBengali = true,
}) => {
  const activeCount =
    (filterState.category && filterState.category !== 'all' ? 1 : 0) +
    (filterState.subCategory ? 1 : 0) +
    filterState.authors.length +
    filterState.publishers.length +
    filterState.formats.length +
    filterState.conditions.length +
    filterState.languages.length +
    (filterState.minRating > 0 ? 1 : 0) +
    (filterState.discountRange ? 1 : 0) +
    (filterState.minPrice !== undefined || filterState.maxPrice !== undefined ? 1 : 0);

  if (activeCount === 0) return null;

  // Find category label from facet groups
  const categoryOption = facetGroups
    .find((g) => g.id === 'category')
    ?.options.find((o) => o.id === filterState.category);

  const getFormatLabel = (fmt: string): string => {
    if (fmt === 'paperback') return isBengali ? 'পেপারব্যাক' : 'Paperback';
    if (fmt === 'hardcover') return isBengali ? 'হার্ডকভার' : 'Hardcover';
    if (fmt === 'bundle') return isBengali ? 'কম্বো বান্ডল' : 'Combo Bundle';
    return fmt;
  };

  const getLanguageLabel = (lang: string): string => {
    if (lang === 'bengali') return isBengali ? 'বাংলা' : 'Bengali';
    if (lang === 'english') return isBengali ? 'ইংরেজি' : 'English';
    if (lang === 'bilingual') return isBengali ? 'দ্বিভাষিক' : 'Bilingual';
    if (lang === 'hindi') return isBengali ? 'হিন্দি' : 'Hindi';
    return lang;
  };

  return (
    <div
      role="region"
      aria-label={isBengali ? 'সক্রিয় ফিল্টার তালিকা' : 'Active filters list'}
      className="flex flex-wrap items-center gap-2 p-2.5 bg-amber-50/70 border border-amber-200/90 rounded-xl animate-in fade-in duration-200"
    >
      {/* Label indicator */}
      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 pl-1 pr-0.5 shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
        <span>{isBengali ? 'সক্রিয় ফিল্টার:' : 'Active Filters:'}</span>
      </span>

      {/* 1. Category Chip */}
      {filterState.category && filterState.category !== 'all' && (
        <span className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors">
          <span className="text-[10px] text-gray-500">{isBengali ? 'বিভাগ:' : 'Dept:'}</span>
          <span className="font-semibold text-amber-900">
            {isBengali ? categoryOption?.labelBn || filterState.category : categoryOption?.label || filterState.category}
          </span>
          <button
            type="button"
            onClick={() => onRemoveFilter('category')}
            aria-label={isBengali ? 'বিভাগ ফিল্টার মুছুন' : 'Remove department filter'}
            className="p-0.5 rounded-full hover:bg-amber-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* 1.1 Sub-Category Chip (Task 11) */}
      {filterState.subCategory && (
        <span className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-amber-600 text-white shadow-2xs hover:bg-amber-700 transition-colors">
          <Layers className="w-3 h-3 text-amber-200" />
          <span className="text-[10px] text-amber-100">{isBengali ? 'শাখা:' : 'Branch:'}</span>
          <span className="font-semibold">
            {subCategoryLabel || filterState.subCategory}
          </span>
          <button
            type="button"
            onClick={() => onRemoveFilter('subCategory')}
            aria-label={isBengali ? 'উপ-বিভাগ ফিল্টার মুছুন' : 'Remove subcategory filter'}
            className="p-0.5 rounded-full hover:bg-amber-800 text-amber-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* 2. Author Chips */}
      {filterState.authors.map((author) => (
        <span
          key={author}
          className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors"
        >
          <span className="text-[10px] text-gray-500">{isBengali ? 'লেখক:' : 'Author:'}</span>
          <span className="font-semibold text-gray-900">{author}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('author', author)}
            aria-label={isBengali ? `${author} ফিল্টার মুছুন` : `Remove ${author}`}
            className="p-0.5 rounded-full hover:bg-amber-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      {/* 3. Publisher Chips */}
      {filterState.publishers.map((pub) => (
        <span
          key={pub}
          className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors"
        >
          <span className="text-[10px] text-gray-500">{isBengali ? 'প্রকাশনী:' : 'Pub:'}</span>
          <span className="font-semibold text-gray-900">{pub}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('publisher', pub)}
            aria-label={isBengali ? `${pub} ফিল্টার মুছুন` : `Remove ${pub}`}
            className="p-0.5 rounded-full hover:bg-amber-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      {/* 4. Format Chips (Task 14) */}
      {filterState.formats.map((fmt) => (
        <span
          key={fmt}
          className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors"
        >
          <span className="text-[10px] text-gray-500">{isBengali ? 'বাঁধাই:' : 'Binding:'}</span>
          <span className="font-semibold text-gray-900">{getFormatLabel(fmt)}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('format', fmt)}
            aria-label="Remove format filter"
            className="p-0.5 rounded-full hover:bg-amber-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      {/* 5. Condition Chips (Task 15) */}
      {filterState.conditions.map((cond) => (
        <span
          key={cond}
          className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors"
        >
          <span className="text-[10px] text-gray-500">{isBengali ? 'অবস্থা:' : 'Condition:'}</span>
          <span className="font-semibold text-gray-900">
            {cond === 'new' ? (isBengali ? 'নতুন বই' : 'New Edition') : (isBengali ? 'ব্যবহৃত বই (Used)' : 'Used')}
          </span>
          <button
            type="button"
            onClick={() => onRemoveFilter('condition', cond)}
            aria-label="Remove condition filter"
            className="p-0.5 rounded-full hover:bg-amber-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      {/* 5.1 Language Chips (Moderate Bug 4) */}
      {filterState.languages.map((lang) => (
        <span
          key={lang}
          className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors"
        >
          <Globe className="w-3 h-3 text-amber-700" />
          <span className="text-[10px] text-gray-500">{isBengali ? 'ভাষা:' : 'Lang:'}</span>
          <span className="font-semibold text-gray-900">{getLanguageLabel(lang)}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('language', lang)}
            aria-label={isBengali ? 'ভাষা ফিল্টার মুছুন' : 'Remove language filter'}
            className="p-0.5 rounded-full hover:bg-amber-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      {/* 6. Rating Chip */}
      {filterState.minRating > 0 && (
        <span className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors">
          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{filterState.minRating}★</span>
          </span>
          <span className="text-[10px] text-gray-500">{isBengali ? '& তদূর্ধ্ব' : '& Up'}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('rating')}
            aria-label="Remove rating filter"
            className="p-0.5 rounded-full hover:bg-amber-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* 6.1 Discount Chip (Task 17) */}
      {filterState.discountRange !== undefined && (
        <span className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-rose-200 shadow-2xs hover:border-rose-400 transition-colors">
          <BadgePercent className="w-3 h-3 text-rose-600" />
          <span className="text-[10px] text-gray-500">{isBengali ? 'ছাড়:' : 'Discount:'}</span>
          <span className="font-semibold text-rose-700">
            {isBengali ? `${toBengaliNumerals(filterState.discountRange)}%+` : `${filterState.discountRange}%+`}
          </span>
          <button
            type="button"
            onClick={() => onRemoveFilter('discount')}
            aria-label="Remove discount filter"
            className="p-0.5 rounded-full hover:bg-rose-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* 6.2 Price Range Chip (Task 19) */}
      {(filterState.minPrice !== undefined || filterState.maxPrice !== undefined) && (
        <span className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-white text-gray-800 border border-emerald-200 shadow-2xs hover:border-emerald-400 transition-colors">
          <IndianRupee className="w-3 h-3 text-emerald-600" />
          <span className="text-[10px] text-gray-500">{isBengali ? 'মূল্য:' : 'Price:'}</span>
          <span className="font-semibold text-emerald-800 font-mono">
            {filterState.minPrice !== undefined && filterState.maxPrice !== undefined
              ? `₹${isBengali ? toBengaliNumerals(filterState.minPrice) : filterState.minPrice} - ₹${isBengali ? toBengaliNumerals(filterState.maxPrice) : filterState.maxPrice}`
              : filterState.minPrice !== undefined
              ? `> ₹${isBengali ? toBengaliNumerals(filterState.minPrice) : filterState.minPrice}`
              : `< ₹${isBengali ? toBengaliNumerals(filterState.maxPrice!) : filterState.maxPrice}`}
          </span>
          <button
            type="button"
            onClick={() => onRemoveFilter('price')}
            aria-label="Remove price filter"
            className="p-0.5 rounded-full hover:bg-emerald-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* 7. Clear All Global Button */}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-auto text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-amber-100/60 transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3 h-3 text-amber-700" />
        <span>{isBengali ? 'সব ফিল্টার মুছুন' : 'Clear all'}</span>
      </button>
    </div>
  );
};
