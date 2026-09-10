/**
 * Module 5: Automated Verification Test Suite
 *
 * - Task 46: Multi-factor search ranking formula:
 *     Search Rank = (Text Match Score * 0.5) + (Bestseller Score * 0.3) + (In-Stock Status * 0.2)
 * - Task 47: Strict out-of-stock demotion and stock-filter integration
 * - Task 48: PWA offline search and IndexedDB cache for top 200 books
 * - Task 49: Slow query alert and telemetry monitoring (> 500ms execution warning)
 * - Task 50: End-to-end automated test suite and live validation
 */

import {
  levenshteinDistance,
  isWithinLevenshteinMargin,
  calculateTrigramSimilarity,
  calculateWordSimilarity,
  calculateBestsellerScore,
  calculateFinalSearchRank,
  scoreBookMatch,
} from '../scoring';
import { sanitizeSearchText, sanitizeQueryForSecurity, expandSynonyms, filterStopwords } from '../synonyms';
import { transliterateRomanToBengali, resolveAuthorPhonetics, soundex } from '../phonetics';
import { checkRateLimit, resetRateLimiter } from '../rateLimiter';
import { getCachedSearchResults, setCachedSearchResults, clearSearchCache, buildSearchCacheKey } from '../searchCache';
import { recordSearchTiming, getSearchTelemetryMetrics, resetSearchTelemetry } from '../telemetry';
import { isOfflineSearchSupported, searchOfflineBooks } from '../offlineSearch';
import { LiveSearchResultItem } from '@/types/search';

const mockBookInStock: LiveSearchResultItem = {
  id: 'test-1',
  bookId: 'wbcs-manual-2026',
  slug: 'wbcs-manual-2026',
  title: 'WBCS 2026 Preliminary & Main Manual',
  titleBn: 'ডাব্লুবিসিএস ২০২৬ প্রিলিমিনারি ও মেইন সহায়িকা',
  author: 'Nitin Singhania',
  authorBn: 'নিতিন সিংহানিয়া',
  publisher: 'McGraw Hill',
  category: 'competitive-exams',
  categoryName: 'প্রতিযোগিতামূলক পরীক্ষা',
  price: 650,
  mrp: 850,
  discount: '24%',
  discountPercent: 24,
  inStock: true,
  rating: 4.8,
};

const mockBookOutOfStock: LiveSearchResultItem = {
  ...mockBookInStock,
  id: 'test-2',
  slug: 'wbcs-manual-out-of-stock',
  inStock: false,
};

