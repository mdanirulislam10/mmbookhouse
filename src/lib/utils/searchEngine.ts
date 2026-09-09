import { LiveSearchResultItem } from '@/types/search';

/**
 * Module 5: Advanced Live Search & Typo-Tolerant Typeahead Search Engine
 *
 * Division 3 (Tasks 11–15):
 * - Task 11: Trigram matching algorithms
 * - Task 12: Word similarity > 0.3 threshold engine
 * - Task 13: Levenshtein distance 1-2 character typo tolerance
 * - Task 14: Regex punctuation & special character sanitizer
 * - Task 15: Bengali normalized synonym dictionary & keywords mapping
 *
 * Division 4 (Tasks 16–20):
 * - Task 16: Transliteration / Romanized Bengali Phonetic Search
 * - Task 17: Soundex / Metaphone Author Name Resolution
 * - Task 18: Bengali & English Stopwords Filtering
 * - Task 19: Multi-Word '&' Boolean Full-Text Search & Prefix Scanning
 * - Task 20: Weighted Multi-Column Search Vector (Weight A/B/C)
 */

// -----------------------------------------------------------------------------
// TASK 14: Regex Sanitizer for punctuation and special symbols
// "M.M" -> "mm", "W.B.C.S" -> "wbcs", "ড. অতুল" -> "ড অতুল"
// -----------------------------------------------------------------------------
export function sanitizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Remove periods, hyphens, underscores, commas, colons, quotes, slashes, brackets
    .replace(/[\.\-\_\,\:\;\'\"\/\\(\)\[\]]/g, '')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// -----------------------------------------------------------------------------
// TASK 18: Bengali & English Stopwords Filtering
// Strip noise words like "এর", "বই", "the", "of", "and" so search focuses on core semantic terms
// -----------------------------------------------------------------------------
export const BENGALI_STOPWORDS = new Set([
  'এবং', 'ও', 'বা', 'এর', 'বই', 'বইয়ের', 'বইয়ের', 'থেকে', 'দিয়ে', 'দিয়ে',
  'হলো', 'জন্য', 'একটি', 'সব', 'দ্বারা', 'প্রতি', 'নিয়ে', 'নিয়ে', 'টি',
  'গুলো', 'সমূহ', 'সহ', 'সম্পর্কে', 'বিষয়ক', 'বিষয়ক'
]);

export const ENGLISH_STOPWORDS = new Set([
  'the', 'of', 'in', 'and', 'by', 'for', 'a', 'an', 'to', 'with',
  'book', 'books', 'on', 'at', 'from', 'is', 'all', 'edition', 'vol', 'volume'
]);

export function filterStopwords(tokens: string[]): string[] {
  const filtered = tokens.filter((t) => {
    const lower = t.toLowerCase();
    return !BENGALI_STOPWORDS.has(lower) && !ENGLISH_STOPWORDS.has(lower);
  });
  // If all tokens were filtered out, preserve original tokens to avoid empty search
  return filtered.length > 0 ? filtered : tokens;
}

// -----------------------------------------------------------------------------
// TASK 16: Transliteration / Romanized Bengali Phonetic Search
// Maps romanized Bengali phrases to Bengali Unicode words
// e.g. "itihas" -> "ইতিহাস", "sahitya" -> "সাহিত্য", "bhugol" -> "ভূগোল"
// -----------------------------------------------------------------------------
export const ROMAN_TO_BENGALI_PHONETICS: Record<string, string[]> = {
  'itihas': ['ইতিহাস'],
  'history': ['ইতিহাস', 'itihas'],
  'sahitya': ['সাহিত্য'],
  'gonit': ['গণিত'],
  'ganit': ['গণিত'],
  'math': ['গণিত', 'অঙ্ক'],
  'bhugol': ['ভূগোল'],
  'vugol': ['ভূগোল'],
  'geography': ['ভূগোল'],
  'golpo': ['গল্প'],
  'upanyas': ['উপন্যাস'],
  'kobita': ['কবিতা'],
  'kabita': ['কবিতা'],
  'natok': ['নাটক'],
  'prabandha': ['প্রবন্ধ'],
  'rachana': ['রচনা'],
  'byakaran': ['ব্যাকরণ'],
  'bakaron': ['ব্যাকরণ'],
  'grammar': ['ব্যাকরণ'],
  'shiksha': ['শিক্ষা'],
  'sikkha': ['শিক্ষা'],
  'jibon': ['জীবন'],
  'jibvidya': ['জীববিদ্যা'],
  'biology': ['জীববিদ্যা'],
  'padartha': ['পদার্থবিদ্যা', 'পদার্থ'],
  'physics': ['পদার্থবিদ্যা'],
  'rasayan': ['রসায়ন'],
  'chemistry': ['রসায়ন'],
  'rasayon': ['রসায়ন'],
  'prasno': ['প্রশ্ন'],
  'prosno': ['প্রশ্ন'],
  'uttar': ['উত্তর'],
  'samaj': ['সমাজ', 'সমাজবিজ্ঞান'],
  'dharapat': ['ধারাপাত'],
  'barnaparichay': ['বর্ণপরিচয়'],
  'sahajpath': ['সহজ পাঠ'],
  'chora': ['ছড়া'],
};

export function transliterateRomanToBengali(term: string): string[] {
  const clean = sanitizeSearchText(term);
  const words = clean.split(' ');
  const transliteratedOptions = new Set<string>();

  // Direct phrase match
  if (ROMAN_TO_BENGALI_PHONETICS[clean]) {
    ROMAN_TO_BENGALI_PHONETICS[clean].forEach((w) => transliteratedOptions.add(w));
  }

  // Word-by-word transliteration for multi-word queries
  if (words.length > 1) {
    let replacedAny = false;
    const mappedWords = words.map((w) => {
      if (ROMAN_TO_BENGALI_PHONETICS[w]) {
        replacedAny = true;
        return ROMAN_TO_BENGALI_PHONETICS[w][0];
      }
      return w;
    });
    if (replacedAny) {
      transliteratedOptions.add(mappedWords.join(' '));
    }
  }

  return Array.from(transliteratedOptions);
}

// -----------------------------------------------------------------------------
// TASK 17: Soundex / Metaphone Author Name Resolution
// Handles phonetic variations in Bengali author surnames (English vs Bengali, archaic vs modern)
// e.g. "Maitra" / "Mitra" / "মৈত্র", "Banerjee" / "Bandyopadhyay" / "ব্যানার্জি"
// -----------------------------------------------------------------------------
export const AUTHOR_PHONETIC_FAMILIES: Record<string, string[]> = {
  'maitra': ['মৈত্র', 'মিত্র', 'maitra', 'mitra', 'moitra'],
  'mitra': ['মৈত্র', 'মিত্র', 'maitra', 'mitra', 'moitra'],
  'moitra': ['মৈত্র', 'মিত্র', 'maitra', 'mitra', 'moitra'],
  'মৈত্র': ['মৈত্র', 'মিত্র', 'maitra', 'mitra', 'moitra'],
  'মিত্র': ['মৈত্র', 'মিত্র', 'maitra', 'mitra', 'moitra'],

  'banerjee': ['ব্যানার্জি', 'বন্দ্যোপাধ্যায়', 'বন্দ্যোপাধ্যায়', 'banerjee', 'bandyopadhyay', 'bonnerjee'],
  'bandyopadhyay': ['ব্যানার্জি', 'বন্দ্যোপাধ্যায়', 'বন্দ্যোপাধ্যায়', 'banerjee', 'bandyopadhyay', 'bonnerjee'],
  'ব্যানার্জি': ['ব্যানার্জি', 'বন্দ্যোপাধ্যায়', 'বন্দ্যোপাধ্যায়', 'banerjee', 'bandyopadhyay'],
  'বন্দ্যোপাধ্যায়': ['ব্যানার্জি', 'বন্দ্যোপাধ্যায়', 'বন্দ্যোপাধ্যায়', 'banerjee', 'bandyopadhyay'],
  'বন্দ্যোপাধ্যায়': ['ব্যানার্জি', 'বন্দ্যোপাধ্যায়', 'বন্দ্যোপাধ্যায়', 'banerjee', 'bandyopadhyay'],

  'mukherjee': ['মুখার্জি', 'মুখোপাধ্যায়', 'মুখোপাধ্যায়', 'mukherjee', 'mukhopadhyay'],
  'mukhopadhyay': ['মুখার্জি', 'মুখোপাধ্যায়', 'মুখোপাধ্যায়', 'mukherjee', 'mukhopadhyay'],
  'মুখার্জি': ['মুখার্জি', 'মুখোপাধ্যায়', 'মুখোপাধ্যায়', 'mukherjee', 'mukhopadhyay'],
  'মুখোপাধ্যায়': ['মুখার্জি', 'মুখোপাধ্যায়', 'মুখোপাধ্যায়', 'mukherjee', 'mukhopadhyay'],
  'মুখোপাধ্যায়': ['মুখার্জি', 'মুখোপাধ্যায়', 'মুখোপাধ্যায়', 'mukherjee', 'mukhopadhyay'],

  'chatterjee': ['চ্যাটার্জি', 'চট্টোপাধ্যায়', 'চট্টোপাধ্যায়', 'chatterjee', 'chattopadhyay'],
  'chattopadhyay': ['চ্যাটার্জি', 'চট্টোপাধ্যায়', 'চট্টোপাধ্যায়', 'chatterjee', 'chattopadhyay'],
  'চ্যাটার্জি': ['চ্যাটার্জি', 'চট্টোপাধ্যায়', 'চট্টোপাধ্যায়', 'chatterjee', 'chattopadhyay'],
  'চট্টোপাধ্যায়': ['চ্যাটার্জি', 'চট্টোপাধ্যায়', 'চট্টোপাধ্যায়', 'chatterjee', 'chattopadhyay'],
  'চট্টোপাধ্যায়': ['চ্যাটার্জি', 'চট্টোপাধ্যায়', 'চট্টোপাধ্যায়', 'chatterjee', 'chattopadhyay'],

  'bhattacharya': ['ভট্টাচার্য', 'bhattacharya', 'bhattacharjee', 'bhattacharyya'],
  'bhattacharjee': ['ভট্টাচার্য', 'bhattacharya', 'bhattacharjee', 'bhattacharyya'],
  'ভট্টাচার্য': ['ভট্টাচার্য', 'bhattacharya', 'bhattacharjee'],

  'roy': ['রায়', 'রায়', 'roy', 'ray'],
  'ray': ['রায়', 'রায়', 'roy', 'ray'],
  'রায়': ['রায়', 'রায়', 'roy', 'ray'],
  'রায়': ['রায়', 'রায়', 'roy', 'ray'],

  'ghosh': ['ঘোষ', 'ghosh', 'ghose'],
  'ghose': ['ঘোষ', 'ghosh', 'ghose'],
  'ঘোষ': ['ঘোষ', 'ghosh', 'ghose'],

  'sen': ['সেন', 'sen', 'shen'],
  'সেন': ['সেন', 'sen', 'shen'],

  'dutta': ['দত্ত', 'dutta', 'datta'],
  'datta': ['দত্ত', 'dutta', 'datta'],
  'দত্ত': ['দত্ত', 'dutta', 'datta'],

  'chakraborty': ['চক্রবর্তী', 'chakraborty', 'chakravarty'],
  'chakravarty': ['চক্রবর্তী', 'chakraborty', 'chakravarty'],
  'চক্রবর্তী': ['চক্রবর্তী', 'chakraborty', 'chakravarty'],

  'das': ['দাস', 'দাশ', 'das', 'dash'],
  'dash': ['দাস', 'দাশ', 'das', 'dash'],
  'দাস': ['দাস', 'দাশ', 'das', 'dash'],
  'দাশ': ['দাস', 'দাশ', 'das', 'dash'],

  'bose': ['বোস', 'বসু', 'bose', 'basu'],
  'basu': ['বোস', 'বসু', 'bose', 'basu'],
  'বোস': ['বোস', 'বসু', 'bose', 'basu'],
  'বসু': ['বোস', 'বসু', 'bose', 'basu'],

  'ganguly': ['গাঙ্গুলি', 'গঙ্গোপাধ্যায়', 'ganguly', 'gangopadhyay'],
  'gangopadhyay': ['গাঙ্গুলি', 'গঙ্গোপাধ্যায়', 'ganguly', 'gangopadhyay'],
  'গাঙ্গুলি': ['গাঙ্গুলি', 'গঙ্গোপাধ্যায়', 'ganguly', 'gangopadhyay'],

  'majumdar': ['মজুমদার', 'majumdar', 'mojumdar'],
  'mojumdar': ['মজুমদার', 'majumdar', 'mojumdar'],
  'মজুমদার': ['মজুমদার', 'majumdar', 'mojumdar'],

  'sarkar': ['সরকার', 'sarkar', 'sircar'],
  'সরকার': ['সরকার', 'sarkar', 'sircar'],

  'pal': ['পাল', 'pal', 'paul'],
  'paul': ['পাল', 'pal', 'paul'],
  'পাল': ['পাল', 'pal', 'paul'],
};

export function resolveAuthorPhonetics(term: string): string[] {
  const clean = sanitizeSearchText(term);
  const tokens = clean.split(' ');
  const expanded = new Set<string>([clean]);

  for (const token of tokens) {
    if (AUTHOR_PHONETIC_FAMILIES[token]) {
      AUTHOR_PHONETIC_FAMILIES[token].forEach((variant) => {
        expanded.add(variant);
        if (tokens.length > 1) {
          expanded.add(clean.replace(token, variant));
        }
      });
    }
  }

  return Array.from(expanded);
}

// Algorithmic English Soundex encoder
export function soundex(str: string): string {
  if (!str) return '';
  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s.length) return '';

  const map: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6',
  };

  let code = s[0];
  let prev = map[s[0]] || '0';

  for (let i = 1; i < s.length && code.length < 4; i++) {
    const char = s[i];
    const curr = map[char] || '0';
    if (curr !== '0' && curr !== prev) {
      code += curr;
    }
    prev = curr;
  }

  return (code + '000').slice(0, 4);
}

