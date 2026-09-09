'use client';

import React from 'react';

interface SearchResultsLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  activeChips?: React.ReactNode;
  children: React.ReactNode;
  pagination?: React.ReactNode;
}

export const SearchResultsLayout: React.FC<SearchResultsLayoutProps> = ({
  sidebar,
  header,
  activeChips,
  children,
  pagination,
}) => {
  return (
    <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Top Header Controls (Title, Counter, View Toggle, Sort) */}
      <div className="mb-4">{header}</div>

      {/* Optional Active Filter Chips Bar */}
      {activeChips && <div className="mb-4">{activeChips}</div>}

      {/* Dual-Column Main Content Framework */}
      <div className="flex items-start gap-6 lg:gap-8">
        {/* Left Column: Dedicated 260px Desktop Sticky Filter Sidebar */}
        <aside
          aria-label="Filter Catalog"
          className="hidden md:block w-64 xl:w-72 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 pb-8 scrollbar-thin scrollbar-thumb-gray-200"
        >
          {sidebar}
        </aside>

        {/* Right Column: Full Search Results Grid/List Area */}
        <main id="search-results-main" className="flex-1 min-w-0">
          {children}

          {/* Pagination Slot */}
          {pagination && <div className="mt-8">{pagination}</div>}
        </main>
      </div>
    </div>
  );
};
