/**
 * Module 5: Search Utilities - Phonetics, Transliteration & Soundex
 *
 * - Task 16: Transliteration / Romanized Bengali Phonetic Search
 * - Task 17: Soundex / Metaphone Author Name Resolution
 */

import { sanitizeSearchText } from './synonyms';

// TASK 16: Transliteration / Romanized Bengali Phonetic Search
// TASK 16: Transliteration / Romanized Bengali Phonetic Search
export const ROMAN_TO_BENGALI_PHONETICS: Record<string, string[]> = {
  'itihas': ['ইতিহাস'],
  'itihash': ['ইতিহাস'],
  'history': ['ইতিহাস', 'itihas'],
  'sahitya': ['সাহিত্য'],
  'sahitto': ['সাহিত্য'],
  'gonit': ['গণিত'],
  'ganit': ['গণিত'],
  'onko': ['অঙ্ক', 'গণিত'],
  'anka': ['অঙ্ক'],
  'math': ['গণিত', 'অঙ্ক'],
  'bhugol': ['ভূগোল'],
  'vugol': ['ভূগোল'],
  'bhugul': ['ভূগোল'],
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
  'somaj': ['সমাজ'],
  'dharapat': ['ধারাপাত'],
  'barnaparichay': ['বর্ণপরিচয়'],
  'sahajpath': ['সহজ পাঠ'],
  'chora': ['ছড়া'],
  'bharat': ['ভারত', 'ভারতের'],
  'swadesh': ['স্বদেশ'],
  'poribesh': ['পরিবেশ', 'পরিবেশবিদ্যা'],
  'pariksha': ['পরীক্ষা'],
  'porikkha': ['পরীক্ষা'],
  'sahayika': ['সহায়িকা', 'সহায়িকা'],
  'sonkolon': ['সংকলন'],
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

// TASK 17: Soundex / Metaphone Author Name Resolution
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
