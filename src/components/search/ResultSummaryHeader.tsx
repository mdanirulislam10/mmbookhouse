'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Search, ArrowUpDown, ArrowUpRight } from 'lucide-react';
import { ViewMode, SortOption } from '@/types/catalog-filter';
import { ViewModeToggle } from './ViewModeToggle';
import { AmazonSortDropdown } from './AmazonSortDropdown';
import { ShareSearchButton } from './ShareSearchButton';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface ResultSummaryHeaderProps {
  query: string;
  categoryName?: string;
  categorySlug?: string;
  totalResults: number;
  displayedResults: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isBengali?: boolean;
}

export const ResultSummaryHeader: React.FC<ResultSummaryHeaderProps> = ({
  query,
  categoryName,
  categorySlug,
  totalResults,
  displayedResults,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  isBengali = true,
}) => {
  return (
    <header className="space-y-3.5 select-none">
      {/* 1. Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-amber-700 flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>{isBengali ? 'হোম' : 'Home'}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-600">{isBengali ? 'বই অনুসন্ধান' : 'Search Results'}</span>
        {query && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-bold text-gray-900 truncate max-w-[180px] sm:max-w-xs">
              ‘{query}’
            </span>
          </>
        )}
      </nav>

      {/* 2. Main Summary & Action Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Department / Category Pill */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100/80 text-amber-900">
              <Search className="w-3 h-3 text-amber-700" />
              <span>{isBengali ? 'বই ক্যাটালগ' : 'Book Catalog'}</span>
            </span>
            {categoryName && (
              categorySlug ? (
                <Link
                  href={`/category/${categorySlug}`}
                  title={isBengali ? 'স্থায়ী বিভাগীয় পেজ দেখুন' : 'View dedicated category page'}
                  className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 transition-colors"
                >
                  <span>{categoryName}</span>
                  <ArrowUpRight className="w-3 h-3 text-blue-600" />
                </Link>
              ) : (
                <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/80">
                  {categoryName}
                </span>
              )
            )}
          </div>

          {/* Result Counter Headline (Task 7) */}
          <h1 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight flex flex-wrap items-baseline gap-2">
            {query ? (
              <span>
                ‘<span className="text-amber-600">{query}</span>’ {isBengali ? 'অনুসন্ধানের ফলাফল' : 'Results'}
              </span>
            ) : (
              <span>{isBengali ? 'সকল উপলব্ধ বইসমূহ' : 'All Available Books'}</span>
            )}

            {/* Amazon Counter (BUG-M6-R3-2 fix): If paginated show range, otherwise show total */}
            <span className="text-gray-500 text-xs sm:text-sm font-semibold">
              {displayedResults < totalResults ? (
                isBengali
                  ? `(১–${toBengaliNumerals(displayedResults)}টি বই প্রদর্শিত, মোট ${toBengaliNumerals(totalResults)}টির মধ্যে)`
                  : `(Showing 1–${displayedResults} of ${totalResults} results)`
              ) : (
                isBengali
                  ? `(মোট ${toBengaliNumerals(totalResults)}টি ফলাফল)`
                  : `(${totalResults} results found)`
              )}
            </span>
          </h1>

          <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
            {isBengali
              ? 'নেতাজি সুভাষ রোড, ইংলিশ বাজার কাউন্টার থেকে সরাসরি স্টকে থাকা ১০০% আসল বই।'
              : '100% genuine verified books ready for dispatch from English Bazar, Malda.'}
          </p>
        </div>

        {/* Right Side: Share, View Mode Toggle & Desktop Sort Menu (Tasks 24 & 33) */}
        <div className="flex items-center gap-2.5 sm:gap-3 self-end md:self-auto shrink-0">
          {/* Share Filtered Search Link (Task 33) */}
          <ShareSearchButton isBengali={isBengali} />

          {/* Grid/List View Toggle Button Group */}
          <div className="hidden sm:block">
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              isBengali={isBengali}
            />
          </div>

          {/* Desktop Sort By Dropdown (Task 24) */}
          <div className="hidden md:block">
            <AmazonSortDropdown
              sortBy={sortBy}
              onSortChange={onSortChange}
              isBengali={isBengali}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
