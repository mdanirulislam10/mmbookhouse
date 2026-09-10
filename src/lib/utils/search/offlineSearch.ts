/**
 * Module 5: PWA Offline Search Engine & IndexedDB Cache
 *
 * - Task 48: PWA offline search and IndexedDB cache for top 200 books
 */

import { LiveSearchResultItem, LiveSearchResponse, LiveSearchCategoryMatch, SEARCH_CATEGORIES } from '@/types/search';
import { scoreBookMatch, ScoredMatch } from './scoring';
import { sanitizeSearchText } from './synonyms';
import { transliterateRomanToBengali, resolveAuthorPhonetics } from './phonetics';
import { BOOKS_CATALOG } from '@/lib/data/booksCatalog';

const DB_NAME = 'mm_offline_search_db';
const DB_VERSION = 1;
const STORE_NAME = 'books_cache';
const MAX_OFFLINE_CACHE_ITEMS = 200;

function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Checks if IndexedDB is supported in the current client browser.
 */
export function isOfflineSearchSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Saves top 200 catalog books into IndexedDB for offline search.
 */
export async function initOfflineSearchCache(books: LiveSearchResultItem[]): Promise<void> {
  if (!isOfflineSearchSupported()) return;

  try {
    const db = await openOfflineDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Save up to 200 books
    const topBooks = books.slice(0, MAX_OFFLINE_CACHE_ITEMS);
    for (const book of topBooks) {
      store.put(book);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineSearch] Failed to initialize IndexedDB cache:', err);
  }
}

/**
 * Retrieves cached books from IndexedDB.
 */
export async function getOfflineCachedBooks(): Promise<LiveSearchResultItem[]> {
  if (!isOfflineSearchSupported()) {
    return BOOKS_CATALOG.slice(0, MAX_OFFLINE_CACHE_ITEMS);
  }

  try {
    const db = await openOfflineDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as LiveSearchResultItem[];
        if (results && results.length > 0) {
          resolve(results);
        } else {
          // Fallback to static catalog slice if cache is empty
          resolve(BOOKS_CATALOG.slice(0, MAX_OFFLINE_CACHE_ITEMS));
        }
      };

      req.onerror = () => {
        resolve(BOOKS_CATALOG.slice(0, MAX_OFFLINE_CACHE_ITEMS));
      };
    });
  } catch {
    return BOOKS_CATALOG.slice(0, MAX_OFFLINE_CACHE_ITEMS);
  }
}

/**
 * Searches offline books using local ranking algorithms when device is offline.
 */
export async function searchOfflineBooks(
  rawQuery: string,
  category = 'all',
  limit = 4
): Promise<LiveSearchResponse> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const cleanQuery = sanitizeSearchText(rawQuery);

  if (cleanQuery.length < 2) {
    return {
      query: rawQuery,
      books: [],
      keywords: [],
      categories: [],
      didYouMean: null,
      totalCount: 0,
      executionTimeMs: 0,
    };
  }

  const cachedBooks = await getOfflineCachedBooks();

  let candidates = cachedBooks;
  if (category && category !== 'all') {
    candidates = candidates.filter((b) => b.category === category);
  }

  const scoredMatches: ScoredMatch[] = [];
  for (const book of candidates) {
    const match = scoreBookMatch(cleanQuery, book);
    if (match) {
      scoredMatches.push(match);
    }
  }

  // Sort by final multi-factor rank descending
  scoredMatches.sort((a, b) => b.score - a.score);

  const matchedBooks = scoredMatches.slice(0, limit).map((m) => m.book);

  // Derive keywords and transliteration
  const transliterations = transliterateRomanToBengali(cleanQuery);
  const authorVariants = resolveAuthorPhonetics(cleanQuery);
  const allVariants = Array.from(new Set([cleanQuery, ...transliterations, ...authorVariants]));

  const keywordsSet = new Set<string>();
  for (const b of matchedBooks) {
    keywordsSet.add(b.title.split('(')[0].trim());
    if (b.titleBn) {
      keywordsSet.add(b.titleBn.split('(')[0].trim());
    }
  }

  // Categories match
  const matchedCategories: LiveSearchCategoryMatch[] = [];
  for (const cat of SEARCH_CATEGORIES) {
    if (cat.id === 'all') continue;
    const catNameClean = sanitizeSearchText(cat.name);
    const catNameBnClean = sanitizeSearchText(cat.nameBn);

    const matchesCat = allVariants.some(
      (v) => catNameClean.includes(v) || catNameBnClean.includes(v)
    );

    if (matchesCat) {
      const count = cachedBooks.filter((b) => b.category === cat.id).length;
      matchedCategories.push({
        id: cat.id,
        name: cat.name,
        nameBn: cat.nameBn,
        count,
      });
    }
  }

  const executionTimeMs = Math.round(
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime
  );

  return {
    query: rawQuery,
    books: matchedBooks,
    keywords: Array.from(keywordsSet).slice(0, 4),
    categories: matchedCategories.slice(0, 2),
    didYouMean:
      transliterations.length > 0 && transliterations[0].toLowerCase() !== cleanQuery.toLowerCase()
        ? transliterations[0]
        : null,
    totalCount: scoredMatches.length,
    executionTimeMs,
  };
}
