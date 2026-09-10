'use client';

import React, { useState } from 'react';
import { ArrowUpDown, SlidersHorizontal, Check, X } from 'lucide-react';
import { SortOption } from '@/types/catalog-filter';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface MobileSortFilterBarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenFilterDrawer: () => void;
  activeFiltersCount: number;
  isBengali?: boolean;
}

const SORT_OPTIONS: { id: SortOption; labelBn: string; labelEn: string }[] = [
  { id: 'relevance', labelBn: 'প্রাসঙ্গিকতা (Featured)', labelEn: 'Featured / Relevance' },
  { id: 'price-asc', labelBn: 'মূল্য: কম থেকে বেশি', labelEn: 'Price: Low to High' },
  { id: 'price-desc', labelBn: 'মূল্য: বেশি থেকে কম', labelEn: 'Price: High to Low' },
  { id: 'rating', labelBn: 'গ্রাহক রেটিং (Avg. Review)', labelEn: 'Avg. Customer Review' },
  { id: 'newest', labelBn: 'নতুন প্রকাশিত (Newest)', labelEn: 'Newest Arrivals' },
  { id: 'bestselling', labelBn: 'সেরা বিক্রিত (Best Selling)', labelEn: 'Best Selling' },
];

/**
 * Task 3: Mobile Sticky Sort & Filter Action Bar
 * Fixed above MobileBottomNav without collision, with safe area support and instant drawer trigger.
 */
export const MobileSortFilterBar: React.FC<MobileSortFilterBarProps> = ({
  sortBy,
  onSortChange,
  onOpenFilterDrawer,
  activeFiltersCount,
  isBengali = true,
}) => {
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  return (
    <>
      {/* Docked above MobileBottomNav (52px + safe area inset) to prevent overlap */}
      <aside
        aria-label={isBengali ? 'মোবাইল সর্ট ও ফিল্টার বার' : 'Mobile sort and filter bar'}
        className="md:hidden fixed left-0 right-0 z-35 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2.5 transition-all"
        style={{ bottom: 'calc(52px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Sort Trigger Button */}
        <button
          type="button"
          onClick={() => setIsSortSheetOpen(true)}
          className="flex-1 py-2 px-3 rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-2 text-xs font-bold text-gray-800 transition-colors cursor-pointer shadow-2xs"
          aria-label={isBengali ? 'ফলাফল সাজান' : 'Sort results'}
        >
          <ArrowUpDown className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{isBengali ? 'সাজান (Sort)' : 'Sort By'}</span>
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-gray-200 shrink-0" />

        {/* Filter Trigger Button with Active Count Badge */}
        <button
          type="button"
          onClick={onOpenFilterDrawer}
          className="flex-1 py-2 px-3 rounded-lg bg-gray-900 hover:bg-black active:bg-gray-800 text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          aria-label={isBengali ? 'ফিল্টার প্যানেল খুলুন' : 'Open filter panel'}
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{isBengali ? 'ফিল্টার' : 'Filter'}</span>
          {activeFiltersCount > 0 && (
            <span className="bg-amber-500 text-gray-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
              {isBengali ? toBengaliNumerals(activeFiltersCount) : activeFiltersCount}
            </span>
          )}
        </button>
      </aside>

      {/* Mobile Sort Sheet Modal */}
      {isSortSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isBengali ? 'সাজানোর বিকল্পসমূহ' : 'Sort options modal'}
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
        >
          <div
            className="flex-1 w-full"
            onClick={() => setIsSortSheetOpen(false)}
            aria-hidden="true"
          />

          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-amber-600" />
                <span>{isBengali ? 'ফলাফল অনুযায়ী সাজান' : 'Sort Results By'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSortSheetOpen(false)}
                aria-label={isBengali ? 'সর্ট প্যানেল বন্ধ করুন' : 'Close sort panel'}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1" role="radiogroup">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      onSortChange(opt.id);
                      setIsSortSheetOpen(false);
                    }}
                    className={`w-full p-3 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{isBengali ? opt.labelBn : opt.labelEn}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
