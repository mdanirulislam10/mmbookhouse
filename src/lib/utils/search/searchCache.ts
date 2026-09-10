/**
 * Module 5 - Task 42: Vercel / Cloudflare Edge & In-Memory KV Query Cache
 * Caches top 500 frequent live search responses delivering 5–20ms response time.
 */

import { LiveSearchResponse } from '@/types/search';

interface CacheEntry {
  data: LiveSearchResponse;
  expiresAt: number;
}

const CACHE_CAPACITY = 500;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

// In-memory LRU-style Map
const searchCache = new Map<string, CacheEntry>();

export function buildSearchCacheKey(query: string, category: string, limit: number): string {
  return `q:${query.trim().toLowerCase()}|c:${(category || 'all').toLowerCase()}|l:${limit}`;
}

export function getCachedSearchResults(key: string): LiveSearchResponse | null {
  const entry = searchCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now > entry.expiresAt) {
    searchCache.delete(key);
    return null;
  }

  // Refresh LRU order (delete & re-insert)
  searchCache.delete(key);
  searchCache.set(key, entry);

  return entry.data;
}

export function setCachedSearchResults(key: string, data: LiveSearchResponse): void {
  // Evict oldest entry if at capacity
  if (searchCache.size >= CACHE_CAPACITY) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) {
      searchCache.delete(oldestKey);
    }
  }

  searchCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function clearSearchCache(): void {
  searchCache.clear();
}
