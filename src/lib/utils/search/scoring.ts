/**
 * Module 5: Search Utilities - Trigram, Levenshtein, Boolean Matching & Scoring
 *
 * - Task 11: Trigram matching algorithms
 * - Task 12: Word similarity > 0.3 threshold engine
 * - Task 13: Levenshtein distance 1-2 character typo tolerance
 * - Task 19: Multi-Word '&' Boolean Full-Text Search & Prefix Scanning
 * - Task 20: Weighted Multi-Column Search Vector (Weight A/B/C)
 */

import { LiveSearchResultItem } from '@/types/search';
import { sanitizeSearchText, filterStopwords, expandSynonyms } from './synonyms';
import { transliterateRomanToBengali, resolveAuthorPhonetics, soundex } from './phonetics';

// TASK 13: Levenshtein Distance Algorithm (1-2 char typo tolerance)
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const m = s1.length;
  const n = s2.length;

  if (s1 === s2) return 0;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,
        currRow[j - 1] + 1,
        prevRow[j - 1] + cost
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

export function isWithinLevenshteinMargin(queryToken: string, targetToken: string): boolean {
  if (!queryToken || !targetToken) return false;
  const qLen = queryToken.length;
  const tLen = targetToken.length;

  if (Math.abs(qLen - tLen) > 2) return false;

  const maxAllowedDist = qLen >= 6 ? 2 : qLen >= 4 ? 1 : 0;
  return levenshteinDistance(queryToken, targetToken) <= maxAllowedDist;
}

// TASK 11 & 12: Trigram Generation & Similarity
export function generateTrigrams(text: string): Set<string> {
  const padded = `  ${text.toLowerCase()} `;
  const trigrams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.substring(i, i + 3));
  }
  return trigrams;
}

export function calculateTrigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1.0;

  const triA = generateTrigrams(a);
  const triB = generateTrigrams(b);

  let intersection = 0;
  for (const tri of triA) {
    if (triB.has(tri)) {
      intersection++;
    }
  }

  const union = triA.size + triB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function calculateWordSimilarity(query: string, target: string): number {
  const cleanQ = sanitizeSearchText(query);
  const cleanT = sanitizeSearchText(target);

  if (!cleanQ || !cleanT) return 0;
  // Whole text match or exact word match gets 1.0
  if (cleanT === cleanQ) return 1.0;
  const words = cleanT.split(' ');
  if (words.some((w) => w === cleanQ)) return 1.0;

  let maxSim = calculateTrigramSimilarity(cleanQ, cleanT);

  const qWordCount = cleanQ.split(' ').length;
  for (let i = 0; i <= words.length - qWordCount; i++) {
    const chunk = words.slice(i, i + qWordCount).join(' ');
    const sim = calculateTrigramSimilarity(cleanQ, chunk);
    if (sim > maxSim) {
      maxSim = sim;
    }
  }

  return maxSim;
}

// TASK 19: Multi-Word '&' Boolean Full-Text Matcher & Prefix Scanning
export function matchMultiWordTokens(queryTokens: string[], candidateText: string): boolean {
  if (!queryTokens.length || !candidateText) return false;
  const targetWords = candidateText.toLowerCase().split(' ');

  return queryTokens.every((qToken) => {
    return targetWords.some((tWord) => tWord.startsWith(qToken) || tWord.includes(qToken));
  });
}

// TASK 20: Weighted Multi-Column Search Vector Matcher
export interface ScoredMatch {
  book: LiveSearchResultItem;
  score: number;
  matchType: 'exact' | 'prefix' | 'trigram' | 'levenshtein' | 'synonym' | 'phonetic' | 'multiword';
}