// -----------------------------------------------------------------------------
// TASK 15: Synonyms Dictionary for Academic, Competitive & Literary Exams in Bengal
// -----------------------------------------------------------------------------
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // WBCS / Civil Services
  'wbcs': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস', 'civil services', 'psc'],
  'ডব্লুবিসিএস': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস'],
  'ডব্লিউবিসিএস': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস'],
  'civil service': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস'],
  'সিভিল সার্ভিস': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস'],

  // UGB / College
  'ugb': ['ugb', 'গৌড়বঙ্গ', 'গৌড়বঙ্গ', 'gour banga', 'college', 'কলেজ'],
  'গৌড়বঙ্গ': ['ugb', 'গৌড়বঙ্গ', 'গৌড়বঙ্গ', 'gour banga'],
  'গৌড়বঙ্গ': ['ugb', 'গৌড়বঙ্গ', 'গৌড়বঙ্গ', 'gour banga'],

  // TET / SLST
  'tet': ['tet', 'টেট', 'primary tet', 'প্রাথমিক টেট', 'slst', 'স্কুল সার্ভিস'],
  'টেট': ['tet', 'টেট', 'primary tet', 'প্রাথমিক টেট'],
  'primary tet': ['tet', 'টেট', 'primary tet', 'প্রাথমিক টেট'],
  'slst': ['slst', 'স্কুল সার্ভিস', 'school service'],
  'স্কুল সার্ভিস': ['slst', 'স্কুল সার্ভিস', 'school service'],

  // Subjects
  'itihas': ['itihas', 'ইতিহাস', 'history'],
  'ইতিহাস': ['itihas', 'ইতিহাস', 'history'],
  'history': ['itihas', 'ইতিহাস', 'history'],
  'bhugol': ['bhugol', 'ভূগোল', 'geography'],
  'ভূগোল': ['bhugol', 'ভূগোল', 'geography'],

  // Police & Railway
  'police': ['police', 'পুলিশ', 'wb police', 'constable', 'কনস্টেবল', 'si'],
  'পুলিশ': ['police', 'পুলিশ', 'wb police', 'constable', 'কনস্টেবল'],
  'railway': ['railway', 'রেল', 'রেলওয়ে', 'rrb', 'ntpc'],
  'রেল': ['railway', 'রেল', 'রেলওয়ে', 'rrb', 'ntpc'],
  'রেলওয়ে': ['railway', 'রেল', 'রেলওয়ে', 'rrb', 'ntpc'],

  // Authors & Classics
  'byomkesh': ['byomkesh', 'ব্যোমকেশ', 'saradindu', 'শরদিন্দু'],
  'ব্যোমকেশ': ['byomkesh', 'ব্যোমকেশ', 'saradindu', 'শরদিন্দু'],
  'rabindranath': ['rabindranath', 'রবীন্দ্রনাথ', 'tagore', 'ঠাকুর', 'sanchayita', 'সঞ্চয়িতা'],
  'রবীন্দ্রনাথ': ['rabindranath', 'রবীন্দ্রনাথ', 'tagore', 'ঠাকুর', 'sanchayita', 'সঞ্চয়িতা'],
};

