'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import {
  LiveSearchResultItem,
  LiveSearchCategoryMatch,
  LiveSearchResponse,
  SearchHistoryItem,
} from '@/types/search';
import { POPULAR_MALDA_SEARCHES } from '@/lib/data/booksCatalog';

export const MIN_SEARCH_CHARS = 2;
export const SEARCH_HISTORY_STORAGE_KEY = 'mm_book_search_history_v1';
const MAX_HISTORY_ITEMS = 8;

interface UseLiveSearchOptions {
  category?: string;
  debounceDelay?: number;
  minChars?: number;
}

/**
 * Module 5 (Division 1, Tasks 1–5): Live Search Hook
 *
 * - Task 1: Minimum character threshold check (>= 2 chars)
 * - Task 2: 300ms Debouncing with useDebounce
 * - Task 3: AbortController race-condition cancellation engine
 * - Task 4: Instant reset and clear helper with history support
 */
export function useLiveSearch(options: UseLiveSearchOptions = {}) {
  const {
    category = 'all',
    debounceDelay = 300,
    minChars = MIN_SEARCH_CHARS,
  } = options;

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState<LiveSearchResultItem[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<LiveSearchCategoryMatch[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Local storage recent search history
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Task 2: Debounced query (delays 300ms)
  const debouncedQuery = useDebounce(query.trim(), debounceDelay);

  // Task 3: In-flight AbortController reference
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors (e.g. private mode)
    }
  }, []);

  // Save query to search history
  const saveSearchTerm = useCallback((term: string, cat?: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
      const updated: SearchHistoryItem[] = [
        {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          query: trimmed,
          category: cat,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS);

      try {
        localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage write error
      }
      return updated;
    });
  }, []);

  // Delete individual history item
  const removeHistoryItem = useCallback((id: string) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  // Clear all search history
  const clearAllHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Task 4: Instant Clear & State Reset
  const clearSearch = useCallback(() => {
    // 1. Immediately abort any in-flight network request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Reset query and results state
    setQuery('');
    setBooks([]);
    setKeywords([]);
    setCategories([]);
    setDidYouMean(null);
    setIsLoading(false);
    setError(null);
    setExecutionTimeMs(0);
  }, []);

  // Task 1 & Task 3: Trigger live search on debounced query changes
  useEffect(() => {
    const trimmed = debouncedQuery;

    // Task 1: Check minimum character threshold
    if (trimmed.length < minChars) {
      // Abort any ongoing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setBooks([]);
      setKeywords([]);
      setCategories([]);
      setDidYouMean(null);
      setIsLoading(false);
      return;
    }

    // Task 3: Abort prior unfinished request to avoid race condition
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController instance for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    const fetchLiveResults = async () => {
      try {
        const url = `/api/search?q=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(selectedCategory)}&limit=4`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Search failed with status ${res.status}`);
        }

        const data: LiveSearchResponse = await res.json();

        // Only update if this request wasn't aborted
        if (!controller.signal.aborted) {
          setBooks(data.books || []);
          setKeywords(data.keywords || []);
          setCategories(data.categories || []);
          setDidYouMean(data.didYouMean || null);
          setExecutionTimeMs(data.executionTimeMs || 0);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        // Ignore AbortError gracefully — user typed a new character
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        if (!controller.signal.aborted) {
          console.error('[LiveSearch] Error:', err);
          setError('Failed to fetch search results');
          setIsLoading(false);
        }
      }
    };

    fetchLiveResults();

    // Cleanup when debouncedQuery changes or component unmounts
    return () => {
      controller.abort();
    };
  }, [debouncedQuery, selectedCategory, minChars]);

  return {
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
    error,
    searchHistory,
    trendingSearches: POPULAR_MALDA_SEARCHES,
    clearSearch,
    saveSearchTerm,
    removeHistoryItem,
    clearAllHistory,
    isThresholdMet: query.trim().length >= minChars,
    minChars,
  };
}
