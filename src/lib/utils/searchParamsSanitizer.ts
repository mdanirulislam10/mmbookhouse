/**
 * Search Parameters Sanitizer & Schema Validator
 * Module 6: Faceted Filter & Sorting Engine (Tasks 36, 37, 40)
 *
 * Provides defensive input sanitization, type validation, canonical serialization,
 * and deterministic state hydration for URL query strings.
 */

import { FilterState, SortOption, ViewMode } from '@/types/catalog-filter';
import {
  SearchQuerySchema,
  parseSearchParams as parseZodSearchParams,
  ValidatedSearchParams,
} from '@/lib/validations/searchParams';

export { SearchQuerySchema, type ValidatedSearchParams };

export const VALID_CATEGORIES = [
  'all',
  'wbcs-special',
  'college-university',
  'primary-tet-slst',
  'competitive-exams',
  'bengali-literature',
  'school-madhyamik-hs',
] as const;

export const VALID_FORMATS = ['paperback', 'hardcover', 'bundle'] as const;
export const VALID_CONDITIONS = ['new', 'used'] as const;
export const VALID_LANGUAGES = ['bengali', 'english', 'bilingual', 'hindi'] as const;

export const VALID_SORTS: readonly SortOption[] = [
  'relevance',
  'price-asc',
  'price-desc',
  'rating',
  'newest',
  'bestselling',
];

export const VALID_VIEWS: readonly ViewMode[] = ['grid', 'list'];
export const VALID_DISCOUNTS = [10, 25, 35, 50] as const;
export const VALID_PAGE_SIZES = [12, 24, 48] as const;

/**
 * Strips HTML tags, malicious control characters, and limits string length.
 */
export function sanitizeString(val: string | null | undefined, maxLen = 150): string {
  if (!val) return '';
  // Strip HTML tags & control characters
  return val
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Validates and parses a safe numeric value within min/max bounds.
 */
export function sanitizeNumber(
  val: string | null | undefined,
  min = 0,
  max = 100000
): number | undefined {
  if (!val) return undefined;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return undefined;
  return Math.max(min, Math.min(max, Math.round(num)));
}

/**
 * Sanitizes comma-separated array strings into clean, deduplicated string arrays.
 */
export function sanitizeArray(
  val: string | null | undefined,
  allowedValues?: readonly string[],
  maxItems = 25
): string[] {
  if (!val) return [];
  const parts = val
    .split(',')
    .map((item) => sanitizeString(item, 80))
    .filter(Boolean);

  const unique = Array.from(new Set(parts));

  if (allowedValues && allowedValues.length > 0) {
    return unique.filter((item) => allowedValues.includes(item)).slice(0, maxItems);
  }

  return unique.slice(0, maxItems);
}

export interface ParsedSearchState {
  filterState: FilterState;
  sortBy: SortOption;
  viewMode: ViewMode;
  queryParam: string;
  page: number;
  pageSize: number;
}

/**
 * Safely parses and sanitizes all query parameters from URL search params.
 * Prevents invalid inputs, XSS strings, or broken states on hard refresh.
 */
export function parseAndSanitizeSearchParams(
  searchParams: { get: (key: string) => string | null } | URLSearchParams
): ParsedSearchState {
  // 1. Zod Schema Defensive Validation (Task 37)
  const zodUrlParams =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams();

  if (!(searchParams instanceof URLSearchParams)) {
    // Populate keys for Zod parser
    ['q', 'query', 'category', 'subCategory', 'authors', 'publishers', 'formats', 'conditions', 'languages', 'rating', 'minPrice', 'maxPrice', 'discount', 'sort', 'view', 'page'].forEach(
      (key) => {
        const v = searchParams.get(key);
        if (v !== null) zodUrlParams.set(key, v);
      }
    );
  }

  const zodValidated = parseZodSearchParams(zodUrlParams);

  // 2. String sanitization & XSS guard (Task 37)
  const rawQ = searchParams.get('q') || searchParams.get('query') || zodValidated.q;
  const queryParam = sanitizeString(rawQ, 100);

  const rawCat = searchParams.get('category') || zodValidated.category;
  const sanitizedCat = sanitizeString(rawCat, 50);
  const category = (VALID_CATEGORIES as readonly string[]).includes(sanitizedCat)
    ? sanitizedCat
    : 'all';

  const rawSubCat = searchParams.get('subCategory') || zodValidated.subCategory;
  const subCategory = rawSubCat ? sanitizeString(rawSubCat, 60) || undefined : undefined;

  const authors = sanitizeArray(searchParams.get('authors') || (zodValidated.authors.length ? zodValidated.authors.join(',') : undefined));
  const publishers = sanitizeArray(searchParams.get('publishers') || (zodValidated.publishers.length ? zodValidated.publishers.join(',') : undefined));
  const formats = sanitizeArray(searchParams.get('formats') || (zodValidated.formats.length ? zodValidated.formats.join(',') : undefined), VALID_FORMATS);
  const conditions = sanitizeArray(searchParams.get('conditions') || (zodValidated.conditions.length ? zodValidated.conditions.join(',') : undefined), VALID_CONDITIONS);
  const languages = sanitizeArray(searchParams.get('languages') || (zodValidated.languages.length ? zodValidated.languages.join(',') : undefined), VALID_LANGUAGES);

  const rawRating = searchParams.get('rating');
  const parsedRating = sanitizeNumber(rawRating !== null ? rawRating : String(zodValidated.minRating), 0, 5);
  const minRating = parsedRating !== undefined ? parsedRating : 0;

  let minPrice = sanitizeNumber(searchParams.get('minPrice') || (zodValidated.minPrice !== undefined ? String(zodValidated.minPrice) : undefined), 0, 50000);
  let maxPrice = sanitizeNumber(searchParams.get('maxPrice') || (zodValidated.maxPrice !== undefined ? String(zodValidated.maxPrice) : undefined), 0, 50000);

  // If minPrice > maxPrice, normalize by swapping
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    const temp = minPrice;
    minPrice = maxPrice;
    maxPrice = temp;
  }

  const rawDiscount = searchParams.get('discount');
  const parsedDiscount = sanitizeNumber(rawDiscount !== null ? rawDiscount : (zodValidated.discountRange !== undefined ? String(zodValidated.discountRange) : undefined), 0, 100);
  const discountRange =
    parsedDiscount !== undefined &&
    (VALID_DISCOUNTS as readonly number[]).includes(parsedDiscount)
      ? parsedDiscount
      : undefined;

  const rawSort = (searchParams.get('sort') || zodValidated.sort) as SortOption | null;
  const sortBy: SortOption =
    rawSort && (VALID_SORTS as readonly string[]).includes(rawSort)
      ? rawSort
      : 'relevance';

  const rawView = (searchParams.get('view') || zodValidated.view) as ViewMode | null;
  const viewMode: ViewMode =
    rawView && (VALID_VIEWS as readonly string[]).includes(rawView)
      ? rawView
      : 'grid';

  const rawPage = searchParams.get('page');
  const parsedPage = sanitizeNumber(rawPage !== null ? rawPage : String(zodValidated.page), 1, 1000);
  const page = parsedPage !== undefined ? parsedPage : 1;

  const rawPageSize = searchParams.get('pageSize') || searchParams.get('limit');
  const parsedPageSize = sanitizeNumber(rawPageSize, 1, 100);
  const pageSize =
    parsedPageSize !== undefined && (VALID_PAGE_SIZES as readonly number[]).includes(parsedPageSize)
      ? parsedPageSize
      : 24;

  return {
    filterState: {
      category,
      subCategory,
      authors,
      publishers,
      formats,
      conditions,
      languages,
      minRating,
      minPrice,
      maxPrice,
      discountRange,
      page,
    },
    sortBy,
    viewMode,
    queryParam,
    page,
    pageSize,
  };
}

