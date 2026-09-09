'use client';

import React, { useState } from 'react';
import { FacetGroup, FilterState, HierarchyCategoryNode } from '@/types/catalog-filter';
import { Check, RotateCcw, Star, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
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

interface DesktopFacetSidebarProps {
  facetGroups: FacetGroup[];
  hierarchyCategories?: HierarchyCategoryNode[];
  filterState: FilterState;
  onFilterChange: (nextState: FilterState) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  isBengali?: boolean;
}

export const DesktopFacetSidebar: React.FC<DesktopFacetSidebarProps> = ({
  facetGroups,
  hierarchyCategories,
  filterState,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
  isBengali = true,
}) => {
  // Track collapsed state for each facet group
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  // Track "See more" state for groups with > 5 items
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
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

  const handleToggle = (groupId: string, optionId: string) => {
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
      const val = Number(optionId);
      next.minRating = next.minRating === val ? 0 : val;
    }

    onFilterChange(next);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-4 space-y-5 select-none">
      {/* Sidebar Top Header with Active Filter Count & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-black text-sm text-gray-900 tracking-tight flex items-center gap-1.5">
          <span>{isBengali ? 'ফিল্টারসমূহ' : 'Filters & Facets'}</span>
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-amber-600" />
            <span>{isBengali ? 'সব মুছুন' : 'Clear all'}</span>
          </button>
        )}
      </div>

      {/* Accordion Facet Groups */}
      <div className="space-y-4 divide-y divide-gray-100">
        {facetGroups.map((group, index) => {
          const isCollapsed = collapsedGroups[group.id];
          const isExpanded = expandedGroups[group.id];
          const limit = 5;
          const hasMore = group.options.length > limit;
          const visibleOptions = hasMore && !isExpanded ? group.options.slice(0, limit) : group.options;

          return (
            <div key={group.id} className={index > 0 ? 'pt-4' : ''}>
              {/* Group Title Bar / Accordion Toggle */}
              <button
                type="button"
                onClick={() => toggleGroupCollapse(group.id)}
                className="w-full flex items-center justify-between py-1 text-left group cursor-pointer"
              >
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                  {isBengali ? group.titleBn : group.title}
                </h4>
                <span className="text-gray-400 group-hover:text-amber-700 transition-colors">
                  {isCollapsed ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>

              {/* Group Body Rendering */}
              {!isCollapsed && (
                <div className="mt-2 animate-in fade-in duration-150">
                  {/* Task 11: Category Hierarchy Tree */}
                  {group.id === 'category' && hierarchyCategories && hierarchyCategories.length > 0 ? (
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
                  ) : group.id === 'authors' ? (
                    /* Task 12: Author Facet with Live Mini Search */
                    <AuthorFacetFilter
                      options={group.options}
                      selectedAuthors={filterState.authors}
                      onToggleAuthor={(authorId) => handleToggle('authors', authorId)}
                      isBengali={isBengali}
                    />
                  ) : group.id === 'publishers' ? (
                    /* Task 13: Publishers Facet with Multi-Select & Sort */
                    <PublisherFacetFilter
                      options={group.options}
                      selectedPublishers={filterState.publishers}
                      onTogglePublisher={(pubId) => handleToggle('publishers', pubId)}
                      isBengali={isBengali}
                    />
                  ) : group.id === 'formats' ? (
                    /* Task 14: Binding Format Filter */
                    <BindingFormatFilter
                      options={group.options}
                      selectedFormats={filterState.formats}
                      onToggleFormat={(fmtId) => handleToggle('formats', fmtId)}
                      isBengali={isBengali}
                    />
                  ) : group.id === 'conditions' ? (
                    /* Task 15: Book Condition Filter */
                    <BookConditionFilter
                      options={group.options}
                      selectedConditions={filterState.conditions}
                      onToggleCondition={(condId) => handleToggle('conditions', condId)}
                      isBengali={isBengali}
                    />
                  ) : group.id === 'languages' ? (
                    /* Task 16: Multilingual Catalog Filter */
                    <LanguageFacetFilter
                      options={group.options}
                      selectedLanguages={filterState.languages}
                      onToggleLanguage={(langId) => handleToggle('languages', langId)}
                      isBengali={isBengali}
                    />
                  ) : group.id === 'discount' ? (
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
                  ) : group.id === 'rating' ? (
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
                  ) : group.id === 'price' ? (
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
                    /* Standard Generic Fallback */
                    <div className="space-y-1">
                      {visibleOptions.map((option) => {
                        const checked = isOptionSelected(group.id, option.id);
                        const disabled = option.disabled || option.count === 0;

                        return (
                          <label
                            key={option.id}
                            className={`flex items-start gap-2 py-1 px-1.5 rounded text-xs transition-colors select-none ${
                              disabled
                                ? 'opacity-35 cursor-not-allowed'
                                : checked
                                ? 'bg-amber-50/90 text-amber-950 font-semibold cursor-pointer'
                                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-950 cursor-pointer'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                                checked
                                  ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>

                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => handleToggle(group.id, option.id)}
                              className="sr-only"
                            />

                            <div className="flex-1 flex items-baseline justify-between gap-1 leading-snug">
                              <span className="truncate">
                                {group.id === 'rating' ? (
                                  <span className="flex items-center gap-1">
                                    <span className="flex items-center text-amber-500">
                                      {Array.from({ length: Number(option.id) }).map((_, i) => (
                                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
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

                      {/* "See more / See less" expander for long lists */}
                      {hasMore && (
                        <button
                          type="button"
                          onClick={() => toggleGroupExpand(group.id)}
                          className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline pt-1 pl-1.5 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <Minus className="w-3 h-3" />
                              <span>{isBengali ? 'সংক্ষিপ্ত করুন' : 'See less'}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>
                                {isBengali
                                  ? `+ আরও ${toBengaliNumerals(group.options.length - limit)}টি দেখুন`
                                  : `+${group.options.length - limit} more`}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
