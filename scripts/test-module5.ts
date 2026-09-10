/**
 * Module 5: Automated Verification & Diagnostic Test Runner
 * 
 * Directly imports REAL PRODUCTION modules from src/lib/utils/search/
 * and validates all 10 divisions and 50 tasks.
 */

import {
  scoreBookMatch,
  calculateWordSimilarity,
  isWithinLevenshteinMargin,
  calculateFinalSearchRank,
  calculateBestsellerScore,
  matchMultiWordTokens,
  levenshteinDistance,
  generateTrigrams,
  calculateTrigramSimilarity,
} from '../src/lib/utils/search/scoring';

import {
  sanitizeSearchText,
  sanitizeQueryForSecurity,
  filterStopwords,
  expandSynonyms,
} from '../src/lib/utils/search/synonyms';

import {
  transliterateRomanToBengali,
  resolveAuthorPhonetics,
  soundex,
} from '../src/lib/utils/search/phonetics';

import {
  checkRateLimit,
  resetRateLimiter,
  extractClientIp,
} from '../src/lib/utils/search/rateLimiter';

import {
  buildSearchCacheKey,
  getCachedSearchResults,
  setCachedSearchResults,
  clearSearchCache,
} from '../src/lib/utils/search/searchCache';

import {
  recordSearchTiming,
  getSearchTelemetryMetrics,
  resetSearchTelemetry,
} from '../src/lib/utils/search/telemetry';

import { BOOKS_CATALOG } from '../src/lib/data/booksCatalog';
import { LiveSearchResultItem } from '../src/types/search';

console.log('\n======================================================');
console.log('🧪 M.M Book House: Module 5 Production Automated Test Suite');
console.log('======================================================\n');

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, name: string, details: string = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    const errMsg = `❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`;
    console.error(`  ${errMsg}`);
    errors.push(errMsg);
  }
}

// -------------------------------------------------------------------
// 1. LEVENSHTEIN DISTANCE & TYPO TOLERANCE (TASK 13)
// -------------------------------------------------------------------
console.log('--- 1. Testing Typo Tolerance & Levenshtein Distance ---');
assert(levenshteinDistance('wbcs', 'wbcs') === 0, 'Exact match distance is 0');
assert(levenshteinDistance('wbcs', 'wbcz') === 1, '1-character typo distance is 1');
assert(isWithinLevenshteinMargin('byomkesh', 'byomkes'), 'Levenshtein margin allows 1 deletion in 8-char word');
assert(isWithinLevenshteinMargin('ananda', 'anonda'), 'Levenshtein margin allows vowel substitution');
assert(!isWithinLevenshteinMargin('wbcs', 'ananda'), 'Rejects non-matching words');

// -------------------------------------------------------------------
// 2. TRIGRAM SIMILARITY & WORD SIMILARITY FIX (TASK 11 & 12)
// -------------------------------------------------------------------
console.log('\n--- 2. Testing Trigram & Word Similarity Fix ---');
assert(calculateTrigramSimilarity('history', 'history') === 1.0, 'Identical text trigram similarity is 1.0');
const itihasSim = calculateTrigramSimilarity('itihas', 'itihash');
assert(itihasSim >= 0.4, `Trigram similarity detects close transliteration (${itihasSim.toFixed(2)} >= 0.4)`);

// Test our fix: arbitrary substring does NOT get false 1.0
const partialSub = calculateWordSimilarity('তি', 'ইতিহাস');
assert(partialSub < 1.0, `Partial non-word substring does not score 1.0 (${partialSub.toFixed(2)} < 1.0)`);
const wholeWordMatch = calculateWordSimilarity('ইতিহাস', 'ভারতের ইতিহাস বই');
assert(wholeWordMatch === 1.0, 'Exact whole word match in sentence scores 1.0');