/**
 * Deterministically serializes FilterState, SortOption, and ViewMode to a canonical URL query string.
 * Omits default parameters to ensure clean, shareable URLs.
 */
export function serializeFilterParams(
  filterState: FilterState,
  sortBy: SortOption,
  viewMode: ViewMode,
  queryParam?: string,
  page?: number,
  pageSize?: number
): string {
  const params = new URLSearchParams();

  // 1. Keyword search query
  if (queryParam && queryParam.trim()) {
    params.set('q', queryParam.trim());
  }

  // 2. Category & Subcategory
  if (filterState.category && filterState.category !== 'all') {
    params.set('category', filterState.category);
  }
  if (filterState.subCategory) {
    params.set('subCategory', filterState.subCategory);
  }

  // 3. Multi-select facets (sorted for deterministic canonical URLs)
  if (filterState.authors.length > 0) {
    params.set('authors', [...filterState.authors].sort().join(','));
  }
  if (filterState.publishers.length > 0) {
    params.set('publishers', [...filterState.publishers].sort().join(','));
  }
  if (filterState.formats.length > 0) {
    params.set('formats', [...filterState.formats].sort().join(','));
  }
  if (filterState.conditions.length > 0) {
    params.set('conditions', [...filterState.conditions].sort().join(','));
  }
  if (filterState.languages.length > 0) {
    params.set('languages', [...filterState.languages].sort().join(','));
  }

  // 4. Rating
  if (filterState.minRating > 0) {
    params.set('rating', String(filterState.minRating));
  }

  // 5. Price range
  if (filterState.minPrice !== undefined) {
    params.set('minPrice', String(filterState.minPrice));
  }
  if (filterState.maxPrice !== undefined) {
    params.set('maxPrice', String(filterState.maxPrice));
  }

  // 6. Discount range
  if (filterState.discountRange !== undefined) {
    params.set('discount', String(filterState.discountRange));
  }

  // 7. Sort option (omit if default 'relevance')
  if (sortBy !== 'relevance') {
    params.set('sort', sortBy);
  }

  // 8. View mode (omit if default 'grid')
  if (viewMode !== 'grid') {
    params.set('view', viewMode);
  }

  // 9. Pagination (omit if page is 1)
  const targetPage = page !== undefined ? page : filterState.page;
  if (targetPage && targetPage > 1) {
    params.set('page', String(targetPage));
  }

  // 10. Items per page (omit if default 24)
  if (pageSize && pageSize !== 24 && (VALID_PAGE_SIZES as readonly number[]).includes(pageSize)) {
    params.set('pageSize', String(pageSize));
  }

  return params.toString();
}
