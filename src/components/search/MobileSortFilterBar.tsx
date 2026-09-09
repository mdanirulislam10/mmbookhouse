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
      {/* Fixed Sticky Action Bar at Bottom on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-3 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2">
        {/* Sort Trigger Button */}
        <button
          type="button"
          onClick={() => setIsSortSheetOpen(true)}
          className="flex-1 py-2.5 px-3 rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-2 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
        >
          <ArrowUpDown className="w-4 h-4 text-amber-600" />
          <span>{isBengali ? 'সাজান (Sort)' : 'Sort By'}</span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={onOpenFilterDrawer}
          className="flex-1 py-2.5 px-3 rounded-lg bg-gray-900 hover:bg-black active:bg-gray-800 text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>{isBengali ? 'ফিল্টার' : 'Filter'}</span>
          {activeFiltersCount > 0 && (
            <span className="bg-amber-500 text-gray-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
              {isBengali ? toBengaliNumerals(activeFiltersCount) : activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Sort Sheet Modal */}
      {isSortSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
        >
          <div
            className="flex-1 w-full"
            onClick={() => setIsSortSheetOpen(false)}
            aria-hidden="true"
          />

          <div className="w-full bg-white rounded-t-2xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-amber-600" />
                <span>{isBengali ? 'ফলাফল অনুযায়ী সাজান' : 'Sort Results By'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSortSheetOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
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
                    {isSelected && <Check className="w-4 h-4 text-amber-600" />}
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
