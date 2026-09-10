'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import {
  LiveSearchResultItem,
  LiveSearchCategoryMatch,
  LiveSearchResponse,
  SearchHistoryItem,
  POPULAR_MALDA_SEARCHES,
} from '@/types/search';
import { BOOKS_CATALOG } from '@/lib/data/booksCatalog';

export const MIN_SEARCH_CHARS = 2;
export const SEARCH_HISTORY_STORAGE_KEY = 'mm_book_search_history_v1';
export const MAX_HISTORY_ITEMS = 10;

// Task 40: Incognito / Private Mode Safe Storage Engine
const memoryStorage: Record<string, string> = {};
let isLocalStorageSupported: boolean | null = null;

function checkStorageSupport(): boolean {
  if (isLocalStorageSupported !== null) return isLocalStorageSupported;
  if (typeof window === 'undefined') {
    isLocalStorageSupported = false;
    return false;
  }
  try {
    const testKey = '__mm_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isLocalStorageSupported = true;
    return true;
  } catch {
    isLocalStorageSupported = false;
    return false;
  }
}

function safeGetItem(key: string): string | null {
  if (checkStorageSupport()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage[key] || null;
    }
  }
  return memoryStorage[key] || null;
}

function safeSetItem(key: string, value: string): void {
  if (checkStorageSupport()) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // Fall through to memory
    }
  }
  memoryStorage[key] = value;
}

function safeRemoveItem(key: string): void {
  if (checkStorageSupport()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }
  delete memoryStorage[key];
}

interface UseLiveSearchOptions {
  category?: string;
  debounceDelay?: number;
  minChars?: number;
}

/**
 * Module 5 (Division 1, Tasks 1–5 & Division 8, Tasks 36, 40): Live Search Hook
 *
 * - Task 1: Minimum character threshold check (>= 2 chars)
 * - Task 2: 300ms Debouncing with useDebounce
 * - Task 3: AbortController race-condition cancellation engine
 * - Task 4: Instant reset and clear helper with history support
 * - Task 36: Personalization engine based on past category affinity
 * - Task 40: Incognito / Private browsing mode safety with in-memory storage fallback
 */
import { scoreBookMatch, ScoredMatch } from '@/lib/utils/search/scoring';
import { SEARCH_CATEGORIES } from '@/types/search';
import { initOfflineSearchCache, searchOfflineBooks } from '@/lib/utils/search/offlineSearch';

export const SEARCH_HISTORY_EVENT = 'mm_search_history_updated';

