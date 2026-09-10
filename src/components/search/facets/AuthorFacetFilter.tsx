'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Check, Plus, Minus, UserCheck } from 'lucide-react';
import { FacetOption } from '@/types/catalog-filter';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface AuthorFacetFilterProps {
  options: FacetOption[];
  selectedAuthors: string[];
  onToggleAuthor: (authorId: string) => void;
  isBengali?: boolean;
}

export const AuthorFacetFilter: React.FC<AuthorFacetFilterProps> = ({
  options,
  selectedAuthors,
  onToggleAuthor,
  isBengali = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const defaultLimit = 5;

  // Filter authors in real-time and demote zero-match options (Task 21 & 22)
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = options;

    if (q) {
      list = options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.labelBn.toLowerCase().includes(q) ||
          opt.id.toLowerCase().includes(q)
      );
    }

    // Zero-Match Demotion (Task 22):
    // 1. Items with count > 0 sorted by count desc
    // 2. Items with count === 0 demoted to bottom
    // Stable order is preserved so checking an author does not displace items under the user's cursor
    return [...list].sort((a, b) => {
      const aHasCount = a.count > 0;
      const bHasCount = b.count > 0;
      if (aHasCount && !bHasCount) return -1;
      if (!aHasCount && bHasCount) return 1;

      return b.count - a.count;
    });
  }, [options, searchQuery]);

  // Determine visible authors based on expansion or search query
  const visibleOptions = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return filteredOptions; // Show all matching search results
    }
    return isExpanded ? filteredOptions : filteredOptions.slice(0, defaultLimit);
  }, [filteredOptions, isExpanded, searchQuery]);

  const hasMore = !searchQuery.trim() && options.length > defaultLimit;
  const remainingCount = options.length - defaultLimit;

  return (
    <div className="space-y-2 select-none">
      {/* In-filter Live Mini Search Box (Task 12) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
          <Search className="w-3.5 h-3.5" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isBengali ? 'লেখক খুঁজুন...' : 'Search authors...'}
          className="w-full pl-7 pr-7 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-600 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear author search"
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Selected Authors Counter Header if any active */}
      {selectedAuthors.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-amber-700" />
            <span>
              {isBengali
                ? `${toBengaliNumerals(selectedAuthors.length)} জন লেখক নির্বাচিত`
                : `${selectedAuthors.length} author(s) selected`}
            </span>
          </span>
        </div>
      )}

      {/* Authors Checkbox List */}
      <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
        {visibleOptions.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic py-2 text-center">
            {isBengali ? 'কোনো লেখক পাওয়া যায়নি' : 'No authors found'}
          </p>
        ) : (
          visibleOptions.map((opt) => {
            const isChecked = selectedAuthors.includes(opt.id);
            const disabled = opt.disabled || (opt.count === 0 && !isChecked);

            return (
              <label
                key={opt.id}
                className={`flex items-start gap-2 py-1 px-1.5 rounded text-xs transition-colors cursor-pointer ${
                  disabled
                    ? 'opacity-35 cursor-not-allowed'
                    : isChecked
                    ? 'bg-amber-50/90 text-amber-950 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-950'
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
                  onChange={() => onToggleAuthor(opt.id)}
                  className="sr-only"
                />

                <div className="flex-1 flex items-baseline justify-between gap-1 leading-snug">
                  <span className="truncate">
                    {isBengali ? opt.labelBn : opt.label}
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal shrink-0">
                    ({isBengali ? toBengaliNumerals(opt.count) : opt.count})
                  </span>
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* "+ আরও XX জন দেখুন" / "সংক্ষিপ্ত করুন" Expander (Task 12) */}
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
                  ? `+ আরও ${toBengaliNumerals(remainingCount)} জন দেখুন`
                  : `+${remainingCount} more`}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