export function runModule5UnitTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`Assertion failed: ${testName}`);
    }
  }

  // 1. Task 13: Levenshtein Distance & Typo Tolerance
  assert(levenshteinDistance('wbcs', 'wbcs') === 0, 'Exact Levenshtein distance is 0');
  assert(levenshteinDistance('wbcs', 'wbcz') === 1, '1-char typo distance is 1');
  assert(isWithinLevenshteinMargin('byomkesh', 'byomkes'), 'Levenshtein margin detects missing char in byomkesh');
  assert(isWithinLevenshteinMargin('ananda', 'anonda'), 'Levenshtein margin detects single vowel substitution');
  assert(!isWithinLevenshteinMargin('wbcs', 'completelydifferent'), 'Rejects large edit distance');

  // 2. Task 11 & 12: Trigram Similarity
  assert(calculateTrigramSimilarity('history', 'history') === 1.0, 'Identical trigrams similarity is 1.0');
  assert(calculateTrigramSimilarity('itihas', 'itihash') > 0.4, 'Trigram similarity detects close spelling > 0.4');
  assert(calculateWordSimilarity('wbcs', 'WBCS 2026 Manual') === 1.0, 'Word similarity finds exact substring match');

  // 3. Task 15 & 16: Transliteration & Author Phonetics
  const transAnanda = transliterateRomanToBengali('ananda');
  assert(transAnanda.includes('আনন্দ'), 'Transliterates "ananda" to "আনন্দ"');
  const maitraVariants = resolveAuthorPhonetics('maitra');
  assert(maitraVariants.includes('মৈত্র'), 'Author phonetics resolves "maitra" to "মৈত্র"');
  assert(soundex('Robindronath') === soundex('Rabindranath'), 'Soundex matches phonetically similar names');

  // 4. Task 46: Official Multi-Factor Search Ranking Formula
  // Formula: (Text Match * 0.5) + (Bestseller * 0.3) + (In-Stock * 0.2)
  const bestsellerScore = calculateBestsellerScore({ rating: 5.0, discountPercent: 20 });
  assert(bestsellerScore >= 80, 'High rating and discount yields high bestseller score');
  const rankInStock = calculateFinalSearchRank(100, 80, true);
  const rankOutOfStock = calculateFinalSearchRank(100, 80, false);
  // (100 * 0.5) + (80 * 0.3) + (100 * 0.2) = 50 + 24 + 20 = 94
  assert(rankInStock === 94, `In-stock final rank matches exact mathematical formula (expected 94, got ${rankInStock})`);

  // 5. Task 47: Strict Out-of-Stock Demotion Rule
  // In-stock score component = 0, and penalty = -35
  // (100 * 0.5) + (80 * 0.3) + 0 = 74 - 35 = 39
  assert(rankOutOfStock === 39, `Out-of-stock final rank receives strict 35-point penalty (expected 39, got ${rankOutOfStock})`);
  assert(rankInStock - rankOutOfStock === 55, 'Rank differential between in-stock and out-of-stock is exactly 55 points');

  // 6. Task 43: Security Sanitization
  const cleanXSS = sanitizeQueryForSecurity('<script>alert("hack")</script>wbcs');
  assert(!cleanXSS.includes('<script>') && cleanXSS.includes('wbcs'), 'Strips XSS script tag');
  const cleanSQLi = sanitizeQueryForSecurity("wbcs' UNION SELECT * FROM users--");
  assert(!cleanSQLi.toLowerCase().includes('union') && !cleanSQLi.includes('--'), 'Strips SQL injection keywords');

  // 7. Task 44: IP-based Rate Limiter (60 req/min)
  resetRateLimiter();
  const testIp = '192.168.1.100';
  let allowedCount = 0;
  for (let i = 0; i < 60; i++) {
    if (checkRateLimit(testIp).allowed) allowedCount++;
  }
  assert(allowedCount === 60, 'Allows first 60 requests within sliding window');
  const blockCheck = checkRateLimit(testIp);
  assert(!blockCheck.allowed && blockCheck.retryAfter > 0, 'Rejects 61st request with 429 retryAfter');

  // 8. Task 42: Edge / In-Memory KV Caching
  clearSearchCache();
  const cacheKey = buildSearchCacheKey('wbcs', 'all', 4);
  assert(getCachedSearchResults(cacheKey) === null, 'Returns null on cache miss');
  const mockCacheResponse: any = { query: 'wbcs', books: [], keywords: [], categories: [], totalCount: 0, executionTimeMs: 10 };
  setCachedSearchResults(cacheKey, mockCacheResponse);
  const hitData = getCachedSearchResults(cacheKey);
  assert(hitData !== null && hitData.query === 'wbcs', 'Returns cached search results on cache HIT');

  // 9. Task 49: Search Performance Telemetry & Slow Query Alert (>500ms)
  resetSearchTelemetry();
  const fastRecorded = recordSearchTiming('wbcs fast', 45, 'competitive-exams');
  assert(!fastRecorded, 'Fast query under 500ms is not flagged as slow');
  const slowRecorded = recordSearchTiming('heavy regex query', 580, 'all');
  assert(slowRecorded, 'Query exceeding 500ms is flagged as slow');
  const metrics = getSearchTelemetryMetrics();
  assert(metrics.totalSearches === 2, 'Tracks total searches in telemetry metrics');
  assert(metrics.slowSearchesCount === 1, 'Tracks slow queries count in telemetry metrics');

  // 10. Task 48: PWA Offline Search Engine
  assert(typeof isOfflineSearchSupported === 'function', 'Exposes isOfflineSearchSupported');

  return { passed, failed, errors };
}
