'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  BookOpen,
  ArrowUpRight,
  Clock,
  Flame,
  Loader2,
  Tag,
  Sparkles,
  User,
  Building2,
  MessageCircle,
  SearchX,
} from 'lucide-react';
import { CategoryDropdown } from './CategoryDropdown';
import { useLanguage } from '@/hooks/useLanguage';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';
import { useLiveSearch, MIN_SEARCH_CHARS } from '@/hooks/useLiveSearch';
import { LiveSearchResultItem } from '@/types/search';

interface SearchBarProps {
  className?: string;
  onSearch?: (query: string, category: string) => void;
  isMobile?: boolean;
}

/**
 * Module 5 - Division 1 & 2: Typeahead Live Search Engine
 *
 * Division 1 (Tasks 1–5):
 * - Task 1: Minimum character threshold check (>= 2 characters for live search trigger)
 * - Task 2: 300ms Debounce performance throttling via useLiveSearch
 * - Task 3: AbortController race-condition & in-flight cancellation engine
 * - Task 4: Instant Clear ('X') button with state reset and search history focus retention
 * - Task 5: Mobile viewport zoom prevention (fixed 16px font-size) & input optimization
 *
 * Division 2 (Tasks 6–10):
 * - Task 6: Keyboard ArrowUp / ArrowDown navigation, visual highlighting & auto-scroll into view
 * - Task 7: Enter key execution & direct routing with history persistence
 * - Task 8: Escape key dismiss & click-outside close mechanism without query loss
 * - Task 9: Soft backdrop overlay (40% black + blur) with visual focus on search
 * - Task 10: Cached dropdown retention on input re-focus / re-click
 */
/**
 * Task 24: Dynamic Substring Highlighting Engine (Multi-token supported)
 * Accurately highlights matching substrings or individual tokens within titles or keywords
 */
