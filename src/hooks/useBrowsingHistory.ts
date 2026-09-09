'use client';

import { useSyncExternalStore, useCallback } from 'react';

export interface BrowsingHistoryEntry {
  bookId: string;
  category?: string;
  timestamp: number;
}

const STORAGE_KEY = 'mm_browsing_history_v1';
const EVENT_NAME = 'mm_browsing_history_updated';
const MAX_HISTORY_ITEMS = 12;
const EMPTY_ARRAY: BrowsingHistoryEntry[] = [];

// Module-level Singleton State to prevent redundant localStorage reads across 80+ components
let inMemoryHistory: BrowsingHistoryEntry[] | null = null;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function loadHistoryFromStorage(): BrowsingHistoryEntry[] {
  if (typeof window === 'undefined') return EMPTY_ARRAY;
  if (inMemoryHistory !== null) return inMemoryHistory;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        inMemoryHistory = parsed;
        return inMemoryHistory;
      }
    }
  } catch {
    // Ignore localStorage errors (e.g. incognito/quota)
  }

  inMemoryHistory = [];
  return inMemoryHistory;
}

// Global window event listeners (attached once)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      inMemoryHistory = null; // Invalidate cache
      loadHistoryFromStorage();
      notifySubscribers();
    }
  });

  window.addEventListener(EVENT_NAME, (event) => {
    const customEvt = event as CustomEvent<BrowsingHistoryEntry[]>;
    if (customEvt.detail) {
      inMemoryHistory = customEvt.detail;
      notifySubscribers();
    }
  });
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot(): BrowsingHistoryEntry[] {
  return loadHistoryFromStorage();
}

function getServerSnapshot(): BrowsingHistoryEntry[] {
  return EMPTY_ARRAY;
}

export function useBrowsingHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Record viewed book (Global Dispatch)
  const recordView = useCallback((bookId: string, category?: string) => {
    if (!bookId) return;

    const current = loadHistoryFromStorage();
    const filtered = current.filter((item) => item.bookId !== bookId);
    const newEntry: BrowsingHistoryEntry = {
      bookId,
      category,
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    inMemoryHistory = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    }
    notifySubscribers();
  }, []);

  // Clear all browsing history
  const clearHistory = useCallback(() => {
    inMemoryHistory = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: [] }));
    }
    notifySubscribers();
  }, []);

  return {
    history,
    bookIds: history.map((item) => item.bookId),
    categories: Array.from(new Set(history.map((item) => item.category).filter(Boolean))) as string[],
    recordView,
    clearHistory,
    hasHistory: history.length > 0,
    isInitialized: true,
  };
}
