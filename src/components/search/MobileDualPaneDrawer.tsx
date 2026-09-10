'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, SlidersHorizontal, ChevronRight, Star } from 'lucide-react';
import { FacetGroup, FilterState, HierarchyCategoryNode } from '@/types/catalog-filter';
import { DrawerFooterCounter } from './DrawerFooterCounter';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { SubjectHierarchyFilter } from './facets/SubjectHierarchyFilter';
import { AuthorFacetFilter } from './facets/AuthorFacetFilter';
import { PublisherFacetFilter } from './facets/PublisherFacetFilter';
import { BindingFormatFilter } from './facets/BindingFormatFilter';
import { BookConditionFilter } from './facets/BookConditionFilter';
import { LanguageFacetFilter } from './facets/LanguageFacetFilter';
import { DiscountRangeFilter } from './facets/DiscountRangeFilter';
import { RatingFacetFilter } from './facets/RatingFacetFilter';
import { PriceRangeFilter } from './facets/PriceRangeFilter';

interface MobileDualPaneDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  facetGroups: FacetGroup[];
  hierarchyCategories?: HierarchyCategoryNode[];
  filterState: FilterState;
  onFilterChange: (nextState: FilterState) => void;
  matchingCount: number;
  computeMatchCount?: (draft: FilterState) => number;
  onApply: () => void;
  isBengali?: boolean;
}

/**
 * Task 4 & 5: Amazon-Style Dual-Pane Mobile Filter Drawer with Draft State Architecture
 * Left Pane: Facet categories list (with active counters)
 * Right Pane: Interactive checkboxes, custom sliders, and specialized facet pickers.
 * Unapplied selections remain in draft state until "Apply Filters" is tapped.
 */