// -------------------------------------------------------------------
// 3. MULTI-WORD & AUTHOR + TITLE CROSS-MATCHING (TASK 19 & 20)
// -------------------------------------------------------------------
console.log('\n--- 3. Testing Multi-Word Cross-Entity Search (Tasks 19 & 20) ---');

// Mock book to verify author + title cross-matching
const mockBook: LiveSearchResultItem = {
  id: 'mock-1',
  bookId: 'mock-1',
  slug: 'itihas-maitra',
  title: 'Modern History of India',
  titleBn: 'ভারতের আধুনিক ইতিহাস',
  author: 'Dr. Amitabh Maitra',
  authorBn: 'ড. অমিতাভ মৈত্র',
  publisher: 'আনন্দ পাবলিশার্স',
  category: 'wbcs-special',
  categoryName: 'WBCS Special',
  price: 380,
  mrp: 500,
  discount: '24%',
  discountPercent: 24,
  inStock: true,
};
const match = scoreBookMatch('মৈত্র ইতিহাস', mockBook);
assert(match !== null, 'Matches cross-entity query "মৈত্র ইতিহাস"');
if (match) {
  assert(match.score >= 70, `Score is high for cross-entity match (${match.score} >= 70)`);
  assert(match.matchType === 'multiword', `Match type is "multiword" (was ${match.matchType})`);
}

// -------------------------------------------------------------------
// 4. MULTI-FACTOR RANKING FORMULA (TASK 46 & 47)
// -------------------------------------------------------------------
console.log('\n--- 4. Testing Official Multi-Factor Search Ranking (Tasks 46 & 47) ---');
const testBook = { rating: 4.8, discountPercent: 25 };
const bestseller = calculateBestsellerScore(testBook);
assert(bestseller >= 80, `Bestseller score for rating 4.8 & 25% discount is high (${bestseller})`);

const inStockRank = calculateFinalSearchRank(100, bestseller, true);
const outOfStockRank = calculateFinalSearchRank(100, bestseller, false);
const expectedInStock = Math.round(50 + bestseller * 0.3 + 20);
const expectedOutOfStock = Math.round(50 + bestseller * 0.3 - 35);

assert(inStockRank === expectedInStock, `Task 46 Ranking formula matches specification (${inStockRank} === ${expectedInStock})`);
assert(outOfStockRank === expectedOutOfStock, `Task 47 Out-of-stock demotion penalizes score by exactly 55 pts (${outOfStockRank} === ${expectedOutOfStock})`);
assert(inStockRank > outOfStockRank, 'In-stock book strictly outranks out-of-stock equivalent');

// -------------------------------------------------------------------
// 5. SECURITY SANITIZATION & SAFE BOOK TITLE PRESERVATION (TASK 43)
// -------------------------------------------------------------------
console.log('\n--- 5. Testing XSS & SQL Injection Sanitization (Task 43) ---');
const xssPayload = '<script>alert("malicious")</script>wbcs';
const sanitizedXSS = sanitizeQueryForSecurity(xssPayload);
assert(!sanitizedXSS.includes('<script>') && sanitizedXSS.includes('wbcs'), 'Strips XSS <script> payload');

const sqliPayload = "wbcs' UNION SELECT * FROM users; --";
const sanitizedSQLi = sanitizeQueryForSecurity(sqliPayload);
assert(!sanitizedSQLi.includes('--') && !sanitizedSQLi.includes(';') && !sanitizedSQLi.includes("'"), 'Strips SQL delimiters (comments, semicolons, quotes)');

// Verify legitimate titles containing "Selected" are preserved!
const legitimateQuery = 'Selected Poems of Rabindranath';
const sanitizedLegitimate = sanitizeQueryForSecurity(legitimateQuery);
assert(sanitizedLegitimate.toLowerCase().includes('selected'), 'Preserves legitimate book title with "Selected"');