export function expandSynonyms(term: string): string[] {
  const sanitized = sanitizeSearchText(term);
  const matched = new Set<string>([sanitized]);

  for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    const sanitizedKey = sanitizeSearchText(key);
    if (sanitized === sanitizedKey || sanitized.includes(sanitizedKey)) {
      synonyms.forEach((s) => matched.add(sanitizeSearchText(s)));
    }
  }

  return Array.from(matched);
}

// -----------------------------------------------------------------------------
// TASK 13: Levenshtein Distance Algorithm (1-2 char typo tolerance)
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// TASK 11 & 12: Trigram Generation & Similarity
// -----------------------------------------------------------------------------
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
  if (cleanT.includes(cleanQ)) return 1.0;

  const words = cleanT.split(' ');
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

// -----------------------------------------------------------------------------
// TASK 19: Multi-Word '&' Boolean Full-Text Matcher & Prefix Scanning
// Ensures every word in query exists in candidate text (regardless of word order)
// e.g. "মৈত্র ইতিহাস" matches "ইতিহাস অমিতাভ মৈত্র"
// -----------------------------------------------------------------------------
export function matchMultiWordTokens(queryTokens: string[], candidateText: string): boolean {
  if (!queryTokens.length || !candidateText) return false;
  const targetWords = candidateText.toLowerCase().split(' ');

  return queryTokens.every((qToken) => {
    // Exact or prefix or substring match
    return targetWords.some((tWord) => tWord.startsWith(qToken) || tWord.includes(qToken));
  });
}

