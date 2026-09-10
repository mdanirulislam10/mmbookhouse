import { z } from 'zod';
import { SortOption, ViewMode } from '@/types/catalog-filter';

/**
 * Zod Schema for URL Search Parameters (Task 37)
 * Sanitizes malicious inputs, validates numerical constraints, and handles aliases.
 */
export const SearchQuerySchema = z.object({
  // Text search query: aliases 'query' to 'q'
  q: z.string().default(''),
  category: z.string().default('all'),
  subCategory: z.string().optional(),
  authors: z.array(z.string()).default([]),
  publishers: z.array(z.string()).default([]),
  formats: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  minRating: z.number().min(0).max(5).default(0),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  discountRange: z.number().min(0).max(100).optional(),
  sort: z.enum(['relevance', 'price-asc', 'price-desc', 'rating', 'newest', 'bestselling']).default('relevance'),
  view: z.enum(['grid', 'list']).default('grid'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(24),
});

export type ValidatedSearchParams = z.infer<typeof SearchQuerySchema>;

/**
 * Safely parse search parameters from URLSearchParams or query objects.
 * Handles comma-separated values, invalid numbers, and malicious script inputs.
 */
export function parseSearchParams(
  searchParams: URLSearchParams | { [key: string]: string | string[] | undefined }
): ValidatedSearchParams {
  const getVal = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined;
    }
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  // Support both 'q' and 'query' parameters seamlessly (Task 31 & 37)
  const rawQ = (getVal('q') || getVal('query') || '').trim();

  // Helper to parse comma-delimited strings safely
  const parseList = (key: string): string[] => {
    const val = getVal(key);
    if (!val) return [];
    return val
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 100);
  };

  // Helper to parse numbers safely
  const parseNum = (key: string): number | undefined => {
    const val = getVal(key);
    if (!val) return undefined;
    const n = Number(val);
    return isNaN(n) || n < 0 ? undefined : n;
  };

  const rawMinPrice = parseNum('minPrice');
  const rawMaxPrice = parseNum('maxPrice');

  // Ensure minPrice <= maxPrice if both exist
  let safeMinPrice = rawMinPrice;
  let safeMaxPrice = rawMaxPrice;
  if (safeMinPrice !== undefined && safeMaxPrice !== undefined && safeMinPrice > safeMaxPrice) {
    // Swap if inverted
    const temp = safeMinPrice;
    safeMinPrice = safeMaxPrice;
    safeMaxPrice = temp;
  }

  const rawSort = getVal('sort');
  const validSorts: SortOption[] = ['relevance', 'price-asc', 'price-desc', 'rating', 'newest', 'bestselling'];
  const safeSort: SortOption = validSorts.includes(rawSort as SortOption) ? (rawSort as SortOption) : 'relevance';

  const rawView = getVal('view');
  const safeView: ViewMode = rawView === 'list' ? 'list' : 'grid';

  const rawPage = parseNum('page');
  const safePage = rawPage && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const rawRating = parseNum('rating');
  const safeRating = rawRating ? Math.min(5, Math.max(0, rawRating)) : 0;

  const rawDiscount = parseNum('discount');
  const safeDiscount = rawDiscount ? Math.min(100, Math.max(0, rawDiscount)) : undefined;

  const rawObj = {
    q: rawQ,
    category: getVal('category') || 'all',
    subCategory: getVal('subCategory') || undefined,
    authors: parseList('authors'),
    publishers: parseList('publishers'),
    formats: parseList('formats'),
    conditions: parseList('conditions'),
    languages: parseList('languages'),
    minRating: safeRating,
    minPrice: safeMinPrice,
    maxPrice: safeMaxPrice,
    discountRange: safeDiscount,
    sort: safeSort,
    view: safeView,
    page: safePage,
    limit: 24,
  };

  const result = SearchQuerySchema.safeParse(rawObj);
  if (result.success) {
    return result.data;
  }

  // Fallback defaults
  return {
    q: '',
    category: 'all',
    subCategory: undefined,
    authors: [],
    publishers: [],
    formats: [],
    conditions: [],
    languages: [],
    minRating: 0,
    minPrice: undefined,
    maxPrice: undefined,
    discountRange: undefined,
    sort: 'relevance',
    view: 'grid',
    page: 1,
    limit: 24,
  };
}