export function scoreBookMatch(rawQuery: string, book: LiveSearchResultItem): ScoredMatch | null {
  const cleanQuery = sanitizeSearchText(rawQuery);
  if (cleanQuery.length < 2) return null;

  const titleClean = sanitizeSearchText(book.title);
  const titleBnClean = sanitizeSearchText(book.titleBn);
  const authorClean = sanitizeSearchText(book.author);
  const authorBnClean = sanitizeSearchText(book.authorBn);
  const publisherClean = sanitizeSearchText(book.publisher);
  const categoryClean = sanitizeSearchText(book.category);

  // Stopword-filtered tokens (Task 18)
  const rawTokens = cleanQuery.split(' ').filter(Boolean);
  const meaningfulTokens = filterStopwords(rawTokens);

  // Phonetics & Synonyms Expansion (Tasks 15, 16, 17)
  const synonyms = expandSynonyms(cleanQuery);
  const transliterations = transliterateRomanToBengali(cleanQuery);
  const authorPhonetics = resolveAuthorPhonetics(cleanQuery);

  let weightAScore = 0; // Title (Multiplier: 1.0 -> max 100)
  let weightBScore = 0; // Author (Multiplier: 0.7 -> max 70)
  let weightCScore = 0; // Publisher / Category (Multiplier: 0.4 -> max 40)
  let matchType: ScoredMatch['matchType'] = 'trigram';

  // 1. WEIGHT A: TITLE MATCHING (Exact, Prefix, Substring, Transliteration)
  if (titleClean.startsWith(cleanQuery) || titleBnClean.startsWith(cleanQuery)) {
    weightAScore = 100;
    matchType = 'prefix';
  } else if (titleClean.includes(cleanQuery) || titleBnClean.includes(cleanQuery)) {
    weightAScore = 85;
    matchType = 'exact';
  } else {
    for (const trans of transliterations) {
      if (titleClean.includes(trans) || titleBnClean.includes(trans)) {
        weightAScore = Math.max(weightAScore, 80);
        matchType = 'phonetic';
        break;
      }
    }

    if (weightAScore === 0) {
      for (const syn of synonyms) {
        if (titleClean.includes(syn) || titleBnClean.includes(syn)) {
          weightAScore = Math.max(weightAScore, 75);
          matchType = 'synonym';
          break;
        }
      }
    }
  }

  // Multi-word boolean AND check across Title, Author & Publisher (Tasks 19 & 20)
  // e.g. "মৈত্র ইতিহাস" -> "মৈত্র" (Author) + "ইতিহাস" (Title)
  if (meaningfulTokens.length > 1) {
    const combinedMetadata = `${titleClean} ${titleBnClean} ${authorClean} ${authorBnClean} ${publisherClean} ${categoryClean}`;
    if (matchMultiWordTokens(meaningfulTokens, combinedMetadata)) {
      const matchesTitle = meaningfulTokens.some((t) => titleClean.includes(t) || titleBnClean.includes(t));
      const matchesAuthor = meaningfulTokens.some((t) => authorClean.includes(t) || authorBnClean.includes(t));
      if (matchesTitle && matchesAuthor) {
        weightAScore = Math.max(weightAScore, 90);
        weightBScore = Math.max(weightBScore, 65);
      } else if (matchesTitle) {
        weightAScore = Math.max(weightAScore, 80);
      } else {
        weightAScore = Math.max(weightAScore, 70);
      }
      matchType = 'multiword';
    }
  }

  // Trigram similarity on title (Task 12)
  if (weightAScore === 0) {
    const titleSim = Math.max(
      calculateWordSimilarity(cleanQuery, titleClean),
      calculateWordSimilarity(cleanQuery, titleBnClean)
    );
    if (titleSim >= 0.3) {
      weightAScore = 30 + titleSim * 30;
      matchType = 'trigram';
    }
  }

  // 2. WEIGHT B: AUTHOR MATCHING (Exact, Phonetics, Soundex)
  if (authorClean.startsWith(cleanQuery) || authorBnClean.startsWith(cleanQuery)) {
    weightBScore = 70;
    if (weightAScore === 0) matchType = 'prefix';
  } else if (authorClean.includes(cleanQuery) || authorBnClean.includes(cleanQuery)) {
    weightBScore = 60;
    if (weightAScore === 0) matchType = 'exact';
  } else {
    for (const aVariant of authorPhonetics) {
      if (authorClean.includes(aVariant) || authorBnClean.includes(aVariant)) {
        weightBScore = Math.max(weightBScore, 55);
        if (weightAScore === 0) matchType = 'phonetic';
        break;
      }
    }

    if (weightBScore === 0 && cleanQuery.length >= 3 && authorClean.length >= 3) {
      const qSoundex = soundex(cleanQuery);
      // Bug Fix: Only compare soundex if query contains valid Latin characters (prevents empty string match for Bengali)
      if (qSoundex && qSoundex.length > 0) {
        const aWords = authorClean.split(' ');
        if (aWords.some((aw) => {
          const awSoundex = soundex(aw);
          return awSoundex && awSoundex.length > 0 && awSoundex === qSoundex;
        })) {
          weightBScore = 40;
          if (weightAScore === 0) matchType = 'phonetic';
        }
      }
    }
  }

  // 3. WEIGHT C: PUBLISHER, CATEGORY & METADATA
  if (publisherClean.includes(cleanQuery)) {
    weightCScore = 40;
    if (weightAScore === 0 && weightBScore === 0) matchType = 'exact';
  } else if (categoryClean.includes(cleanQuery)) {
    weightCScore = 30;
    if (weightAScore === 0 && weightBScore === 0) matchType = 'exact';
  }

  // 4. LEVENSHTEIN TYPO TOLERANCE FALLBACK (Task 13)
  if (weightAScore === 0 && weightBScore === 0 && weightCScore === 0) {
    const allTokens = [
      ...titleClean.split(' '),
      ...titleBnClean.split(' '),
      ...authorClean.split(' '),
    ];

    let hasLevMatch = false;
    for (const qToken of meaningfulTokens) {
      if (qToken.length >= 3) {
        for (const tToken of allTokens) {
          if (isWithinLevenshteinMargin(qToken, tToken)) {
            hasLevMatch = true;
            break;
          }
        }
      }
      if (hasLevMatch) break;
    }

    if (hasLevMatch) {
      weightAScore = 35;
      matchType = 'levenshtein';
    }
  }

  // Raw match check: if no component matched, return null
  const rawTextScore = weightAScore * 1.0 + weightBScore * 0.7 + weightCScore * 0.4;
  if (rawTextScore <= 0) return null;

  // 5. OFFICIAL MULTI-FACTOR RANKING FORMULA (Task 46 & Question 48)
  const textMatchScore = Math.min(100, Math.round(rawTextScore));
  const bestsellerScore = calculateBestsellerScore(book);
  const finalRank = calculateFinalSearchRank(textMatchScore, bestsellerScore, Boolean(book.inStock));

  return {
    book,
    score: finalRank,
    matchType,
  };
}

// Bestseller & Popularity Score (0 - 100) based on book rating (0-5) and discount attractiveness
export function calculateBestsellerScore(book: { rating?: number; discountPercent?: number }): number {
  const rating = book.rating ?? 4.5;
  const ratingComponent = (Math.min(5, Math.max(3, rating)) / 5) * 75; // Up to 75 points
  const discountComponent = Math.min(25, (book.discountPercent || 0) * 0.6); // Up to 25 points
  return Math.round(ratingComponent + discountComponent);
}

// 5. OFFICIAL MULTI-FACTOR RANKING FORMULA (Task 46 & Question 48)
// Search Rank = (Text Match Score * 0.5) + (Bestseller Score * 0.3) + (In-Stock Status * 0.2)
export function calculateFinalSearchRank(textMatchScore: number, bestsellerScore: number, inStock: boolean): number {
  const inStockScore = inStock ? 100 : 0;
  let finalRank = Math.round(
    (textMatchScore * 0.5) +
    (bestsellerScore * 0.3) +
    (inStockScore * 0.2)
  );
  // Task 29 & Task 47: Strict Out-of-Stock Demotion Rule
  if (!inStock) {
    finalRank = Math.max(1, finalRank - 35);
  }
  return finalRank;
}