// -----------------------------------------------------------------------------
// TASK 20: Weighted Multi-Column Search Vector Matcher
// - Weight A (1.0): Book Title (title & titleBn)
// - Weight B (0.7): Author Name (author & authorBn)
// - Weight C (0.4): Publisher, Category & Keywords
// -----------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // 1. WEIGHT A: TITLE MATCHING (Exact, Prefix, Substring, Transliteration)
  // ---------------------------------------------------------------------------
  if (titleClean.startsWith(cleanQuery) || titleBnClean.startsWith(cleanQuery)) {
    weightAScore = 100;
    matchType = 'prefix';
  } else if (titleClean.includes(cleanQuery) || titleBnClean.includes(cleanQuery)) {
    weightAScore = 85;
    matchType = 'exact';
  } else {
    // Check romanized transliterations (e.g. "itihas" -> "ইতিহাস")
    for (const trans of transliterations) {
      if (titleClean.includes(trans) || titleBnClean.includes(trans)) {
        weightAScore = Math.max(weightAScore, 80);
        matchType = 'phonetic';
        break;
      }
    }

    // Check synonyms (e.g. "wbcs" -> "ডব্লুবিসিএস")
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

  // Multi-word boolean AND check on title (Task 19)
  if (meaningfulTokens.length > 1) {
    const combinedTitle = `${titleClean} ${titleBnClean}`;
    if (matchMultiWordTokens(meaningfulTokens, combinedTitle)) {
      weightAScore = Math.max(weightAScore, 70);
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

  // ---------------------------------------------------------------------------
  // 2. WEIGHT B: AUTHOR MATCHING (Exact, Phonetics, Soundex)
  // ---------------------------------------------------------------------------
  if (authorClean.startsWith(cleanQuery) || authorBnClean.startsWith(cleanQuery)) {
    weightBScore = 70;
    if (weightAScore === 0) matchType = 'prefix';
  } else if (authorClean.includes(cleanQuery) || authorBnClean.includes(cleanQuery)) {
    weightBScore = 60;
    if (weightAScore === 0) matchType = 'exact';
  } else {
    // Author phonetic family match (e.g. "mitra" -> "মৈত্র")
    for (const aVariant of authorPhonetics) {
      if (authorClean.includes(aVariant) || authorBnClean.includes(aVariant)) {
        weightBScore = Math.max(weightBScore, 55);
        if (weightAScore === 0) matchType = 'phonetic';
        break;
      }
    }

    // Author Soundex comparison for English names
    if (weightBScore === 0 && cleanQuery.length >= 3 && authorClean.length >= 3) {
      const qSoundex = soundex(cleanQuery);
      const aWords = authorClean.split(' ');
      if (aWords.some((aw) => soundex(aw) === qSoundex)) {
        weightBScore = 40;
        if (weightAScore === 0) matchType = 'phonetic';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. WEIGHT C: PUBLISHER, CATEGORY & METADATA
  // ---------------------------------------------------------------------------
  if (publisherClean.includes(cleanQuery)) {
    weightCScore = 40;
    if (weightAScore === 0 && weightBScore === 0) matchType = 'exact';
  } else if (categoryClean.includes(cleanQuery)) {
    weightCScore = 30;
    if (weightAScore === 0 && weightBScore === 0) matchType = 'exact';
  }

  // ---------------------------------------------------------------------------
  // 4. LEVENSHTEIN TYPO TOLERANCE FALLBACK (Task 13)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // 5. COMBINED WEIGHTED SCORE CALCULATION (Task 20)
  // Score = (Weight A * 1.0) + (Weight B * 0.7) + (Weight C * 0.4) + Stock bonus
  // ---------------------------------------------------------------------------
  let totalScore = weightAScore * 1.0 + weightBScore * 0.7 + weightCScore * 0.4;

  if (totalScore <= 0) return null;

  // In-stock priority bonus (+15) and out-of-stock demotion (-25)
  if (book.inStock) {
    totalScore += 15;
  } else {
    totalScore -= 25;
  }

  return {
    book,
    score: Math.round(totalScore),
    matchType,
  };
}