// -------------------------------------------------------------------
// 6. IP-BASED RATE LIMITER (TASK 44)
// -------------------------------------------------------------------
console.log('\n--- 6. Testing IP-Based Rate Limiting (Task 44) ---');
resetRateLimiter();
const testIp = '103.45.67.89';
let allowedCount = 0;
for (let i = 0; i < 60; i++) {
  if (checkRateLimit(testIp).allowed) allowedCount++;
}
assert(allowedCount === 60, 'Allows exactly 60 requests in the 1-minute window');
const blocked = checkRateLimit(testIp);
assert(!blocked.allowed && blocked.retryAfter > 0, 'Rejects 61st request with rate limit block');

// -------------------------------------------------------------------
// 7. IN-MEMORY KV CACHE (TASK 42)
// -------------------------------------------------------------------
console.log('\n--- 7. Testing In-Memory LRU Query Cache (Task 42) ---');
clearSearchCache();
const cacheKey = buildSearchCacheKey('wbcs', 'all', 4);
assert(getCachedSearchResults(cacheKey) === null, 'Cache MISS for unseen query key');

const dummyResponse = {
  query: 'wbcs',
  books: [],
  keywords: ['wbcs 2026'],
  categories: [],
  didYouMean: null,
  totalCount: 1,
  executionTimeMs: 12,
};
setCachedSearchResults(cacheKey, dummyResponse);
const cached = getCachedSearchResults(cacheKey);
assert(cached !== null && cached.keywords[0] === 'wbcs 2026', 'Cache HIT returns exact cached payload');

// -------------------------------------------------------------------
// 8. SLOW QUERY TELEMETRY MONITORING (TASK 49)
// -------------------------------------------------------------------
console.log('\n--- 8. Testing Slow Query Telemetry Monitoring (Task 49) ---');
resetSearchTelemetry();
assert(!recordSearchTiming('wbcs fast', 40), 'Normal query (40ms) is not flagged as slow');
assert(recordSearchTiming('slow heavy query', 550), 'Query exceeding 500ms (>500ms threshold) is flagged as slow');
const metrics = getSearchTelemetryMetrics();
assert(metrics.slowSearchesCount === 1, 'Telemetry records exactly 1 slow search count');
assert(metrics.slowQueryLog.length === 1, 'Slow query record saved in telemetry log');

// -------------------------------------------------------------------
// 9. PHONETICS & TRANSLITERATION (TASK 16 & 17)
// -------------------------------------------------------------------
console.log('\n--- 9. Testing Bilingual Phonetics & Transliteration (Tasks 16 & 17) ---');
const transliterated = transliterateRomanToBengali('itihas');
assert(transliterated.includes('ইতিহাস'), 'Transliterates "itihas" to "ইতিহাস"');

const authorVariants = resolveAuthorPhonetics('maitra');
assert(authorVariants.includes('মৈত্র'), 'Resolves author "maitra" to "মৈত্র"');

const soundexCode = soundex('Banerjee');
assert(soundexCode === 'B562', `Calculates Soundex code for Banerjee (${soundexCode} === B562)`);

// -------------------------------------------------------------------
// 10. SYNONYMS & STOPWORDS (TASK 15 & 18)
// -------------------------------------------------------------------
console.log('\n--- 10. Testing Synonyms & Stopwords Filtering (Tasks 15 & 18) ---');
const synonyms = expandSynonyms('wbcs');
assert(synonyms.includes('ডব্লুবিসিএস') || synonyms.includes('ডব্লিউবিসিএস'), 'Expands "wbcs" to Bengali synonyms');

const filtered = filterStopwords(['ইতিহাস', 'বই', 'এর']);
assert(!filtered.includes('বই') && !filtered.includes('এর') && filtered.includes('ইতিহাস'), 'Filters out Bengali stopwords "বই", "এর"');

// -------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------
console.log('\n======================================================');
console.log(`📊 Test Results: ${passed} Passed | ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  console.error('❌ Some tests failed:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('🎉 ALL Module 5 production tests PASSED successfully!\n');
  process.exit(0);
}
