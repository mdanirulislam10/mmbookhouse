'use client';

import React, { useState, useEffect } from 'react';
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
  onApply: () => void;
  isBengali?: boolean;
}

export const MobileDualPaneDrawer: React.FC<MobileDualPaneDrawerProps> = ({
  isOpen,
  onClose,
  facetGroups,
  hierarchyCategories,
  filterState,
  onFilterChange,
  matchingCount,
  onApply,
  isBengali = true,
}) => {
  // Currently active left-pane facet group
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    facetGroups[0]?.id || 'category'
  );

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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentGroup = facetGroups.find((g) => g.id === selectedGroupId) || facetGroups[0];

  // Pre-calculate counts for specialized facets (Tasks 16-19)
  const discountCounts = React.useMemo(() => {
    const group = facetGroups.find((g) => g.id === 'discount');
    const counts: Record<number, number> = {};
    group?.options.forEach((opt) => {
      counts[Number(opt.id)] = opt.count;
    });
    return counts;
  }, [facetGroups]);

  const ratingCounts = React.useMemo(() => {
    const group = facetGroups.find((g) => g.id === 'rating');
    const counts: Record<number, number> = {};
    group?.options.forEach((opt) => {
      counts[Number(opt.id)] = opt.count;
    });
    return counts;
  }, [facetGroups]);

  const priceCounts = React.useMemo(() => {
    const group = facetGroups.find((g) => g.id === 'price');
    return {
      under200: group?.options.find((o) => o.id === 'under-200')?.count ?? 0,
      from200to500: group?.options.find((o) => o.id === '200-500')?.count ?? 0,
      from500to1000: group?.options.find((o) => o.id === '500-1000')?.count ?? 0,
      over1000: group?.options.find((o) => o.id === 'over-1000')?.count ?? 0,
    };
  }, [facetGroups]);

  // Check how many items are selected in each group
  const getSelectedCountForGroup = (groupId: string): number => {
    switch (groupId) {
      case 'category':
        return (filterState.category && filterState.category !== 'all' ? 1 : 0) + (filterState.subCategory ? 1 : 0);
      case 'authors':
        return filterState.authors.length;
      case 'publishers':
        return filterState.publishers.length;
      case 'formats':
        return filterState.formats.length;
      case 'conditions':
        return filterState.conditions.length;
      case 'languages':
        return filterState.languages.length;
      case 'discount':
        return filterState.discountRange !== undefined ? 1 : 0;
      case 'price':
        return (filterState.minPrice !== undefined || filterState.maxPrice !== undefined) ? 1 : 0;
      case 'rating':
        return filterState.minRating > 0 ? 1 : 0;
      default:
        return 0;
    }
  };

  const totalActiveFiltersCount =
    (filterState.category && filterState.category !== 'all' ? 1 : 0) +
    (filterState.subCategory ? 1 : 0) +
    filterState.authors.length +
    filterState.publishers.length +
    filterState.formats.length +
    filterState.conditions.length +
    filterState.languages.length +
    (filterState.minRating > 0 ? 1 : 0) +
    (filterState.discountRange !== undefined ? 1 : 0) +
    (filterState.minPrice !== undefined || filterState.maxPrice !== undefined ? 1 : 0);

  // Toggle option selection
  const handleToggleOption = (groupId: string, optionId: string) => {
    const next = { ...filterState };

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

    onFilterChange(next);
  };

  const isOptionSelected = (groupId: string, optionId: string): boolean => {
    switch (groupId) {
      case 'category':
        return filterState.category === optionId;
      case 'authors':
        return filterState.authors.includes(optionId);
      case 'publishers':
        return filterState.publishers.includes(optionId);
      case 'formats':
        return filterState.formats.includes(optionId);
      case 'conditions':
        return filterState.conditions.includes(optionId);
      case 'languages':
        return filterState.languages.includes(optionId);
      case 'rating':
        return filterState.minRating === Number(optionId);
      default:
        return false;
    }
  };

  const handleClearAll = () => {
    onFilterChange({
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
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isBengali ? 'ফিল্টার ড্রয়ার' : 'Filter drawer'}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
    >
      {/* Backdrop Click to Close */}
      <div
        className="flex-1 w-full"
        onClick={onClose}
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
            {totalActiveFiltersCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {isBengali ? toBengaliNumerals(totalActiveFiltersCount) : totalActiveFiltersCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
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
                    selectedCategory={filterState.category}
                    selectedSubCategory={filterState.subCategory}
                    onSelectCategory={(catId, subId) => {
                      onFilterChange({
                        ...filterState,
                        category: catId,
                        subCategory: subId,
                      });
                    }}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'authors' ? (
                  /* Task 12: Author Facet with In-Filter Search */
                  <AuthorFacetFilter
                    options={currentGroup.options}
                    selectedAuthors={filterState.authors}
                    onToggleAuthor={(authorId) => handleToggleOption('authors', authorId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'publishers' ? (
                  /* Task 13: Publisher Facet with Popularity / A-Z */
                  <PublisherFacetFilter
                    options={currentGroup.options}
                    selectedPublishers={filterState.publishers}
                    onTogglePublisher={(pubId) => handleToggleOption('publishers', pubId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'formats' ? (
                  /* Task 14: Binding Format Filter */
                  <BindingFormatFilter
                    options={currentGroup.options}
                    selectedFormats={filterState.formats}
                    onToggleFormat={(fmtId) => handleToggleOption('formats', fmtId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'conditions' ? (
                  /* Task 15: Book Condition Filter */
                  <BookConditionFilter
                    options={currentGroup.options}
                    selectedConditions={filterState.conditions}
                    onToggleCondition={(condId) => handleToggleOption('conditions', condId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'languages' ? (
                  /* Task 16: Multilingual Catalog Filter */
                  <LanguageFacetFilter
                    options={currentGroup.options}
                    selectedLanguages={filterState.languages}
                    onToggleLanguage={(langId) => handleToggleOption('languages', langId)}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'discount' ? (
                  /* Task 17: Amazon-Style Discount Range Filter */
                  <DiscountRangeFilter
                    selectedDiscount={filterState.discountRange}
                    onSelectDiscount={(discount) =>
                      onFilterChange({
                        ...filterState,
                        discountRange: discount,
                      })
                    }
                    discountCounts={discountCounts}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'rating' ? (
                  /* Task 18: Golden Star Customer Review Filter */
                  <RatingFacetFilter
                    minRating={filterState.minRating}
                    onSelectRating={(rating) =>
                      onFilterChange({
                        ...filterState,
                        minRating: rating,
                      })
                    }
                    ratingCounts={ratingCounts}
                    isBengali={isBengali}
                  />
                ) : currentGroup.id === 'price' ? (
                  /* Task 19: Hybrid Price Range Filter */
                  <PriceRangeFilter
                    minPrice={filterState.minPrice}
                    maxPrice={filterState.maxPrice}
                    onPriceChange={(min, max) =>
                      onFilterChange({
                        ...filterState,
                        minPrice: min,
                        maxPrice: max,
                      })
                    }
                    priceCounts={priceCounts}
                    isBengali={isBengali}
                  />
                ) : (
                  /* Fallback Generic Checkbox List */
                  <div className="space-y-1.5">
                    {currentGroup.options.map((option) => {
                      const checked = isOptionSelected(currentGroup.id, option.id);
                      const disabled = option.disabled || option.count === 0;

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

        {/* Drawer Sticky Footer with Live Matching Count */}
        <DrawerFooterCounter
          matchingCount={matchingCount}
          hasActiveFilters={totalActiveFiltersCount > 0}
          onClearAll={handleClearAll}
          onApply={() => {
            onApply();
            onClose();
          }}
          isBengali={isBengali}
        />
      </div>
    </div>
  );
};