export function useLiveSearch(options: UseLiveSearchOptions = {}) {
  const {
    category = 'all',
    debounceDelay = 300,
    minChars = MIN_SEARCH_CHARS,
  } = options;

  const [query, setQueryState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category);

  // Sync category prop if updated from outside
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);

  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState<LiveSearchResultItem[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<LiveSearchCategoryMatch[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [executionTimeMs, setExecutionTimeMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Local storage recent search history
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Task 3: In-flight AbortController reference
  const abortControllerRef = useRef<AbortController | null>(null);

  // Task 3: Instant cancellation on user keystroke (cancels prior in-flight fetch immediately)
  const setQuery = useCallback((newQuery: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setQueryState(newQuery);
    if (newQuery.trim().length < minChars) {
      setIsLoading(false);
    }
  }, [minChars]);

  // Task 36: User past category affinity & personalized recommendation engine
  const preferredCategory = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    searchHistory.forEach((item) => {
      if (item.category && item.category !== 'all') {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
    });

    let bestCategory: string | null = null;
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestCategory = cat;
      }
    }
    return bestCategory;
  }, [searchHistory]);

  const personalizedRecommendations = useMemo(() => {
    if (preferredCategory) {
      const matching = BOOKS_CATALOG.filter((b) => b.category === preferredCategory);
      if (matching.length >= 2) return matching.slice(0, 2);
      if (matching.length === 1) {
        const other = BOOKS_CATALOG.find((b) => b.id !== matching[0].id);
        return other ? [matching[0], other] : matching;
      }
    }
    return BOOKS_CATALOG.slice(0, 2);
  }, [preferredCategory]);

  // Task 2: Debounced query (delays 300ms)
  const debouncedQuery = useDebounce(query.trim(), debounceDelay);

  // Task 31 & 40: Load search history safely on mount & listen to cross-component sync events
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = safeGetItem(SEARCH_HISTORY_STORAGE_KEY);
        if (stored) {
          setSearchHistory(JSON.parse(stored));
        }
      } catch {
        // Handled safely
      }
    };

    loadHistory();

    // Task 48: Pre-warm IndexedDB offline cache for top 200 catalog books
    initOfflineSearchCache(BOOKS_CATALOG.slice(0, 200)).catch(() => {});

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<SearchHistoryItem[]>;
      if (customEvent.detail) {
        setSearchHistory(customEvent.detail);
      } else {
        loadHistory();
      }
    };

    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === SEARCH_HISTORY_STORAGE_KEY) {
        loadHistory();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(SEARCH_HISTORY_EVENT, handleCustomSync);
      window.addEventListener('storage', handleStorageSync);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SEARCH_HISTORY_EVENT, handleCustomSync);
        window.removeEventListener('storage', handleStorageSync);
      }
    };
  }, []);

  // Save query to search history (Task 31, 36 & 40 safe storage with category affinity resolution)
  const saveSearchTerm = useCallback((term: string, cat?: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;

    // Resolve specific category affinity if cat is missing or 'all' (Task 36)
    let resolvedCat = cat && cat !== 'all' ? cat : undefined;
    if (!resolvedCat) {
      const lower = trimmed.toLowerCase();
      // Try matching category
      for (const c of SEARCH_CATEGORIES) {
        if (c.id === 'all') continue;
        if (lower.includes(c.id) || lower.includes(c.name.toLowerCase()) || lower.includes(c.nameBn.toLowerCase())) {
          resolvedCat = c.id;
          break;
        }
      }
      // Try matching book catalog category
      if (!resolvedCat) {
        const book = BOOKS_CATALOG.find((b) =>
          b.title.toLowerCase().includes(lower) ||
          b.titleBn.toLowerCase().includes(lower)
        );
        if (book) {
          resolvedCat = book.category;
        }
      }
    }

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
      const updated: SearchHistoryItem[] = [
        {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          query: trimmed,
          category: resolvedCat,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS);

      safeSetItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(updated));

      // Broadcast history update to other header instances (Desktop & Mobile Header sync)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SEARCH_HISTORY_EVENT, { detail: updated }));
      }

      return updated;
    });
  }, []);

  // Delete individual history item (Task 33 & Task 40 safe storage)
  const removeHistoryItem = useCallback((id: string) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SEARCH_HISTORY_EVENT, { detail: updated }));
      }
      return updated;
    });
  }, []);

  // Clear all search history (Task 34 & Task 40 safe storage)
  const clearAllHistory = useCallback(() => {
    setSearchHistory([]);
    safeRemoveItem(SEARCH_HISTORY_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SEARCH_HISTORY_EVENT, { detail: [] }));
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
    setQueryState('');
    setBooks([]);
    setKeywords([]);
    setCategories([]);
    setDidYouMean(null);
    setTotalCount(0);
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
      // Task 48: Immediate offline response if browser is offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        try {
          const offlineData = await searchOfflineBooks(trimmed, selectedCategory, 4);
          if (!controller.signal.aborted) {
            setBooks(offlineData.books || []);
            setKeywords(offlineData.keywords || []);
            setCategories(offlineData.categories || []);
            setDidYouMean(offlineData.didYouMean || null);
            setTotalCount(offlineData.totalCount || 0);
            setExecutionTimeMs(offlineData.executionTimeMs || 5);
            setIsLoading(false);
          }
        } catch {
          if (!controller.signal.aborted) {
            setError('Offline search failed');
            setIsLoading(false);
          }
        }
        return;
      }

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
          setTotalCount(data.totalCount ?? (data.books ? data.books.length : 0));
          setExecutionTimeMs(data.executionTimeMs || 0);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        // Ignore AbortError gracefully — user typed a new character or cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          setIsLoading(false);
          return;
        }
        if (!controller.signal.aborted) {
          // Task 48: PWA Offline Search Fallback using IndexedDB cache
          try {
            const offlineData = await searchOfflineBooks(trimmed, selectedCategory, 4);
            if (!controller.signal.aborted) {
              setBooks(offlineData.books || []);
              setKeywords(offlineData.keywords || []);
              setCategories(offlineData.categories || []);
              setDidYouMean(offlineData.didYouMean || null);
              setTotalCount(offlineData.totalCount || 0);
              setExecutionTimeMs(offlineData.executionTimeMs || 15);
              setIsLoading(false);
              return;
            }
          } catch {
            // Fall through to error
          }

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
    totalCount,
    executionTimeMs,
    error,
    searchHistory,
    trendingSearches: POPULAR_MALDA_SEARCHES,
    clearSearch,
    saveSearchTerm,
    removeHistoryItem,
    clearAllHistory,
    preferredCategory,
    personalizedRecommendations,
    isThresholdMet: query.trim().length >= minChars,
    minChars,
  };
}
