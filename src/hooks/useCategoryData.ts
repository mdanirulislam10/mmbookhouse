'use client';

import { useState, useEffect } from 'react';
import { CategoryTreeNode, getFallbackCategoryTree } from '@/lib/supabase/categories';

interface UseCategoryDataReturn {
  categories: CategoryTreeNode[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// In-memory module cache to prevent redundant client network fetches
let cachedCategories: CategoryTreeNode[] | null = null;
let pendingCategoryPromise: Promise<CategoryTreeNode[]> | null = null;

/**
 * Task 16 & 17: Hook to fetch dynamic category tree with client memory caching
 */
export function useCategoryData(): UseCategoryDataReturn {
  const [categories, setCategories] = useState<CategoryTreeNode[]>(
    cachedCategories || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cachedCategories);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (cachedCategories) {
        setCategories(cachedCategories);
        setIsLoading(false);
        return;
      }

      if (!pendingCategoryPromise) {
        pendingCategoryPromise = (async () => {
          const res = await fetch('/api/categories', {
            headers: { Accept: 'application/json' },
          });

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data as CategoryTreeNode[];
          }
          return getFallbackCategoryTree();
        })();
      }

      const data = await pendingCategoryPromise;
      cachedCategories = data;
      setCategories(data);
    } catch (err) {
      console.warn('Using fallback categories due to fetch error:', err);
      const fallback = getFallbackCategoryTree();
      cachedCategories = fallback;
      setCategories(fallback);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      pendingCategoryPromise = null;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedCategories) {
      fetchCategories();
    }
  }, []);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
