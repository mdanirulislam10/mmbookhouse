'use client';

import React, { useState, useMemo } from 'react';
import { Check, ArrowUpDown, Search, X, Plus, Minus, MapPin } from 'lucide-react';
import { FacetOption } from '@/types/catalog-filter';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface PublisherFacetFilterProps {
  options: FacetOption[];
  selectedPublishers: string[];
  onTogglePublisher: (publisherId: string) => void;
  isBengali?: boolean;
}

export const PublisherFacetFilter: React.FC<PublisherFacetFilterProps> = ({
  options,
  selectedPublishers,
  onTogglePublisher,
  isBengali = true,
}) => {
  const [sortMode, setSortMode] = useState<'popular' | 'alpha'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const defaultLimit = 5;

  // Origin badges for prominent regional presses
  const getPublisherRegion = (name: string): string | null => {
    if (name.includes('এম.এম') || name.includes('মালদা')) return 'মালদা';
    if (name.includes('বিশ্বভারতী')) return 'শান্তিনিকেতন';
    if (
      name.includes('দে’জ') ||
      name.includes('আনন্দ') ||
      name.includes('ছায়া') ||
      name.includes('পারুল') ||
      name.includes('মিত্র') ||
      name.includes('মৌলিক') ||
      name.includes('পর্ষদ')
    ) {
      return 'কলকাতা';
    }
    return null;
  };

  // Filter and sort options
  const sortedAndFilteredOptions = useMemo(() => {
    let result = [...options];

    // Filter by quick search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.labelBn.toLowerCase().includes(q) ||
          opt.id.toLowerCase().includes(q)
      );
    }

    // Zero-Match Demotion (Task 22):
    // 1. Selected items stay at top
    // 2. Active items (count > 0) sorted by user's chosen mode (popular or alpha)
    // 3. Zero-match items (count === 0) demoted to the bottom
    return result.sort((a, b) => {
      const aSelected = selectedPublishers.includes(a.id);
      const bSelected = selectedPublishers.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      const aHasCount = a.count > 0;
      const bHasCount = b.count > 0;
      if (aHasCount && !bHasCount) return -1;
      if (!aHasCount && bHasCount) return 1;

      if (sortMode === 'popular') {
        return b.count - a.count;
      } else {
        return (a.labelBn || a.label).localeCompare(b.labelBn || b.label, 'bn');
      }
    });
  }, [options, searchQuery, sortMode, selectedPublishers]);

  // Determine visible options
  const visibleOptions = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return sortedAndFilteredOptions;
    }
    return isExpanded
      ? sortedAndFilteredOptions
      : sortedAndFilteredOptions.slice(0, defaultLimit);
  }, [sortedAndFilteredOptions, isExpanded, searchQuery]);

  const hasMore = !searchQuery.trim() && options.length > defaultLimit;
  const remainingCount = options.length - defaultLimit;

  return (
    <div className="space-y-2 select-none">
      {/* Top Controls: Search and Popularity / Alphabetical Sort Toggle (Task 13) */}
      <div className="flex items-center gap-1.5 justify-between">
        {/* Mini Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
            <Search className="w-3 h-3" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBengali ? 'প্রকাশনী খুঁজুন...' : 'Search publisher...'}
            className="w-full pl-6 pr-6 py-1 text-[11px] bg-gray-50 border border-gray-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-amber-600 focus:bg-white text-gray-800 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-1.5 flex items-center text-gray-400 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sort Switch Button */}
        <button
          type="button"
          onClick={() => setSortMode((prev) => (prev === 'popular' ? 'alpha' : 'popular'))}
          title={isBengali ? 'জনপ্রিয়তা বা বর্ণানুক্রমিক সাজান' : 'Sort by popularity or A-Z'}
          className="px-1.5 py-1 text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
        >
          <ArrowUpDown className="w-2.5 h-2.5 text-amber-700" />
          <span>{sortMode === 'popular' ? (isBengali ? 'জনপ্রিয়' : 'Top') : (isBengali ? 'অ-আ / A-Z' : 'A-Z')}</span>
        </button>
      </div>

      {/* Publishers Checkbox List */}
      <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
        {visibleOptions.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic py-2 text-center">
            {isBengali ? 'কোনো প্রকাশনী পাওয়া যায়নি' : 'No publishers found'}
          </p>
        ) : (
          visibleOptions.map((opt) => {
            const isChecked = selectedPublishers.includes(opt.id);
            const disabled = opt.disabled || (opt.count === 0 && !isChecked);
            const region = getPublisherRegion(opt.labelBn || opt.label);

            return (
              <label
                key={opt.id}
                className={`flex items-start gap-2 py-1 px-1.5 rounded text-xs transition-colors select-none ${
                  disabled
                    ? 'opacity-35 cursor-not-allowed'
                    : isChecked
                    ? 'bg-amber-50/90 text-amber-950 font-semibold cursor-pointer'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-950 cursor-pointer'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                    isChecked
                      ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>

                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => onTogglePublisher(opt.id)}
                  className="sr-only"
                />

                <div className="flex-1 flex items-baseline justify-between gap-1 leading-snug">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="truncate">
                      {isBengali ? opt.labelBn : opt.label}
                    </span>
                    {region && (
                      <span className="shrink-0 text-[9px] px-1 py-0.2 rounded bg-gray-100 text-gray-500 font-medium">
                        {region}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-400 font-normal shrink-0">
                    ({isBengali ? toBengaliNumerals(opt.count) : opt.count})
                  </span>
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* "+ আরও দেখুন" Expander (Task 13) */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline pt-0.5 pl-1 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              <Minus className="w-3 h-3" />
              <span>{isBengali ? 'সংক্ষিপ্ত করুন' : 'See less'}</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>
                {isBengali
                  ? `+ আরও ${toBengaliNumerals(remainingCount)}টি প্রকাশনী দেখুন`
                  : `+${remainingCount} more`}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
