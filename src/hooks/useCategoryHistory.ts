'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mm_category_history';
const MAX_HISTORY = 6;

export interface CategoryHistoryItem {
  id: string;
  slug: string;
  title?: string;
  visitCount: number;
  lastVisited: number;
}

/**
 * Task 46: Smart Recommended Department & Category History Hook
 * - Tracks user browsing affinity in localStorage (SSR safe)
 * - Computes preferred department for personalized drawer prioritization
 * - Zero layout shift: applies recommendations gracefully after initial hydration
 */
export function useCategoryHistory() {
  const [history, setHistory] = useState<CategoryHistoryItem[]>([]);
  const [preferredDepartmentId, setPreferredDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CategoryHistoryItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          // Sort by highest visitCount, then by recency
          const sorted = [...parsed].sort((a, b) => b.visitCount - a.visitCount || b.lastVisited - a.lastVisited);
          setPreferredDepartmentId(sorted[0].id);
        }
      }
    } catch {
      // Graceful fallback if localStorage is unavailable
    }
  }, []);

  const recordCategoryVisit = useCallback((id: string, slug: string, title?: string) => {
    try {
      if (typeof window === 'undefined') return;
      const stored = localStorage.getItem(STORAGE_KEY);
      let items: CategoryHistoryItem[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(items)) items = [];

      const existingIndex = items.findIndex((item) => item.id === id || item.slug === slug);

      if (existingIndex > -1) {
        items[existingIndex].visitCount += 1;
        items[existingIndex].lastVisited = Date.now();
        if (title) items[existingIndex].title = title;
      } else {
        items.unshift({
          id,
          slug,
          title,
          visitCount: 1,
          lastVisited: Date.now(),
        });
      }

      items = items.slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setHistory(items);

      const sorted = [...items].sort((a, b) => b.visitCount - a.visitCount || b.lastVisited - a.lastVisited);
      if (sorted.length > 0) {
        setPreferredDepartmentId(sorted[0].id);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  return {
    history,
    preferredDepartmentId,
    recordCategoryVisit,
  };
}
