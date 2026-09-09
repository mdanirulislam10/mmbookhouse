import { NextRequest, NextResponse } from 'next/server';
import { BOOKS_CATALOG } from '@/lib/data/booksCatalog';
import { SEARCH_CATEGORIES, LiveSearchResponse, LiveSearchCategoryMatch } from '@/types/search';
import {
  sanitizeSearchText,
  expandSynonyms,
  transliterateRomanToBengali,
  resolveAuthorPhonetics,
  scoreBookMatch,
  ScoredMatch,
  isWithinLevenshteinMargin,
} from '@/lib/utils/searchEngine';
import { supabase } from '@/lib/supabase/client';

/**
 * Module 5 - Division 4: Bilingual, Phonetic & Weighted Typeahead Search API Route
 *
 * - Task 11: Trigram matching & indexing support
 * - Task 12: Word similarity > 0.3 threshold calculation
 * - Task 13: Levenshtein distance 1-2 character typo tolerance
 * - Task 14: Regex punctuation & symbol sanitizer ("M.M", "W.B.C.S")
 * - Task 15: Bengali normalized synonym dictionary & keywords mapping
 * - Task 16: Transliteration / Romanized Bengali Phonetic Search ("itihas" -> "ইতিহাস")
 * - Task 17: Soundex / Metaphone Author Name Resolution ("maitra" / "mitra" / "মৈত্র")
 * - Task 18: Stopwords Filtering ("এর", "বই", "the", "of")
 * - Task 19: Multi-Word '&' Boolean Full-Text Search & Prefix Scanning
 * - Task 20: Weighted Multi-Column Search Vector (Weights A/B/C)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  // Strict quota: maximum 4 books allowed
  const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 4);

  // Task 14: Sanitize search text
  const query = rawQuery.trim();
  const cleanQuery = sanitizeSearchText(query);

  // Task 1: Minimum threshold (>= 2 characters)
  if (cleanQuery.length < 2) {
    const emptyResponse: LiveSearchResponse = {
      query,
      books: [],
      keywords: [],
      categories: [],
      didYouMean: null,
      totalCount: 0,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
    return NextResponse.json(emptyResponse);
  }

  // Attempt Supabase PostgreSQL RPC if configured
  let isDbSuccess = false;
  let matchedBooks: any[] = [];

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
      // If transliterated, also add the Bengali title as keyword
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

  // Task 13, 16: "Did you mean" suggestion generator for typo recovery & transliteration
  let didYouMean: string | null = null;
  if (matchedBooks.length === 0 && cleanQuery.length >= 3) {
    if (transliterations.length > 0) {
      didYouMean = transliterations[0];
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

  const executionTimeMs = Math.round(performance.now() - startTime);

  // Response strictly adheres to the 10 item quota: 4 books + 4 keywords + 2 categories
  const response: LiveSearchResponse = {
    query,
    books: matchedBooks,
    keywords: Array.from(keywordsSet).slice(0, 4),
    categories: matchedCategories.slice(0, 2),
    didYouMean,
    totalCount: isDbSuccess ? matchedBooks.length : scoredMatches.length,
    executionTimeMs,
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
