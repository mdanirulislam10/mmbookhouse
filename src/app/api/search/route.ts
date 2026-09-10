import { NextRequest, NextResponse } from 'next/server';
import { BOOKS_CATALOG } from '@/lib/data/booksCatalog';
import { SEARCH_CATEGORIES, LiveSearchResponse, LiveSearchCategoryMatch, LiveSearchResultItem } from '@/types/search';
import {
  sanitizeSearchText,
  sanitizeQueryForSecurity,
  expandSynonyms,
  transliterateRomanToBengali,
  resolveAuthorPhonetics,
  scoreBookMatch,
  ScoredMatch,
  isWithinLevenshteinMargin,
  calculateWordSimilarity,
} from '@/lib/utils/searchEngine';
import { supabase } from '@/lib/supabase/client';
import { checkRateLimit, extractClientIp } from '@/lib/utils/search/rateLimiter';
import { buildSearchCacheKey, getCachedSearchResults, setCachedSearchResults } from '@/lib/utils/search/searchCache';
import { logZeroResultSearch } from '@/lib/utils/search/zeroResultLogger';
import { recordSearchTiming } from '@/lib/utils/search/telemetry';

/**
 * Module 5 - Division 9 & 10: Backend API, Performance Telemetry & Security
 *
 * - Task 41: Ultra-lightweight JSON payload (< 2KB response)
 * - Task 42: Edge / In-Memory KV Caching (5–20ms response, X-Cache: HIT / MISS)
 * - Task 43: SQL Injection & XSS input sanitization engine
 * - Task 44: IP-based rate limiting & bot protection (max 60 req/min per IP)
 * - Task 45: Zero-result search analytics logger ("Wanted Books")
 * - Task 47: Stock filter parameter support (inStock=true)
 * - Task 49: Slow query alert and telemetry monitoring (> 500ms execution warning)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();

  // Task 44: IP-based Rate Limiting (Max 60 req/min per IP)
  const clientIp = extractClientIp(request.headers);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many search requests. Please slow down.',
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  // Strict quota: maximum 4 books allowed
  const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 4);
  // Task 47: Stock filter parameter support
  const inStockParam = searchParams.get('in_stock') || searchParams.get('inStock');
  const inStockOnly = inStockParam === 'true' || inStockParam === '1';

  // Task 43: SQL Injection & XSS Sanitization + Task 14 Text Sanitization
  const secureQuery = sanitizeQueryForSecurity(rawQuery);
  const cleanQuery = sanitizeSearchText(secureQuery);

  // Task 1: Minimum threshold (>= 2 characters)
  if (cleanQuery.length < 2) {
    const emptyResponse: LiveSearchResponse = {
      query: secureQuery,
      books: [],
      keywords: [],
      categories: [],
      didYouMean: null,
      totalCount: 0,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
    return NextResponse.json(emptyResponse, {
      headers: {
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  }

  // Task 42: Check Edge / In-Memory KV Cache (5–20ms response time)
  const cacheKey = buildSearchCacheKey(cleanQuery, category, limit) + (inStockOnly ? ':instock' : '');
  const cachedData = getCachedSearchResults(cacheKey);

  if (cachedData) {
    const cachedExecutionMs = Math.round(performance.now() - startTime);
    const isSlow = recordSearchTiming(cleanQuery, cachedExecutionMs, category, clientIp);
    const hitHeaders: Record<string, string> = {
      'X-Cache': 'HIT',
      'X-RateLimit-Limit': String(rateLimit.limit),
      'X-RateLimit-Remaining': String(rateLimit.remaining),
      'X-Execution-Time': `${cachedExecutionMs}ms`,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    };
    if (isSlow) {
      hitHeaders['X-Slow-Query'] = 'true';
    }
    return NextResponse.json(
      {
        ...cachedData,
        executionTimeMs: cachedExecutionMs,
      },
      {
        headers: hitHeaders,
      }
    );
  }

  // Attempt Supabase PostgreSQL RPC if configured
  let isDbSuccess = false;
  let matchedBooks: LiveSearchResultItem[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const { data, error } = await supabase.rpc('search_books_typeahead', {
        search_query: cleanQuery,
        target_category: category,
        result_limit: limit,
        similarity_cutoff: 0.3,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        matchedBooks = data.map((b: any) => ({
          id: b.book_id,
          bookId: b.slug,
          slug: b.slug,
          title: b.title,
          titleBn: b.title_bn,
          author: b.author_name,
          authorBn: b.author_name_bn,
          publisher: b.publisher_name,
          category: b.category_id,
          categoryName: b.category_id,
          price: Number(b.selling_price),
          mrp: Number(b.mrp),
          discount: `${b.discount_percent}%`,
          discountPercent: Number(b.discount_percent),
          inStock: Boolean(b.in_stock),
        }));
        if (inStockOnly) {
          matchedBooks = matchedBooks.filter((b) => b.inStock);
        }
        isDbSuccess = true;
      }
    } catch {
      // Fall through to high-speed local engine
    }
  }

  // Fallback: Use High-speed Local Weighted Engine (Tasks 16-20)
  let scoredMatches: ScoredMatch[] = [];

  if (!isDbSuccess) {
    let candidates = BOOKS_CATALOG;
    if (category && category !== 'all') {
      candidates = candidates.filter((b) => b.category === category);
    }
    // Task 47: Stock filter candidate constraint
    if (inStockOnly) {
      candidates = candidates.filter((b) => b.inStock);
    }

    for (const book of candidates) {
      const match = scoreBookMatch(cleanQuery, book);
      if (match) {
        scoredMatches.push(match);
      }
    }

    // Sort by weighted match score descending (Task 20)
    scoredMatches.sort((a, b) => b.score - a.score);
    matchedBooks = scoredMatches.slice(0, limit).map((m) => m.book);
  }

  // Task 15, 16 & 17: Synonyms, Transliterations and Author Phonetics for Keywords
  const synonyms = expandSynonyms(cleanQuery);
  const transliterations = transliterateRomanToBengali(cleanQuery);
  const authorVariants = resolveAuthorPhonetics(cleanQuery);
  const allSearchVariants = Array.from(
    new Set([cleanQuery, ...synonyms, ...transliterations, ...authorVariants])
  );

  const keywordsSet = new Set<string>();

  for (const b of BOOKS_CATALOG) {
    const cleanTitle = sanitizeSearchText(b.title);
    const cleanTitleBn = sanitizeSearchText(b.titleBn);
    const cleanAuthor = sanitizeSearchText(b.author);
    const cleanAuthorBn = sanitizeSearchText(b.authorBn);

    const matchesVariant = allSearchVariants.some(
      (v) =>
        cleanTitle.includes(v) ||
        cleanTitleBn.includes(v) ||
        cleanAuthor.includes(v) ||
        cleanAuthorBn.includes(v)
    );

    if (matchesVariant) {
      if (cleanTitle.includes(cleanQuery) || synonyms.some((s) => cleanTitle.includes(s))) {
        keywordsSet.add(b.title.split('(')[0].trim());
      }
      if (cleanTitleBn.includes(cleanQuery) || synonyms.some((s) => cleanTitleBn.includes(s))) {
        keywordsSet.add(b.titleBn.split('(')[0].trim());
      }
      for (const t of transliterations) {
        if (cleanTitleBn.includes(t)) {
          keywordsSet.add(b.titleBn.split('(')[0].trim());
        }
      }
    }
    if (keywordsSet.size >= 4) break;
  }

  // Matching Category Shortcuts
  const matchedCategories: LiveSearchCategoryMatch[] = [];
  for (const cat of SEARCH_CATEGORIES) {
    if (cat.id === 'all') continue;
    const catNameClean = sanitizeSearchText(cat.name);
    const catNameBnClean = sanitizeSearchText(cat.nameBn);

    const matchesCat = allSearchVariants.some(
      (v) => catNameClean.includes(v) || catNameBnClean.includes(v)
    );

    if (matchesCat) {
      const count = BOOKS_CATALOG.filter((b) => b.category === cat.id).length;
      matchedCategories.push({
        id: cat.id,
        name: cat.name,
        nameBn: cat.nameBn,
        count,
      });
    }
  }

  // Task 13, 16 & 38: Dynamic "Did you mean" typo suggestion engine (Database & Catalog backed)
  let didYouMean: string | null = null;
  const hasStrongMatch = scoredMatches.some(
    (m) => m.matchType === 'exact' || m.matchType === 'prefix' || m.matchType === 'multiword'
  );
  if ((matchedBooks.length === 0 || !hasStrongMatch) && cleanQuery.length >= 3) {
    if (transliterations.length > 0 && transliterations[0].toLowerCase() !== cleanQuery) {
      didYouMean = transliterations[0];
    } else {
      let bestCandidate: string | null = null;
      let highestSimilarity = 0;

      for (const b of BOOKS_CATALOG) {
        const cleanT = sanitizeSearchText(b.title);
        const cleanTBn = sanitizeSearchText(b.titleBn);
        const sim = Math.max(
          calculateWordSimilarity(cleanQuery, cleanT),
          calculateWordSimilarity(cleanQuery, cleanTBn)
        );

        if (sim > highestSimilarity && sim >= 0.35) {
          highestSimilarity = sim;
          bestCandidate = b.title.split('(')[0].trim();
        }
      }

      if (bestCandidate && bestCandidate.toLowerCase() !== cleanQuery) {
        didYouMean = bestCandidate;
      } else {
        const commonTerms = [
          { term: 'wbcs', label: 'WBCS 2026 Manual' },
          { term: 'ugb', label: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB) সহায়িকা' },
          { term: 'tet', label: 'WB Primary TET গাইড' },
          { term: 'police', label: 'ডাব্লুবি পুলিশ কনস্টেবল ও এসআই' },
          { term: 'railway', label: 'রেলওয়ে (RRB) নন-টেকনিক্যাল গাইড' },
          { term: 'byomkesh', label: 'ব্যোমকেশ সমগ্র আনন্দ পাবলিশার্স' },
          { term: 'rabindranath', label: 'রবীন্দ্রনাথ ঠাকুরের সঞ্চয়িতা' },
          { term: 'maitra', label: 'ড. অমিতাভ মৈত্র' },
          { term: 'mitra', label: 'ড. অমিতাভ মৈত্র' },
        ];

        for (const item of commonTerms) {
          if (isWithinLevenshteinMargin(cleanQuery, item.term) || synonyms.includes(item.term)) {
            didYouMean = item.label;
            break;
          }
        }
      }
    }
  }

  // Task 41: Ultra-Lightweight Response Payload (< 2KB)
  const lightweightBooks = matchedBooks.map((b) => ({
    id: b.id,
    bookId: b.slug,
    slug: b.slug,
    title: b.title,
    titleBn: b.titleBn,
    author: b.author,
    authorBn: b.authorBn,
    publisher: b.publisher,
    category: b.category,
    categoryName: b.categoryName,
    price: b.price,
    mrp: b.mrp,
    discount: b.discount,
    discountPercent: b.discountPercent,
    inStock: b.inStock,
    coverImage: b.coverImage,
  }));

  // Task 45: Zero-Result Search Analytics Logger ("Wanted Books")
  if (lightweightBooks.length === 0 && cleanQuery.length >= 3) {
    logZeroResultSearch(cleanQuery, category, clientIp).catch(() => {});
  }

  const executionTimeMs = Math.round(performance.now() - startTime);
  const isSlowQuery = recordSearchTiming(cleanQuery, executionTimeMs, category, clientIp);

  // Response strictly adheres to the 10 item quota: 4 books + 4 keywords + 2 categories
  const response: LiveSearchResponse = {
    query: secureQuery,
    books: lightweightBooks,
    keywords: Array.from(keywordsSet).slice(0, 4),
    categories: matchedCategories.slice(0, 2),
    didYouMean,
    totalCount: isDbSuccess ? lightweightBooks.length : scoredMatches.length,
    executionTimeMs,
  };

  // Task 42: Cache search result in Edge/Memory KV Cache
  setCachedSearchResults(cacheKey, response);

  const missHeaders: Record<string, string> = {
    'X-Cache': 'MISS',
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-Execution-Time': `${executionTimeMs}ms`,
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  };
  if (isSlowQuery) {
    missHeaders['X-Slow-Query'] = 'true';
  }

  return NextResponse.json(response, {
    headers: missHeaders,
  });
}
