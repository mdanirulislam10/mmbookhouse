'use client';

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { ViewMode } from '@/types/catalog-filter';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isBengali?: boolean;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  isBengali = true,
}) => {
  return (
    <div
      role="group"
      aria-label={isBengali ? 'প্রদর্শন শৈলী নির্বাচন' : 'Select view mode'}
      className="inline-flex items-center p-0.5 bg-gray-100 rounded-md border border-gray-200"
    >
      <button
        type="button"
        onClick={() => onViewModeChange('grid')}
        aria-pressed={viewMode === 'grid'}
        aria-label={isBengali ? 'গ্রিড ভিউ' : 'Grid view'}
        title={isBengali ? 'গ্রিড ভিউ (কলাম)' : 'Grid view'}
        className={`p-1.5 rounded transition-all flex items-center justify-center cursor-pointer ${
          viewMode === 'grid'
            ? 'bg-white text-amber-700 shadow-2xs font-semibold'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        aria-pressed={viewMode === 'list'}
        aria-label={isBengali ? 'লিস্ট ভিউ' : 'List view'}
        title={isBengali ? 'লিস্ট ভিউ (সারি)' : 'List view'}
        className={`p-1.5 rounded transition-all flex items-center justify-center cursor-pointer ${
          viewMode === 'list'
            ? 'bg-white text-amber-700 shadow-2xs font-semibold'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
        }`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
};
