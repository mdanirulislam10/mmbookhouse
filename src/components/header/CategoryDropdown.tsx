'use client';

import React from 'react';
import { SEARCH_CATEGORIES, SearchCategory } from '@/types/search';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface CategoryDropdownProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

const SHORT_CATEGORY_NAMES: Record<string, { bn: string; en: string }> = {
  all: { bn: 'সকল', en: 'All' },
  'wbcs-special': { bn: 'WBCS', en: 'WBCS' },
  'college-university': { bn: 'কলেজ', en: 'College' },
  'primary-tet-slst': { bn: 'TET/SLST', en: 'TET' },
  'competitive-exams': { bn: 'চাকরি', en: 'Exams' },
  'bengali-literature': { bn: 'সাহিত্য', en: 'Books' },
  'school-madhyamik': { bn: 'স্কুল', en: 'School' },
};

/**
 * Module 2 (Task 7 & Task 43): Smart Responsive Category Dropdown
 *
 * - On Mobile: Automatically hidden to reserve 100% width for search input.
 * - On Tablet (sm to lg): Condenses long department names into concise tags (e.g. "WBCS", "কলেজ").
 * - On Desktop (lg+): Displays full descriptive department title.
 */
export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const current = SEARCH_CATEGORIES.find((c) => c.id === selectedCategory) || SEARCH_CATEGORIES[0];
  const shortInfo = SHORT_CATEGORY_NAMES[current.id] || { bn: current.nameBn, en: current.name };

  return (
    <div className={`relative flex items-center bg-[#e6e6e6] hover:bg-[#d8d8d8] text-gray-800 rounded-l-md border-r border-gray-300 transition-colors cursor-pointer group shrink-0 ${className}`}>
      {/* Visual Display: Adaptive full vs condensed label */}
      <div className="flex items-center gap-1 px-2.5 sm:px-3 py-2 text-xs font-semibold select-none pointer-events-none whitespace-nowrap">
        {/* Full name on large desktop */}
        <span className="hidden xl:inline max-w-[140px] truncate text-gray-900 font-medium">
          {isBengali ? current.nameBn : current.name}
        </span>
        {/* Condensed label on tablet / mid-screen */}
        <span className="inline xl:hidden max-w-[90px] truncate text-gray-900 font-bold">
          {isBengali ? shortInfo.bn : shortInfo.en}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-900 transition-transform shrink-0 ml-0.5" />
      </div>

      {/* Accessible native select overlay */}
      <select
        aria-label="বইয়ের ক্যাটাগরি বা বিভাগ নির্বাচন করুন"
        value={selectedCategory}
        onChange={(e) => onSelectCategory(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
      >
        {SEARCH_CATEGORIES.map((cat: SearchCategory) => (
          <option key={cat.id} value={cat.id} className="text-gray-900 py-1 bg-white">
            {cat.nameBn} ({cat.name})
          </option>
        ))}
      </select>
    </div>
  );
};
