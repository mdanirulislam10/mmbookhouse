'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Layers, Check } from 'lucide-react';
import { HierarchyCategoryNode } from '@/types/catalog-filter';
import { toBengaliNumerals } from '@/lib/utils/currency';

interface SubjectHierarchyFilterProps {
  categories: HierarchyCategoryNode[];
  selectedCategory: string;
  selectedSubCategory?: string;
  onSelectCategory: (categoryId: string, subCategoryId?: string) => void;
  isBengali?: boolean;
}

/**
 * Task 11: Hierarchical Subject & Exam Category Drilldown Tree
 * Supports multi-level expansion, category toggling/deselection, and zero-match handling.
 */
export const SubjectHierarchyFilter: React.FC<SubjectHierarchyFilterProps> = ({
  categories,
  selectedCategory,
  selectedSubCategory,
  onSelectCategory,
  isBengali = true,
}) => {
  // Store which parent categories are expanded
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    // Auto-expand the currently selected category or the first two by default
    const init: Record<string, boolean> = {};
    categories.forEach((cat, idx) => {
      if (cat.id === selectedCategory || idx < 2) {
        init[cat.id] = true;
      }
    });
    return init;
  });

  const toggleExpand = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleParentClick = (catId: string) => {
    // If currently selected without subcategory, clicking again resets to 'all'
    if (selectedCategory === catId && !selectedSubCategory) {
      onSelectCategory('all', undefined);
    } else {
      onSelectCategory(catId, undefined);
    }
  };

  const handleSubClick = (catId: string, subId: string) => {
    // If currently selected subcategory, clicking again deselects subcategory
    if (selectedCategory === catId && selectedSubCategory === subId) {
      onSelectCategory(catId, undefined);
    } else {
      onSelectCategory(catId, subId);
    }
  };

  return (
    <div className="space-y-1 text-xs select-none" role="tree" aria-label={isBengali ? 'বিষয় ও পরীক্ষার তালিকা' : 'Subjects and exams list'}>
      {/* "All Categories / Subjects" Root Option */}
      <button
        type="button"
        onClick={() => onSelectCategory('all', undefined)}
        className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md transition-colors text-left cursor-pointer ${
          selectedCategory === 'all' || !selectedCategory
            ? 'bg-amber-100/80 text-amber-950 font-bold'
            : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-950'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>{isBengali ? 'সকল বিষয় ও পরীক্ষা' : 'All Subjects & Exams'}</span>
        </div>
        {(selectedCategory === 'all' || !selectedCategory) && (
          <Check className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
        )}
      </button>

      {/* Hierarchical Categories Tree */}
      <div className="space-y-1 pt-1">
        {categories.map((cat) => {
          const isCatSelected = selectedCategory === cat.id;
          const isExpanded = !!expandedNodes[cat.id];
          const hasSub = cat.subCategories && cat.subCategories.length > 0;

          return (
            <div key={cat.id} className="space-y-0.5">
              {/* Parent Category Row */}
              <div
                className={`group flex items-center justify-between py-1.5 px-2 rounded-md transition-colors ${
                  isCatSelected && !selectedSubCategory
                    ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200/90'
                    : isCatSelected
                    ? 'text-amber-900 font-semibold bg-amber-50/40'
                    : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-950'
                }`}
              >
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {hasSub ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(e, cat.id)}
                      aria-label={isExpanded ? 'সাব-ক্যাটাগরি বন্ধ করুন' : 'সাব-ক্যাটাগরি খুলুন'}
                      className="p-1 rounded text-gray-400 hover:text-amber-700 hover:bg-amber-100/50 transition-colors cursor-pointer shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4" />
                  )}

                  <button
                    type="button"
                    onClick={() => handleParentClick(cat.id)}
                    className="truncate text-left flex-1 hover:underline cursor-pointer"
                  >
                    {isBengali ? cat.labelBn : cat.label}
                  </button>
                </div>

                <span className="text-[10px] text-gray-400 font-normal shrink-0 pl-1.5">
                  ({isBengali ? toBengaliNumerals(cat.count) : cat.count})
                </span>
              </div>

              {/* Subcategories (Level 2 Drill-down) */}
              {hasSub && isExpanded && (
                <div className="ml-4 pl-2.5 border-l-2 border-amber-200/70 space-y-0.5 py-0.5 animate-in fade-in duration-150">
                  {cat.subCategories.map((sub) => {
                    const isSubSelected =
                      selectedCategory === cat.id && selectedSubCategory === sub.id;

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubClick(cat.id, sub.id)}
                        className={`w-full flex items-center justify-between py-1 px-2 rounded text-left transition-colors cursor-pointer ${
                          isSubSelected
                            ? 'bg-amber-600 text-white font-bold shadow-2xs'
                            : 'text-gray-600 hover:bg-amber-50 hover:text-amber-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Layers className={`w-3 h-3 shrink-0 ${isSubSelected ? 'text-amber-200' : 'text-gray-400'}`} />
                          <span className="truncate text-[11px]">
                            {isBengali ? sub.labelBn : sub.label}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] shrink-0 pl-1 ${
                            isSubSelected ? 'text-amber-100' : 'text-gray-400'
                          }`}
                        >
                          ({isBengali ? toBengaliNumerals(sub.count) : sub.count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
