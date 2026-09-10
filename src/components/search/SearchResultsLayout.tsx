'use client';

import React from 'react';

interface SearchResultsLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  activeChips?: React.ReactNode;
  children: React.ReactNode;
  pagination?: React.ReactNode;
}

/**
 * Task 1: Dual-Column Responsive Grid Layout Framework
 * Left: 260–280px sticky facet sidebar with responsive header clearance.
 * Right: Main search results grid/list area with localized active chips and pagination bar.
 */
export const SearchResultsLayout: React.FC<SearchResultsLayoutProps> = ({
  sidebar,
  header,
  activeChips,
  children,
  pagination,
}) => {
  return (
    <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-5">
      {/* Top Header Controls (Breadcrumbs, Title, Counter, View Toggle, Sort) */}
      <div className="mb-3.5">{header}</div>

      {/* Dual-Column Main Content Framework */}
      <div className="flex items-start gap-5 lg:gap-7">
        {/* Left Column: Dedicated 260px–280px Desktop Sticky Filter Sidebar */}
        <aside
          aria-label="Filter Catalog"
          className="hidden md:block w-64 xl:w-72 shrink-0 sticky top-28 max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-1 pb-8 scrollbar-thin scrollbar-thumb-gray-200"
        >
          {sidebar}
        </aside>

        {/* Right Column: Active Chips + Main Search Results + Pagination */}
        <main id="search-results-main" className="flex-1 min-w-0">
          {/* Active Filter Chips Bar directly above the results grid */}
          {activeChips && <div className="mb-3.5">{activeChips}</div>}

          {/* Product Grid / List Content */}
          {children}

          {/* Amazon Classic Numbered Pagination Slot */}
          {pagination && <div className="mt-8">{pagination}</div>}
        </main>
      </div>
    </div>
  );
};
