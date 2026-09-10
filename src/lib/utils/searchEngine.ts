/**
 * Module 5: Advanced Live Search & Typo-Tolerant Typeahead Search Engine
 *
 * Facade entry point re-exporting modularized search subsystems:
 * - Synonyms, Stopwords & Sanitization (./search/synonyms)
 * - Phonetics, Transliteration & Soundex (./search/phonetics)
 * - Trigram, Levenshtein, Boolean Matching & Scoring (./search/scoring)
 */

export * from './search/synonyms';
export * from './search/phonetics';
export * from './search/scoring';
export * from './search/rateLimiter';
export * from './search/searchCache';
export * from './search/zeroResultLogger';
export * from './search/telemetry';
export * from './search/offlineSearch';