function highlightMatch(text: string, searchQuery: string): React.ReactNode {
  if (!text || !searchQuery || searchQuery.trim().length < 2) return text;

  try {
    const rawTokens = searchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 2);

    if (rawTokens.length === 0) return text;

    // Escape special characters for regex (Unicode and special characters safe)
    const escapedTokens = rawTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');

    const parts = text.split(regex);
    if (parts.length <= 1) return text;

    return (
      <>
        {parts.map((part, i) => {
          const isMatch = rawTokens.some((token) => part.toLowerCase() === token);
          return isMatch ? (
            <mark
              key={i}
              className="bg-amber-100 text-amber-950 font-bold px-0.5 rounded-xs not-italic"
            >
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  } catch {
    return text;
  }
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className = '',
  onSearch,
  isMobile = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderFading, setIsPlaceholderFading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLFormElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { language, isBengali } = useLanguage();
  const dict = getHeaderDictionary(language);
  const rotatingPlaceholders = dict.search.placeholders;

  // Module 5 Core Search Hook (Tasks 1–4, 10)
  const {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    books,
    keywords,
    categories,
    didYouMean,
    executionTimeMs,
    searchHistory,
    trendingSearches,
    clearSearch,
    saveSearchTerm,
    removeHistoryItem,
    clearAllHistory,
    isThresholdMet,
    preferredCategory,
    personalizedRecommendations,
  } = useLiveSearch();

  // Execute Search Helper (Task 7)
  const executeSearch = (searchQuery: string, category: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Save to local search history
    saveSearchTerm(trimmed, category);

    setIsDropdownOpen(false);
    setIsFocused(false);
    setActiveSuggestionIndex(-1);

    if (onSearch) {
      onSearch(trimmed, category);
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(category)}`);
    }
  };

  // Rotating placeholder cycle
  useEffect(() => {
    if (isFocused || query.length > 0) return;

    const interval = setInterval(() => {
      setIsPlaceholderFading(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % rotatingPlaceholders.length);
        setIsPlaceholderFading(false);
      }, 200);
    }, 3500);

    return () => clearInterval(interval);
  }, [isFocused, query, rotatingPlaceholders.length]);

  // Global Keyboard Slash ('/') Shortcut on Desktop
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsDropdownOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  // Task 8: Click outside to close dropdown (retaining query text in input)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setIsFocused(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Task 25: Strict Item Distribution Quota (Max 4 books, 4 keywords, 2 categories)
  const displayKeywords = useMemo(() => keywords.slice(0, 4), [keywords]);
  const displayBooks = useMemo(() => books.slice(0, 4), [books]);
  const displayCategories = useMemo(() => categories.slice(0, 2), [categories]);
  // Task 32: Zero-input focus state rendering top 5 recent searches
  const displayHistory = useMemo(() => searchHistory.slice(0, 5), [searchHistory]);

  // Compute all navigable items for arrow key navigation (Task 6 & Task 25 & Task 32)
  const allNavigableItems = useMemo(() => {
    if (isThresholdMet) {
      const items: { type: 'keyword' | 'book' | 'category'; data: any; category?: string }[] = [];
      displayKeywords.forEach((kw) => items.push({ type: 'keyword', data: kw }));
      displayBooks.forEach((b) => items.push({ type: 'book', data: b, category: b.category }));
      displayCategories.forEach((c) => items.push({ type: 'category', data: c }));
      return items;
    } else if (query.trim().length === 0) {
      const items: { type: 'history' | 'trending'; data: any; category?: string }[] = [];
      displayHistory.forEach((h) => items.push({ type: 'history', data: h.query, category: h.category }));
      trendingSearches.forEach((t) => items.push({ type: 'trending', data: isBengali ? t.queryBn : t.query, category: t.category }));
      return items;
    }
    return [];
  }, [isThresholdMet, displayKeywords, displayBooks, displayCategories, query, displayHistory, trendingSearches, isBengali]);

  // Task 6: Auto-scroll the active highlighted item smoothly into view
  useEffect(() => {
    if (activeSuggestionIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector(`#search-item-${activeSuggestionIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeSuggestionIndex]);

  // Task 6, 7, 8: Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If dropdown closed, ArrowDown opens it
    if (!isDropdownOpen) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && allNavigableItems.length > 0) {
        setIsDropdownOpen(true);
        setActiveSuggestionIndex(0);
        e.preventDefault();
      }
      return;
    }

    // Task 6: Arrow Down Navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < allNavigableItems.length - 1 ? prev + 1 : 0
      );
    }
    // Task 6: Arrow Up Navigation
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : allNavigableItems.length - 1
      );
    }
    // Task 7: Enter Key Execution & Direct Routing
    else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && allNavigableItems[activeSuggestionIndex]) {
        e.preventDefault();
        const selected = allNavigableItems[activeSuggestionIndex];

        if (selected.type === 'book') {
          const book = selected.data as LiveSearchResultItem;
          saveSearchTerm(book.title, book.category);
          setIsDropdownOpen(false);
          setIsFocused(false);
          setActiveSuggestionIndex(-1);
          router.push(`/search?q=${encodeURIComponent(book.title)}&category=${encodeURIComponent(book.category || selectedCategory)}`);
        } else if (selected.type === 'keyword' || selected.type === 'history' || selected.type === 'trending') {
          const term = String(selected.data);
          setQuery(term);
          executeSearch(term, selected.category || selectedCategory);
        } else if (selected.type === 'category') {
          const cat = selected.data;
          setIsDropdownOpen(false);
          setIsFocused(false);
          setActiveSuggestionIndex(-1);
          executeSearch('', cat.id);
        }
      } else if (query.trim()) {
        e.preventDefault();
        executeSearch(query.trim(), selectedCategory);
      }
    }
    // Task 8: Escape Key Close (Without wiping user's typed query)
    else if (e.key === 'Escape') {
      e.preventDefault();
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
        setActiveSuggestionIndex(-1);
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    executeSearch(query.trim(), selectedCategory);
  };

  // Task 4: Clear Button & Instant State Reset
  const handleClear = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    clearSearch();
    setActiveSuggestionIndex(-1);
    setIsDropdownOpen(true);
    setIsFocused(true);
    inputRef.current?.focus();
  };

  const handleSelectBook = (book: LiveSearchResultItem) => {
    saveSearchTerm(book.title, book.category);
    setIsDropdownOpen(false);
    setIsFocused(false);
    setActiveSuggestionIndex(-1);
    router.push(`/search?q=${encodeURIComponent(book.title)}&category=${encodeURIComponent(book.category)}`);
  };

  const showDropdown = isDropdownOpen && isFocused;

  return (
    <>
      {/* Task 9: Soft Backdrop Overlay & Visual Focus (40% Black + Blur, pointer-events-auto) */}
      {showDropdown && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1.5px] z-40 transition-opacity duration-200 pointer-events-auto"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsFocused(false);
            setActiveSuggestionIndex(-1);
          }}
          aria-hidden="true"
        />
      )}

      <form
        ref={containerRef}
        role="search"
        aria-label={dict.search.formAria}
        onSubmit={handleSubmit}
        className={`relative w-full flex items-center bg-white rounded-md shadow-xs transition-all ${
          showDropdown ? 'z-50 ring-2 ring-[#f08804] border-[#f08804]' : 'z-[30] border border-transparent hover:border-gray-400'
        } ${className}`}
      >
        {/* Part 1: Category Dropdown - Desktop/Tablet Only */}
        {!isMobile && (
          <CategoryDropdown
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            className="h-10 hidden sm:flex"
          />
        )}

        {/* Part 2: Search Input Field (Tasks 1, 4, 5, 10) */}
        <div className="relative flex-1 flex items-center h-full">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls={showDropdown ? 'live-search-suggestions-listbox' : undefined}
            aria-activedescendant={
              activeSuggestionIndex >= 0
                ? `search-item-${activeSuggestionIndex}`
                : undefined
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownOpen(true);
              setActiveSuggestionIndex(-1);
            }}
            /*
             * Task 10: Cached Dropdown Retention on Re-focus & Re-click
             * Clicking back into the input immediately restores dropdown state without wiping previous results
             */
            onFocus={() => {
              setIsFocused(true);
              setIsDropdownOpen(true);
            }}
            onClick={() => {
              if (!isDropdownOpen) {
                setIsDropdownOpen(true);
              }
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={rotatingPlaceholders[placeholderIndex]}
            aria-label={dict.search.inputAria}
            /*
             * Task 5: Mobile Viewport Zoom Prevention & Input Optimization
             * - text-[16px] strictly prevents iOS WebKit from auto-zooming on focus
             * - Mobile keyboard optimization flags: autoComplete, autoCorrect, enterKeyHint
             */
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="search"
            inputMode="search"
            className={`w-full h-full px-3 py-1.5 text-[16px] sm:text-sm text-gray-900 bg-transparent outline-none font-medium transition-all duration-200 ${
              isPlaceholderFading && !query
                ? 'placeholder:opacity-20'
                : 'placeholder:opacity-100 placeholder:text-gray-500'
            }`}
          />

          {/* Loading Spinner Indicator */}
          {isLoading && (
            <div className="flex items-center justify-center mr-1 text-amber-600 animate-spin">
              <Loader2 className="w-4 h-4" />
            </div>
          )}

          {/* Task 4: Instant Clear Button ('X') with Focus Retention & Search History View */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={dict.search.clear}
              className="p-1 mr-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Keyboard Shortcut Indicator Badge (Desktop Only) */}
          {!isFocused && !query && !isMobile && (
            <div className="hidden lg:flex items-center mr-2 select-none pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-gray-400 bg-gray-100 rounded border border-gray-300 shadow-2xs">
                /
              </kbd>
            </div>
          )}
        </div>

        {/* Part 3: Signature Amber Search Button */}
        <button
          type="submit"
          aria-label={dict.search.submit}
          className={`bg-[#febd69] hover:bg-[#f3a847] active:bg-[#e47911] text-gray-900 flex items-center justify-center rounded-r-md transition-colors shrink-0 cursor-pointer ${
            isMobile ? 'h-9 px-3.5' : 'h-10 px-4'
          }`}
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
        </button>

        {/* Dropdown Suggestions / Typeahead Engine */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            id="live-search-suggestions-listbox"
            role="listbox"
            aria-label="লাইভ সার্চ ফলাফল"
            className={`bg-white border border-gray-300 z-50 overflow-hidden py-2 ${
              isMobile
                ? 'fixed inset-0 max-h-none rounded-none overflow-y-auto pt-3 px-2 shadow-2xl'
                : 'absolute left-0 right-0 top-full mt-1 rounded-b-md shadow-2xl max-h-[420px] overflow-y-auto'
            }`}
          >
            {/* Task 28: Mobile Full-Screen Header with Back Button */}
            {isMobile && (
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 mb-2 bg-gray-50 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsFocused(false);
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-700 font-bold p-1 cursor-pointer"
                >
                  <span className="text-sm font-bold">←</span>
                  <span>{isBengali ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <span className="text-xs font-semibold text-gray-500 truncate max-w-[160px]">
                  {query ? `"${query}"` : (isBengali ? 'অনুসন্ধান' : 'Search')}
                </span>
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-amber-700 font-bold p-1 cursor-pointer hover:underline"
                  >
                    {isBengali ? 'মুছুন' : 'Clear'}
                  </button>
                )}
              </div>
            )}
            {/* STATE A: User typed 1 character (Task 1: Activation Threshold Warning) */}
            {query.trim().length === 1 && (
              <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2 bg-amber-50/50 border-b border-amber-100/60">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  {isBengali
                    ? `অনুসন্ধান শুরু করতে কমপক্ষে ২টি অক্ষর লিখুন...`
                    : `Keep typing (minimum ${MIN_SEARCH_CHARS} characters for live search)...`}
                </span>
              </div>
            )}

            {/* STATE B: User is focused with empty query -> Show Search History & Trending Searches */}
            {query.trim().length === 0 && (
              <div className="divide-y divide-gray-100 text-xs">
                {/* Recent Search History (Task 31-34: Max 5 items displayed) */}
                {displayHistory.length > 0 && (
                  <div className="py-1">
                    <div className="flex items-center justify-between px-3 py-1.5 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {isBengali ? 'সাম্প্রতিক অনুসন্ধান' : 'Recent Searches'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearAllHistory();
                        }}
                        className="hover:text-red-600 transition-colors text-[10px] lowercase cursor-pointer font-medium"
                      >
                        {isBengali ? 'সব মুছুন' : 'Clear all'}
                      </button>
                    </div>
                    <ul>
                      {displayHistory.map((item, idx) => {
                        const isSelected = activeSuggestionIndex === idx;
                        return (
                          <li
                            key={item.id}
                            id={`search-item-${idx}`}
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setActiveSuggestionIndex(idx)}
                            className={`flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-100/90 text-gray-950 font-semibold ring-1 ring-amber-300'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div
                              className="flex-1 flex items-center gap-2 truncate"
                              onClick={() => {
                                setQuery(item.query);
                                executeSearch(item.query, item.category || selectedCategory);
                              }}
                            >
                              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{item.query}</span>
                            </div>
                            <button
                              type="button"
                              aria-label={isBengali ? 'অনুসন্ধান ইতিহাস থেকে সরান' : 'Remove search history'}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeHistoryItem(item.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Trending Searches in Malda (Task 35) */}
                <div className="py-2 px-3">
                  <div className="pb-1.5 text-gray-500 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>{isBengali ? '🔥 মালদায় ট্রেন্ডিং অনুসন্ধান' : '🔥 Trending in Malda'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {trendingSearches.map((item, tIdx) => {
                      const itemIdx = displayHistory.length + tIdx;
                      const isSelected = activeSuggestionIndex === itemIdx;
                      const text = isBengali ? item.queryBn : item.query;
                      return (
                        <button
                          key={item.id}
                          id={`search-item-${itemIdx}`}
                          type="button"
                          onMouseEnter={() => setActiveSuggestionIndex(itemIdx)}
                          onClick={() => {
                            setQuery(text);
                            executeSearch(text, item.category || selectedCategory);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-200/90 text-amber-950 font-bold border-amber-400 ring-1 ring-amber-400 scale-[1.02]'
                              : 'bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 border-gray-200'
                          }`}
                        >
                          <span>{text}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                item.isHot
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STATE C: User typed >= 2 characters -> Show Live Search Results */}
            {isThresholdMet && (
              <div className="divide-y divide-gray-100 text-xs">
                {/* 1. Keyword Suggestions */}
                {keywords.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {isBengali ? 'সাজেস্টেড কি-ওয়ার্ড' : 'Suggested Keywords'}
                    </div>
                    <ul>
                      {keywords.map((kw, idx) => {
                        const isSelected = activeSuggestionIndex === idx;
                        return (
                          <li
                            key={`kw-${idx}`}
                            id={`search-item-${idx}`}
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setActiveSuggestionIndex(idx)}
                            onClick={() => {
                              setQuery(kw);
                              executeSearch(kw, selectedCategory);
                            }}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-100/90 text-gray-950 font-bold ring-1 ring-amber-300'
                                : 'text-gray-800 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{highlightMatch(kw, query)}</span>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* 2. Top Books Matches (with Covers, Prices & Discounts) */}
                {books.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
                      <span>{isBengali ? 'বইয়ের সরাসরি ফলাফল' : 'Book Matches'}</span>
                      <span className="text-gray-400 lowercase font-normal">
                        {books.length} {isBengali ? 'টি বই' : 'items'}
                      </span>
                    </div>
                    <ul className="divide-y divide-gray-50">
                      {books.map((book, bIdx) => {
                        const itemIdx = keywords.length + bIdx;
                        const isSelected = activeSuggestionIndex === itemIdx;
                        return (
                          <li
                            key={book.id}
                            id={`search-item-${itemIdx}`}
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setActiveSuggestionIndex(itemIdx)}
                            onClick={() => handleSelectBook(book)}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-100/90 text-gray-950 ring-1 ring-amber-300 font-medium'
                                : 'hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            {/* Book Cover Thumbnail */}
                            <div className="w-9 h-12 bg-gray-100 rounded border border-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                              {book.coverImage ? (
                                <img
                                  src={book.coverImage}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <BookOpen className="w-5 h-5 text-gray-400" />
                              )}
                            </div>

                            {/* Book Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-xs text-gray-900 truncate leading-snug">
                                {highlightMatch(isBengali ? book.titleBn : book.title, query)}
                              </h4>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {isBengali ? book.authorBn : book.author} • {book.publisher}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-bold text-sm text-gray-900">
                                  ₹{book.price}
                                </span>
                                {book.mrp > book.price && (
                                  <span className="text-[11px] text-gray-400 line-through">
                                    ₹{book.mrp}
                                  </span>
                                )}
                                {book.discount && (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">
                                    {book.discount} OFF
                                  </span>
                                )}
                                {!book.inStock && (
                                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1 rounded ml-auto">
                                    {isBengali ? 'স্টক শেষ' : 'Out of Stock'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* 3. Matching Category Shortcuts */}
                {categories.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {isBengali ? 'বিভাগ অনুসারে খুঁজুন' : 'In Departments'}
                    </div>
                    <ul>
                      {categories.map((cat, cIdx) => {
                        const itemIdx = keywords.length + books.length + cIdx;
                        const isSelected = activeSuggestionIndex === itemIdx;
                        return (
                          <li
                            key={cat.id}
                            id={`search-item-${itemIdx}`}
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setActiveSuggestionIndex(itemIdx)}
                            onClick={() => executeSearch('', cat.id)}
                            className={`flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-100/90 text-gray-950 font-bold ring-1 ring-amber-300'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-gray-400" />
                              <span>
                                {isBengali ? cat.nameBn : cat.name}
                              </span>
                            </div>
                            <span className="text-gray-400 text-[10px]">
                              {cat.count} {isBengali ? 'টি বই' : 'books'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* 4. "Did you mean" typo suggestion (Task 38) */}
                {didYouMean && (
                  <div className="px-3 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50/60 border-y border-amber-200/80 text-xs text-amber-950 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <span className="shrink-0">{isBengali ? 'আপনি কি বোঝাতে চেয়েছেন:' : 'Did you mean:'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(didYouMean);
                          executeSearch(didYouMean, selectedCategory);
                        }}
                        className="font-bold underline text-amber-800 hover:text-amber-950 truncate cursor-pointer"
                      >
                        {didYouMean}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(didYouMean);
                        executeSearch(didYouMean, selectedCategory);
                      }}
                      className="text-[11px] font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-900 px-2 py-0.5 rounded cursor-pointer transition-colors shrink-0"
                    >
                      {isBengali ? 'খুঁজুন' : 'Search'}
                    </button>
                  </div>
                )}

                {/* 5. Empathetic Zero Results Screen (Tasks 36, 37, 39) */}
                {!isLoading && books.length === 0 && keywords.length === 0 && (
                  <div className="px-4 py-4 text-center space-y-3">
                    {/* Empathetic & Comforting Message (Task 37) */}
                    <div className="space-y-1">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-50 text-amber-600 mb-0.5">
                        <SearchX className="w-4.5 h-4.5" />
                      </div>
                      <p className="text-xs text-gray-800 font-semibold">
                        {isBengali
                          ? `দুঃখিত, "${query}"-এর সাথে মিলিয়ে কোনো বই পাওয়া যায়নি`
                          : `Sorry, no books found matching "${query}"`}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {isBengali
                          ? 'বানানটি ঠিক আছে কি না পুনরায় দেখুন, অথবা নিচের সাধারণ বিষয়গুলো দিয়ে চেষ্টা করুন'
                          : 'Please check your spelling or try broader subjects below'}
                      </p>
                    </div>

                    {/* Quick Subject Suggestion Chips */}
                    <div className="pt-0.5">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {[
                          { label: 'WBCS', labelBn: 'WBCS ২০২৬' },
                          { label: 'History', labelBn: 'ইতিহাস' },
                          { label: 'UGB Sem 4', labelBn: 'গৌড়বঙ্গ UGB' },
                          { label: 'Primary TET', labelBn: 'প্রাইমারি টেট' },
                          { label: 'Bengali Literature', labelBn: 'সাহিত্য' },
                        ].map((chip, cIdx) => {
                          const chipText = isBengali ? chip.labelBn : chip.label;
                          return (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => {
                                setQuery(chipText);
                                executeSearch(chipText, selectedCategory);
                              }}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 border border-gray-200 transition-colors cursor-pointer"
                            >
                              {chipText}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Task 36: Personalized Recommendations or Alternative Bestsellers */}
                    {personalizedRecommendations.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 text-left">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {isBengali ? 'আপনার জন্য বিকল্প বই:' : 'Recommended alternatives:'}
                          </span>
                          {preferredCategory && (
                            <span className="text-amber-700 font-medium text-[10px] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {preferredCategory}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {personalizedRecommendations.slice(0, 2).map((recBook: any) => (
                            <div
                              key={recBook.id}
                              onClick={() => handleSelectBook(recBook)}
                              className="flex items-center justify-between p-1.5 rounded hover:bg-amber-50/80 cursor-pointer border border-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-8 bg-amber-100/70 rounded shrink-0 flex items-center justify-center text-amber-700 border border-amber-200">
                                  <BookOpen className="w-3.5 h-3.5" />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-medium text-gray-800 truncate">
                                    {isBengali ? recBook.titleBn : recBook.title}
                                  </p>
                                  <p className="text-[10px] text-gray-500 truncate">
                                    {isBengali ? recBook.authorBn : recBook.author}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="text-xs font-bold text-red-600">₹{recBook.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Task 39: WhatsApp Book Request */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[11px] text-gray-600 mb-1.5 font-medium">
                        {isBengali
                          ? 'কাঙ্ক্ষিত বইটি কি খুঁজে পাচ্ছেন না? সরাসরি আমাদের জানান:'
                          : 'Can\'t find the book you\'re looking for? Let us know directly:'}
                      </p>
                      <a
                        href={`https://wa.me/919733000000?text=${encodeURIComponent(
                          isBengali
                            ? `নমস্কার M.M Book House Malda, আমি ওয়েবসাইটে "${query}" বইটি খুঁজছিলাম কিন্তু খুঁজে পাইনি। এই বইটি কি দোকানে পাওয়া যাবে বা সংগ্রহ করে দেওয়া যাবে?`
                            : `Hello M.M Book House Malda, I was looking for "${query}" on your website but could not find it. Is this book available or can you arrange it?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>
                          {isBengali ? 'হোয়াটসঅ্যাপে বইয়ের অনুরোধ করুন' : 'Request Book on WhatsApp'}
                        </span>
                      </a>
                      <p className="text-[9px] text-gray-400 mt-1">
                        {isBengali
                          ? '⚡ আমাদের টিম ২৪ ঘণ্টার মধ্যে বইটি সংগ্রহ করার ব্যবস্থা করবে'
                          : '⚡ Our team will arrange the book within 24 hours'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. "See all results..." Footer Link — only when there are results or loading */}
                {(books.length > 0 || keywords.length > 0 || isLoading) && (
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (query.trim()) executeSearch(query.trim(), selectedCategory);
                      }}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {isBengali
                          ? `"${query}" এর সমস্ত ফলাফল দেখুন`
                          : `See all results for "${query}"`}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    {executionTimeMs > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {executionTimeMs}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </>
  );
};
