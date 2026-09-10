'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Search, ArrowUpRight } from 'lucide-react';
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
  displayedResults?: number;
  page?: number;
  pageSize?: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isBengali?: boolean;
}

/**
 * Task 7: Search Results Summary Header with Amazon-style counter & breadcrumbs
 * Supports true page slicing range, mobile view toggle, and category breadcrumb navigation.
 */
export const ResultSummaryHeader: React.FC<ResultSummaryHeaderProps> = ({
  query,
  categoryName,
  categorySlug,
  totalResults,
  page = 1,
  pageSize = 24,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  isBengali = true,
}) => {
  const startIndex = totalResults === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalResults);
  const isPaginated = totalResults > pageSize;

  return (
    <header className="space-y-3 select-none">
      {/* 1. Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-amber-700 flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>{isBengali ? 'হোম' : 'Home'}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <Link href="/search" className="hover:text-amber-700 text-gray-600 transition-colors">
          {isBengali ? 'বই অনুসন্ধান' : 'Search Results'}
        </Link>
        {categoryName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-700 font-medium truncate max-w-[150px] sm:max-w-xs">
              {categoryName}
            </span>
          </>
        )}
        {query && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-bold text-gray-900 truncate max-w-[180px] sm:max-w-xs">
              ‘{query}’
            </span>
          </>
        )}
      </nav>

      {/* 2. Main Summary & Action Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          {/* Department / Category Pill */}
          <div className="flex items-center gap-2 mb-1">
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
          <h1
            aria-live="polite"
            aria-atomic="true"
            className="text-base sm:text-lg lg:text-xl font-black text-gray-950 tracking-tight flex flex-wrap items-baseline gap-1.5 sm:gap-2"
          >
            {query ? (
              <span>
                ‘<span className="text-amber-600">{query}</span>’ {isBengali ? 'অনুসন্ধানের ফলাফল' : 'Results'}
              </span>
            ) : categoryName ? (
              <span>{categoryName}</span>
            ) : (
              <span>{isBengali ? 'সকল উপলব্ধ বইসমূহ' : 'All Available Books'}</span>
            )}

            {/* Amazon Counter: Exact Pagination Range */}
            <span className="text-gray-500 text-xs sm:text-sm font-semibold">
              {isPaginated ? (
                isBengali
                  ? `(${toBengaliNumerals(startIndex)}–${toBengaliNumerals(endIndex)}টি বই প্রদর্শিত, মোট ${toBengaliNumerals(totalResults)}টির মধ্যে)`
                  : `(Showing ${startIndex}–${endIndex} of ${totalResults} results)`
              ) : (
                isBengali
                  ? `(মোট ${toBengaliNumerals(totalResults)}টি ফলাফল)`
                  : `(${totalResults} results found)`
              )}
            </span>
          </h1>

          <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
            {isBengali
              ? 'নেতাজি সুভাষ রোড, ইংলিশ বাজার কাউন্টার থেকে সরাসরি স্টকে থাকা ১০০% আসল বই।'
              : '100% genuine verified books ready for dispatch from English Bazar, Malda.'}
          </p>
        </div>

        {/* Right Side: Share, View Mode Toggle & Desktop Sort Menu */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 shrink-0 pt-2 md:pt-0 border-t border-gray-100 md:border-t-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Share Filtered Search Link (Task 33) */}
            <ShareSearchButton isBengali={isBengali} />

            {/* Grid/List View Toggle (Available on ALL screen sizes - Task 2) */}
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
