'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BrowsingHistoryEntry {
  bookId: string;
  category?: string;
  timestamp: number;
}

const STORAGE_KEY = 'mm_browsing_history_v1';
const MAX_HISTORY_ITEMS = 12;

export function useBrowsingHistory() {
  const [history, setHistory] = useState<BrowsingHistoryEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors (e.g. private mode)
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Record a viewed book
  const recordView = useCallback((bookId: string, category?: string) => {
    if (!bookId) return;

    setHistory((prev) => {
      // Remove previous occurrence of same book
      const filtered = prev.filter((item) => item.bookId !== bookId);
      const newEntry: BrowsingHistoryEntry = {
        bookId,
        category,
        timestamp: Date.now(),
      };
      const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore quota errors
      }

      return updated;
    });
  }, []);

  // Clear all browsing history
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setHistory([]);
  }, []);

  return {
    history,
    bookIds: history.map((item) => item.bookId),
    categories: Array.from(new Set(history.map((item) => item.category).filter(Boolean))) as string[],
    recordView,
    clearHistory,
    hasHistory: history.length > 0,
    isInitialized,
  };
}
