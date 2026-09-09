'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { SortOption } from '@/types/catalog-filter';

interface SortItem {
  id: SortOption;
  label: string;
  labelBn: string;
  shortLabel: string;
  shortLabelBn: string;
}

export const SORT_ITEMS: SortItem[] = [
  {
    id: 'relevance',
    label: 'Featured / Relevance',
    labelBn: 'প্রাসঙ্গিকতা (Featured)',
    shortLabel: 'Featured',
    shortLabelBn: 'প্রাসঙ্গিকতা',
  },
  {
    id: 'price-asc',
    label: 'Price: Low to High',
    labelBn: 'মূল্য: কম থেকে বেশি',
    shortLabel: 'Price: Low to High',
    shortLabelBn: 'দাম: কম থেকে বেশি',
  },
  {
    id: 'price-desc',
    label: 'Price: High to Low',
    labelBn: 'মূল্য: বেশি থেকে কম',
    shortLabel: 'Price: High to Low',
    shortLabelBn: 'দাম: বেশি থেকে কম',
  },
  {
    id: 'rating',
    label: 'Avg. Customer Review',
    labelBn: 'গ্রাহক রিভিউ ও রেটিং',
    shortLabel: 'Avg. Review',
    shortLabelBn: 'গ্রাহক রিভিউ',
  },
  {
    id: 'newest',
    label: 'Newest Arrivals',
    labelBn: 'নতুন প্রকাশিত (Newest)',
    shortLabel: 'Newest',
    shortLabelBn: 'নতুন আগমন',
  },
  {
    id: 'bestselling',
    label: 'Best Selling',
    labelBn: 'সেরা বিক্রিত (Best Selling)',
    shortLabel: 'Best Selling',
    shortLabelBn: 'সেরা বিক্রিত',
  },
];

interface AmazonSortDropdownProps {
  sortBy: SortOption;
  onSortChange: (nextSort: SortOption) => void;
  isBengali?: boolean;
  className?: string;
}

/**
 * Task 24: 6-Option Amazon Sorting Dropdown (৬-অপশন অ্যামাজন সর্টিং ড্রপডাউন)
 * Accessible, customizable dropdown menu for instant sorting change.
 */
export const AmazonSortDropdown: React.FC<AmazonSortDropdownProps> = ({
  sortBy,
  onSortChange,
  isBengali = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentItem = SORT_ITEMS.find((item) => item.id === sortBy) || SORT_ITEMS[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id="amazon-sort-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-50/90 hover:bg-white text-gray-800 border border-gray-300 rounded-lg shadow-2xs hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 transition-all cursor-pointer select-none"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className="text-gray-500 font-normal">{isBengali ? 'সাজান:' : 'Sort:'}</span>
        <span className="font-bold text-gray-900 truncate max-w-[130px] sm:max-w-none">
          {isBengali ? currentItem.shortLabelBn : currentItem.shortLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Flyout Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby="amazon-sort-trigger"
          className="absolute right-0 mt-1.5 w-56 sm:w-60 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in-80 zoom-in-95 duration-150 focus:outline-none"
        >
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
            {isBengali ? 'সাজানোর বিকল্প' : 'Sort Options'}
          </div>

          {SORT_ITEMS.map((item) => {
            const isSelected = item.id === sortBy;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSortChange(item.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-50/90 text-amber-950 font-bold'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'
                }`}
              >
                <span>{isBengali ? item.labelBn : item.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
