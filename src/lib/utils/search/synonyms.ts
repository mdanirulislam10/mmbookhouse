/**
 * Module 5: Search Utilities - Synonyms, Stopwords & Sanitization
 *
 * - Task 14: Regex punctuation & special character sanitizer
 * - Task 15: Bengali normalized synonym dictionary & keywords mapping
 * - Task 18: Bengali & English Stopwords Filtering
 */

// TASK 14: Regex Sanitizer for punctuation and special symbols
export function sanitizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Strip acronym dots (e.g. w.b.c.s -> wbcs, m.m -> mm, ড. -> ড)
    .replace(/(?<=\b[a-z\u0980-\u09ff])\.(?=[a-z\u0980-\u09ff]\b|\s|$)/gi, '')
    // Remove isolated dots
    .replace(/\./g, '')
    // Replace word separators (hyphens, slashes, commas, colons, underscores, brackets) with space
    .replace(/[\-\_\,\:\;\'\"\/\\(\)\[\]{}|+=]/g, ' ')
    // Normalize multiple whitespaces
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeQueryForSecurity(raw: string): string {
  if (!raw) return '';

  return (
    raw
      // Limit to 100 characters to prevent ReDoS and memory abuse
      .slice(0, 100)
      // Strip null bytes and control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Strip HTML tags (<script>, <iframe>, <style>, etc.)
      .replace(/<[^>]*>/g, '')
      // Strip javascript: / data: pseudo-protocols
      .replace(/(javascript|data|vbscript):/gi, '')
      // Strip dangerous SQL injection delimiters (comments, semicolons, quotes)
      .replace(/(--|\/\*|\*\/|;)/g, ' ')
      .replace(/['"`]/g, '')
      // Strip dangerous SQL injection commands (UNION SELECT, DROP TABLE, etc.) while preserving legitimate words
      .replace(/\b(UNION\s+(ALL\s+)?SELECT|DROP\s+(TABLE|DATABASE|SCHEMA)|INSERT\s+INTO|DELETE\s+FROM|EXEC\s*\(|XP_)\b/gi, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// TASK 18: Bengali & English Stopwords Filtering
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
  return filtered.length > 0 ? filtered : tokens;
}

// TASK 15: Synonyms Dictionary for Academic, Competitive & Literary Exams in Bengal
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // WBCS / Civil Services
  'wbcs': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস', 'civil services', 'psc', 'wbpsc', 'প্রিলিমস', 'মেইনস'],
  'ডব্লুবিসিএস': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস', 'civil services', 'wbpsc'],
  'ডব্লিউবিসিএস': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস', 'civil services', 'wbpsc'],
  'civil service': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস'],
  'সিভিল সার্ভিস': ['wbcs', 'ডব্লুবিসিএস', 'ডব্লিউবিসিএস', 'সিভিল সার্ভিস'],
  'psc': ['wbcs', 'psc', 'wbpsc', 'পাবলিক সার্ভিস'],

  // UGB / College & University
  'ugb': ['ugb', 'গৌড়বঙ্গ', 'গৌড়বঙ্গ', 'gour banga', 'college', 'কলেজ', 'university', 'বিশ্ববিদ্যালয়', 'সেমিস্টার'],
  'গৌড়বঙ্গ': ['ugb', 'গৌড়বঙ্গ', 'গৌড়বঙ্গ', 'gour banga', 'college', 'কলেজ'],
  'গৌড়বঙ্গ': ['ugb', 'গৌড়বঙ্গ', 'গৌড়বঙ্গ', 'gour banga', 'college', 'কলেজ'],
  'college': ['ugb', 'college', 'কলেজ', 'university', 'সেমিস্টার'],
  'semester': ['semester', 'সেমিস্টার', 'sem', 'ugb', 'পাস', 'অনার্স'],
  'সেমিস্টার': ['semester', 'সেমিস্টার', 'sem', 'ugb'],

  // TET / Primary / School Service
  'tet': ['tet', 'টেট', 'primary tet', 'প্রাথমিক টেট', 'slst', 'স্কুল সার্ভিস', 'd el ed', 'ডিএলএড'],
  'টেট': ['tet', 'টেট', 'primary tet', 'প্রাথমিক টেট', 'slst', 'স্কুল সার্ভিস'],
  'primary tet': ['tet', 'টেট', 'primary tet', 'প্রাথমিক টেট'],
  'প্রাথমিক টেট': ['tet', 'টেট', 'primary tet', 'প্রাথমিক টেট'],
  'slst': ['slst', 'স্কুল সার্ভিস', 'school service', 'ssc', 'মাদ্রাসা সার্ভিস'],
  'স্কুল সার্ভিস': ['slst', 'স্কুল সার্ভিস', 'school service', 'ssc'],
  'b ed': ['b ed', 'বিএড', 'ডিএলএড', 'd el ed', 'shiksha'],
  'd el ed': ['d el ed', 'ডিএলএড', 'b ed', 'বিএড', 'shiksha'],

  // Police & Defence
  'police': ['police', 'পুলিশ', 'wb police', 'constable', 'কনস্টেবল', 'si', 'কলকাতা পুলিশ', 'kp'],
  'পুলিশ': ['police', 'পুলিশ', 'wb police', 'constable', 'কনস্টেবল', 'si'],
  'constable': ['police', 'constable', 'কনস্টেবল', 'লেডি কনস্টেবল'],
  'কনস্টেবল': ['police', 'constable', 'কনস্টেবল', 'লেডি কনস্টেবল'],
  'kp': ['kp', 'kolkata police', 'কলকাতা পুলিশ'],

  // Railway / RRB
  'railway': ['railway', 'রেল', 'রেলওয়ে', 'rrb', 'ntpc', 'group d', 'গ্রুপ ডি', 'alp'],
  'রেল': ['railway', 'রেল', 'রেলওয়ে', 'rrb', 'ntpc', 'গ্রুপ ডি'],
  'রেলওয়ে': ['railway', 'রেল', 'রেলওয়ে', 'rrb', 'ntpc', 'গ্রুপ ডি'],
  'rrb': ['railway', 'রেল', 'rrb', 'ntpc', 'group d'],

  // Food SI & Clerkship
  'food si': ['food si', 'ফুড এসআই', 'food supply', 'psc clerkship'],
  'ফুড এসআই': ['food si', 'ফুড এসআই', 'food supply', 'psc'],
  'clerkship': ['clerkship', 'ক্লার্কশিপ', 'psc clerkship', 'মিসলেনিয়াস'],
  'ক্লার্কশিপ': ['clerkship', 'ক্লার্কশিপ', 'psc clerkship'],
  'nursing': ['nursing', 'নার্সিং', 'anm gnm', 'এএনএম জিএনএম', 'jenpas'],
  'নার্সিং': ['nursing', 'নার্সিং', 'anm gnm', 'এএনএম জিএনএম'],

  // Academic Subjects
  'itihas': ['itihas', 'ইতিহাস', 'history', 'ঐতিহাসিক'],
  'ইতিহাস': ['itihas', 'ইতিহাস', 'history', 'ঐতিহাসিক'],
  'history': ['itihas', 'ইতিহাস', 'history', 'ঐতিহাসিক'],
  'bhugol': ['bhugol', 'ভূগোল', 'geography', 'পশ্চিমবঙ্গ ভূগোল'],
  'ভূগোল': ['bhugol', 'ভূগোল', 'geography', 'পশ্চিমবঙ্গ ভূগোল'],
  'geography': ['bhugol', 'ভূগোল', 'geography'],
  'gonit': ['gonit', 'গণিত', 'math', 'অঙ্ক', 'পাটিগণিত', 'বীজগণিত'],
  'গণিত': ['gonit', 'গণিত', 'math', 'অঙ্ক', 'mathematics'],
  'math': ['gonit', 'গণিত', 'math', 'অঙ্ক', 'mathematics'],
  'অঙ্ক': ['gonit', 'গণিত', 'math', 'অঙ্ক', 'mathematics'],
  'sahitya': ['sahitya', 'সাহিত্য', 'বাংলা সাহিত্য', 'উপন্যাস', 'গল্প'],
  'সাহিত্য': ['sahitya', 'সাহিত্য', 'বাংলা সাহিত্য', 'উপন্যাস', 'গল্প'],
  'byakaran': ['byakaran', 'ব্যাকরণ', 'grammar', 'বাংলা ব্যাকরণ'],
  'ব্যাকরণ': ['byakaran', 'ব্যাকরণ', 'grammar'],
  'english': ['english', 'ইংরেজি', 'grammar', 'vocabulary'],
  'বিজ্ঞান': ['বিজ্ঞান', 'science', 'পদার্থবিদ্যা', 'রসায়ন', 'জীববিদ্যা'],
  'science': ['বিজ্ঞান', 'science', 'physics', 'chemistry', 'biology'],
  'পরিবেশ': ['পরিবেশ', 'পরিবেশবিদ্যা', 'evs', 'environment'],
  'evs': ['পরিবেশ', 'পরিবেশবিদ্যা', 'evs', 'environment'],
  'সংবিধান': ['সংবিধান', 'polity', 'constitution', 'রাষ্ট্রবিজ্ঞান'],
  'polity': ['সংবিধান', 'polity', 'constitution', 'রাষ্ট্রবিজ্ঞান'],

  // Authors & Classics
  'byomkesh': ['byomkesh', 'ব্যোমকেশ', 'saradindu', 'শরদিন্দু'],
  'ব্যোমকেশ': ['byomkesh', 'ব্যোমকেশ', 'saradindu', 'শরদিন্দু'],
  'rabindranath': ['rabindranath', 'রবীন্দ্রনাথ', 'tagore', 'ঠাকুর', 'sanchayita', 'সঞ্চয়িতা', 'গল্পগুচ্ছ'],
  'রবীন্দ্রনাথ': ['rabindranath', 'রবীন্দ্রনাথ', 'tagore', 'ঠাকুর', 'sanchayita', 'সঞ্চয়িতা', 'গল্পগুচ্ছ'],
  'feluda': ['feluda', 'ফেলুদা', 'satyajit', 'সত্যজিৎ রায়'],
  'ফেলুদা': ['feluda', 'ফেলুদা', 'satyajit', 'সত্যজিৎ রায়'],
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