export const MobileDualPaneDrawer: React.FC<MobileDualPaneDrawerProps> = ({
  isOpen,
  onClose,
  facetGroups,
  hierarchyCategories,
  filterState,
  onFilterChange,
  matchingCount: externalMatchingCount,
  computeMatchCount,
  onApply,
  isBengali = true,
}) => {
  // Currently active left-pane facet group
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    facetGroups[0]?.id || 'category'
  );

  // Critical Architectural Fix: Draft Filter State for Mobile Drawer
  const [draftState, setDraftState] = useState<FilterState>(filterState);

  // Sync draft state with incoming filterState when drawer opens
  useEffect(() => {
    if (isOpen) {
      setDraftState(filterState);
    }
  }, [isOpen, filterState]);

  // Sync selected group if facetGroups changes
  useEffect(() => {
    if (!selectedGroupId && facetGroups.length > 0) {
      setSelectedGroupId(facetGroups[0].id);
    }
  }, [facetGroups, selectedGroupId]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to cancel & close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filterState]);

  // Calculate live matching count from draft state if compute function provided
  const liveMatchingCount = useMemo(() => {
    if (computeMatchCount) {
      return computeMatchCount(draftState);
    }
    return externalMatchingCount;
  }, [computeMatchCount, draftState, externalMatchingCount]);

  if (!isOpen) return null;

  const currentGroup = facetGroups.find((g) => g.id === selectedGroupId) || facetGroups[0];

  // Pre-calculate counts for specialized facets (Tasks 16-19)
  const discountCounts = {
    50: facetGroups.find((g) => g.id === 'discount')?.options.find((o) => o.id === '50')?.count ?? 0,
    35: facetGroups.find((g) => g.id === 'discount')?.options.find((o) => o.id === '35')?.count ?? 0,
    25: facetGroups.find((g) => g.id === 'discount')?.options.find((o) => o.id === '25')?.count ?? 0,
    10: facetGroups.find((g) => g.id === 'discount')?.options.find((o) => o.id === '10')?.count ?? 0,
  };

  const ratingCounts = {
    4: facetGroups.find((g) => g.id === 'rating')?.options.find((o) => o.id === '4')?.count ?? 0,
    3: facetGroups.find((g) => g.id === 'rating')?.options.find((o) => o.id === '3')?.count ?? 0,
    2: facetGroups.find((g) => g.id === 'rating')?.options.find((o) => o.id === '2')?.count ?? 0,
    1: facetGroups.find((g) => g.id === 'rating')?.options.find((o) => o.id === '1')?.count ?? 0,
  };

  const priceCounts = {
    under200: facetGroups.find((g) => g.id === 'price')?.options.find((o) => o.id === 'under-200')?.count ?? 0,
    from200to500: facetGroups.find((g) => g.id === 'price')?.options.find((o) => o.id === '200-500')?.count ?? 0,
    from500to1000: facetGroups.find((g) => g.id === 'price')?.options.find((o) => o.id === '500-1000')?.count ?? 0,
    over1000: facetGroups.find((g) => g.id === 'price')?.options.find((o) => o.id === 'over-1000')?.count ?? 0,
  };

  // Check how many items are selected in each group in draft state
  const getSelectedCountForGroup = (groupId: string): number => {
    switch (groupId) {
      case 'category':
        return (draftState.category && draftState.category !== 'all' ? 1 : 0) + (draftState.subCategory ? 1 : 0);
      case 'authors':
        return draftState.authors.length;
      case 'publishers':
        return draftState.publishers.length;
      case 'formats':
        return draftState.formats.length;
      case 'conditions':
        return draftState.conditions.length;
      case 'languages':
        return draftState.languages.length;
      case 'discount':
        return draftState.discountRange !== undefined ? 1 : 0;
      case 'price':
        return draftState.minPrice !== undefined || draftState.maxPrice !== undefined ? 1 : 0;
      case 'rating':
        return draftState.minRating > 0 ? 1 : 0;
      default:
        return 0;
    }
  };

  const totalDraftActiveCount =
    (draftState.category && draftState.category !== 'all' ? 1 : 0) +
    (draftState.subCategory ? 1 : 0) +
    draftState.authors.length +
    draftState.publishers.length +
    draftState.formats.length +
    draftState.conditions.length +
    draftState.languages.length +
    (draftState.minRating > 0 ? 1 : 0) +
    (draftState.discountRange !== undefined ? 1 : 0) +
    (draftState.minPrice !== undefined || draftState.maxPrice !== undefined ? 1 : 0);

  // Toggle option in draft state
  const handleToggleOption = (groupId: string, optionId: string) => {
    setDraftState((prev) => {
      const next = { ...prev };

      if (groupId === 'category') {
        next.category = next.category === optionId ? 'all' : optionId;
        next.subCategory = undefined;
      } else if (groupId === 'authors') {
        next.authors = next.authors.includes(optionId)
          ? next.authors.filter((a) => a !== optionId)
          : [...next.authors, optionId];
      } else if (groupId === 'publishers') {
        next.publishers = next.publishers.includes(optionId)
          ? next.publishers.filter((p) => p !== optionId)
          : [...next.publishers, optionId];
      } else if (groupId === 'formats') {
        next.formats = next.formats.includes(optionId)
          ? next.formats.filter((f) => f !== optionId)
          : [...next.formats, optionId];
      } else if (groupId === 'conditions') {
        next.conditions = next.conditions.includes(optionId)
          ? next.conditions.filter((c) => c !== optionId)
          : [...next.conditions, optionId];
      } else if (groupId === 'languages') {
        next.languages = next.languages.includes(optionId)
          ? next.languages.filter((l) => l !== optionId)
          : [...next.languages, optionId];
      } else if (groupId === 'rating') {
        const ratingVal = Number(optionId);
        next.minRating = next.minRating === ratingVal ? 0 : ratingVal;
      }

      return next;
    });
  };

  const isOptionSelected = (groupId: string, optionId: string): boolean => {
    switch (groupId) {
      case 'category':
        return draftState.category === optionId;
      case 'authors':
        return draftState.authors.includes(optionId);
      case 'publishers':
        return draftState.publishers.includes(optionId);
      case 'formats':
        return draftState.formats.includes(optionId);
      case 'conditions':
        return draftState.conditions.includes(optionId);
      case 'languages':
        return draftState.languages.includes(optionId);
      case 'rating':
        return draftState.minRating === Number(optionId);
      default:
        return false;
    }
  };

  const handleClearAllDraft = () => {
    setDraftState({
      category: 'all',
      subCategory: undefined,
      authors: [],
      publishers: [],
      formats: [],
      conditions: [],
      languages: [],
      minRating: 0,
      minPrice: undefined,
      maxPrice: undefined,
      discountRange: undefined,
      page: 1,
    });
  };

  // Discard draft changes and close
  const handleCancel = () => {
    setDraftState(filterState);
    onClose();
  };

  // Commit draft changes to parent and URL
  const handleApplyCommit = () => {
    onFilterChange({
      ...draftState,
      page: 1, // Reset to page 1 on filter application
    });
    onApply();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isBengali ? 'ফিল্টার ড্রয়ার' : 'Filter drawer'}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
    >
      {/* Backdrop Click to Cancel & Close */}
      <div
        className="flex-1 w-full"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Drawer Container (85vh height) */}
      <div className="w-full h-[85vh] max-h-[750px] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/90 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-gray-900">
              {isBengali ? 'বই ফিল্টার ও বাছাই' : 'Filters & Facets'}
            </h2>
            {totalDraftActiveCount > 0 && (
              <span className="bg-amber-500 text-gray-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {isBengali ? toBengaliNumerals(totalDraftActiveCount) : totalDraftActiveCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label={isBengali ? 'ড্রয়ার বন্ধ করুন' : 'Close drawer'}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual-Pane Body Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Categories List (35% Width) */}
          <div className="w-[36%] sm:w-[32%] bg-gray-100/90 border-r border-gray-200 overflow-y-auto">
            {facetGroups.map((group) => {
              const count = getSelectedCountForGroup(group.id);
              const isSelected = selectedGroupId === group.id;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full text-left px-3 py-3 text-xs font-semibold flex items-center justify-between transition-colors border-b border-gray-200/60 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-amber-800 border-l-4 border-l-amber-600 shadow-2xs font-bold'
                      : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                  }`}
                >
                  <span className="truncate pr-1">
                    {isBengali ? group.titleBn : group.title}
                  </span>

                  {count > 0 ? (
                    <span className="shrink-0 bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {isBengali ? toBengaliNumerals(count) : count}
                    </span>
                  ) : (
                    isSelected && (
                      <ChevronRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Pane: Option Checkboxes or Specialized Facet (64% Width) */}
          <div className="flex-1 bg-white overflow-y-auto p-3 sm:p-4 space-y-2">
            {currentGroup && (
              <>
                <div className="pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    {isBengali ? currentGroup.titleBn : currentGroup.title}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {isBengali
                      ? `${toBengaliNumerals(currentGroup.options.length)}টি বিকল্প`
                      : `${currentGroup.options.length} options`}
                  </span>
                </div>

                {/* Task 11: Category Hierarchy Tree */}
                {currentGroup.id === 'category' && hierarchyCategories && hierarchyCategories.length > 0 ? (
                  <SubjectHierarchyFilter
                    categories={hierarchyCategories}
                    selectedCategory={draftState.category}
                    selectedSubCategory={draftState.subCategory}
                    onSelectCategory={(catId, subId) => {
                      setDraftState((prev) => ({
                        ...prev,
                        category: catId,
                        subCategory: subId,
                      }));
                    }}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'authors' ? (
                  /* Task 12: Author Facet with In-Filter Search */
                  <AuthorFacetFilter
                    options={currentGroup.options}
                    selectedAuthors={draftState.authors}
                    onToggleAuthor={(authorId) => handleToggleOption('authors', authorId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'publishers' ? (
                  /* Task 13: Publisher Facet with Popularity / A-Z */
                  <PublisherFacetFilter
                    options={currentGroup.options}
                    selectedPublishers={draftState.publishers}
                    onTogglePublisher={(pubId) => handleToggleOption('publishers', pubId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'formats' ? (
                  /* Task 14: Binding Format Filter */
                  <BindingFormatFilter
                    options={currentGroup.options}
                    selectedFormats={draftState.formats}
                    onToggleFormat={(fmtId) => handleToggleOption('formats', fmtId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'conditions' ? (
                  /* Task 15: Book Condition Filter */
                  <BookConditionFilter
                    options={currentGroup.options}
                    selectedConditions={draftState.conditions}
                    onToggleCondition={(condId) => handleToggleOption('conditions', condId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'languages' ? (
                  /* Task 16: Multilingual Catalog Filter */
                  <LanguageFacetFilter
                    options={currentGroup.options}
                    selectedLanguages={draftState.languages}
                    onToggleLanguage={(langId) => handleToggleOption('languages', langId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'discount' ? (
                  /* Task 17: Amazon-Style Discount Range Filter */
                  <DiscountRangeFilter
                    selectedDiscount={draftState.discountRange}
                    onSelectDiscount={(discount) =>
                      setDraftState((prev) => ({
                        ...prev,
                        discountRange: discount,
                      }))
                    }
                    discountCounts={discountCounts}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'rating' ? (
                  /* Task 18: Golden Star Customer Review Filter */
                  <RatingFacetFilter
                    minRating={draftState.minRating}
                    onSelectRating={(rating) =>
                      setDraftState((prev) => ({
                        ...prev,
                        minRating: rating,
                      }))
                    }
                    ratingCounts={ratingCounts}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'price' ? (
                  /* Task 19: Hybrid Price Range Filter */
                  <PriceRangeFilter
                    minPrice={draftState.minPrice}
                    maxPrice={draftState.maxPrice}
                    onPriceChange={(min, max) =>
                      setDraftState((prev) => ({
                        ...prev,
                        minPrice: min,
                        maxPrice: max,
                      }))
                    }
                    priceCounts={priceCounts}
                    isBengali={isBengali}
                  />
                ) : (
                  /* Fallback Generic Checkbox List */
                  <div className="space-y-1.5">
                    {currentGroup.options.map((option) => {
                      const checked = isOptionSelected(currentGroup.id, option.id);
                      const disabled = option.disabled || (option.count === 0 && !checked);

                      return (
                        <label
                          key={option.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg text-xs transition-colors select-none ${
                            disabled
                              ? 'opacity-40 cursor-not-allowed bg-gray-50'
                              : checked
                              ? 'bg-amber-50/70 text-gray-950 font-semibold cursor-pointer'
                              : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                              checked
                                ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => handleToggleOption(currentGroup.id, option.id)}
                            className="sr-only"
                          />

                          <div className="flex-1 flex items-baseline justify-between gap-1 leading-snug">
                            <span className={checked ? 'text-amber-950' : 'text-gray-800'}>
                              {currentGroup.id === 'rating' ? (
                                <span className="flex items-center gap-1">
                                  <span className="flex items-center text-amber-500">
                                    {Array.from({ length: Number(option.id) }).map((_, i) => (
                                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    ))}
                                  </span>
                                  <span>{isBengali ? '& তদূর্ধ্ব' : '& Up'}</span>
                                </span>
                              ) : isBengali ? (
                                option.labelBn
                              ) : (
                                option.label
                              )}
                            </span>
                            <span className="text-[10px] text-gray-400 font-normal shrink-0">
                              ({isBengali ? toBengaliNumerals(option.count) : option.count})
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer with Live Matching Count & Commit Action */}
        <DrawerFooterCounter
          matchingCount={liveMatchingCount}
          hasActiveFilters={totalDraftActiveCount > 0}
          onClearAll={handleClearAllDraft}
          onApply={handleApplyCommit}
          isBengali={isBengali}
        />
      </div>
    </div>
  );
};
