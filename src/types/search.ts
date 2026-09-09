export interface SearchCategory {
  id: string;
  name: string;
  nameBn: string;
  description?: string;
}

// Slugs are synchronized 100% with Module 1 Supabase database schema (01_core_catalog_seed.sql)
export const SEARCH_CATEGORIES: SearchCategory[] = [
  { id: 'all', name: 'All Departments', nameBn: 'সকল বিভাগ' },
  { id: 'wbcs-special', name: 'WBCS Special', nameBn: 'WBCS ও সিভিল সার্ভিস' },
  { id: 'college-university', name: 'College & University Textbooks', nameBn: 'কলেজ ও বিশ্ববিদ্যালয়' },
  { id: 'primary-tet-slst', name: 'Primary TET & School Service', nameBn: 'টেট ও স্কুল সার্ভিস' },
  { id: 'competitive-exams', name: 'All Competitive Examinations', nameBn: 'সরকারি চাকরির পরীক্ষা' },
  { id: 'bengali-literature', name: 'Bengali Literature & Fiction', nameBn: 'বাংলা সাহিত্য ও উপন্যাস' },
];

export interface SearchState {
  query: string;
  selectedCategory: string;
  isFocused: boolean;
}

/**
 * Module 5 Type Definitions: Live Search & Typeahead Engine
 */

export interface LiveSearchResultItem {
  id: string;
  bookId: string;
  slug: string;
  title: string;
  titleBn: string;
  author: string;
  authorBn: string;
  publisher: string;
  category: string;
  categoryName: string;
  price: number;
  mrp: number;
  discount: string;
  discountPercent: number;
  inStock: boolean;
  edition?: string;
  rating?: number;
  coverImage?: string;
  matchType?: 'exact' | 'prefix' | 'trigram' | 'synonym' | 'phonetic';
}

export interface LiveSearchCategoryMatch {
  id: string;
  name: string;
  nameBn: string;
  count: number;
}

export interface LiveSearchResponse {
  query: string;
  books: LiveSearchResultItem[];
  keywords: string[];
  categories: LiveSearchCategoryMatch[];
  didYouMean?: string | null;
  totalCount: number;
  executionTimeMs: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  category?: string;
  timestamp: number;
}

export interface TrendingSearchItem {
  id: string;
  query: string;
  queryBn: string;
  category?: string;
  badge?: string;
  isHot?: boolean;
}
