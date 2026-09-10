'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package,
  PhoneCall,
  RotateCcw,
  Sparkles,
  HelpCircle,
  X,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';
import {
  BookProduct,
  FilterState,
  FacetGroup,
  HierarchyCategoryNode,
  ViewMode,
  SortOption,
} from '@/types/catalog-filter';
import { SearchResultsLayout } from '@/components/search/SearchResultsLayout';
import { DesktopFacetSidebar } from '@/components/search/DesktopFacetSidebar';
import { MobileSortFilterBar } from '@/components/search/MobileSortFilterBar';
import { MobileDualPaneDrawer } from '@/components/search/MobileDualPaneDrawer';
import { ResultSummaryHeader } from '@/components/search/ResultSummaryHeader';
import { ActiveFilterChips } from '@/components/search/ActiveFilterChips';
import { ProductCard } from '@/components/search/ProductCard';
import { Pagination } from '@/components/search/Pagination';
import { ProductGridSkeleton } from '@/components/search/ProductGridSkeleton';
import { useScrollToResults } from '@/hooks/useScrollToResults';
import { getActiveDealForBook } from '@/lib/data/flashDeals';
import { SEARCH_CATALOG } from '@/lib/data/searchCatalog';
import { levenshteinDistance } from '@/lib/utils/searchEngine';
import {
  parseAndSanitizeSearchParams,
  serializeFilterParams,
  sanitizeString,
} from '@/lib/utils/searchParamsSanitizer';

const POPULAR_SUGGESTION_TAGS = [
  'WBCS ২০২৬',
  'প্রাথমিক টেট',
  'UGB ইতিহাস',
  'সুনীল গঙ্গোপাধ্যায়',
  'পুলিশ কনস্টেবল',
  'ব্যোমকেশ সমগ্র',
  'মাধ্যমিক টেস্ট পেপার',
  'ছায়া প্রকাশনী',
];

const DEFAULT_PAGE_SIZE = 24;

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isBengali } = useLanguage();

  // URL Query Parameters sanitized (Task 37)
  const rawQ = searchParams.get('q') || searchParams.get('query');
  const queryParam = useMemo(() => sanitizeString(rawQ, 100), [rawQ]);

  // Initial parsed & sanitized state from URL (Tasks 37 & 40)
  const initialParsedState = useMemo(
    () => parseAndSanitizeSearchParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [filterState, setFilterState] = useState<FilterState>(initialParsedState.filterState);
  const [sortBy, setSortBy] = useState<SortOption>(initialParsedState.sortBy);
  const [viewMode, setViewMode] = useState<ViewMode>(initialParsedState.viewMode);
  const [currentPage, setCurrentPage] = useState<number>(initialParsedState.page || 1);
  const [pageSize, setPageSize] = useState<number>(initialParsedState.pageSize || DEFAULT_PAGE_SIZE);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Debounced URL sync helper (Task 36: Clean History Stack & No Lag)
  const urlSyncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const syncFiltersToUrl = (
    nextFilter: FilterState,
    nextSort: SortOption,
    nextView: ViewMode,
    nextPage: number,
    immediate = false,
    nextPageSize?: number
  ) => {
    if (urlSyncTimeoutRef.current) {
      clearTimeout(urlSyncTimeoutRef.current);
      urlSyncTimeoutRef.current = null;
    }

    const doSync = () => {
      const activeSize = nextPageSize !== undefined ? nextPageSize : pageSize;
      const queryString = serializeFilterParams(nextFilter, nextSort, nextView, queryParam, nextPage, activeSize);
      router.replace(queryString ? `/search?${queryString}` : '/search', { scroll: false });
    };

    if (immediate) {
      doSync();
    } else {
      urlSyncTimeoutRef.current = setTimeout(doSync, 60);
    }
  };

  useEffect(() => {
    return () => {
      if (urlSyncTimeoutRef.current) {
        clearTimeout(urlSyncTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = (next: FilterState, immediate = false) => {
    // When filters change, reset to page 1
    setCurrentPage(1);
    setFilterState(next);
    syncFiltersToUrl(next, sortBy, viewMode, 1, immediate);
  };

  const handleSortChange = (next: SortOption) => {
    setSortBy(next);
    syncFiltersToUrl(filterState, next, viewMode, currentPage, true);
  };

  const handleViewModeChange = (next: ViewMode) => {
    setViewMode(next);
    syncFiltersToUrl(filterState, sortBy, next, currentPage, true);
  };

  const handlePageChange = (nextPage: number) => {
    setIsTransitioning(true);
    setCurrentPage(nextPage);
    syncFiltersToUrl(filterState, sortBy, viewMode, nextPage, true);
    if (typeof window !== 'undefined') {
      const topTarget = document.getElementById('search-results-top');
      if (topTarget) {
        topTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    setTimeout(() => setIsTransitioning(false), 200);
  };

  const handlePageSizeChange = (nextSize: number) => {
    setIsTransitioning(true);
    setPageSize(nextSize);
    setCurrentPage(1);
    syncFiltersToUrl(filterState, sortBy, viewMode, 1, true, nextSize);
    if (typeof window !== 'undefined') {
      const topTarget = document.getElementById('search-results-top');
      if (topTarget) {
        topTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setTimeout(() => setIsTransitioning(false), 200);
  };

  // Sync state with URL when browser Back/Forward navigation occurs (Tasks 32 & 40)
  useEffect(() => {
    const parsed = parseAndSanitizeSearchParams(searchParams);
    setFilterState(parsed.filterState);
    setSortBy(parsed.sortBy);
    setViewMode(parsed.viewMode);
    setCurrentPage(parsed.page);
    if (parsed.pageSize) {
      setPageSize(parsed.pageSize);
    }
  }, [searchParams]);

  // Text search predicate
  const matchesQuery = (book: BookProduct, q: string) => {
    if (!q) return true;
    const qLower = q.toLowerCase();
    const matchTitle = book.title.toLowerCase().includes(qLower);
    const matchTitleBn = book.titleBn.toLowerCase().includes(qLower);
    const matchAuthor = book.author.toLowerCase().includes(qLower);
    const matchPublisher = book.publisher.toLowerCase().includes(qLower);
    const matchCategory = book.categoryName.toLowerCase().includes(qLower);
    const matchKeywords = book.keywords?.some((k) => k.toLowerCase().includes(qLower));
    return matchTitle || matchTitleBn || matchAuthor || matchPublisher || matchCategory || matchKeywords;
  };

  // Individual Facet Predicates
  const matchesCategory = (b: BookProduct, cat: string, subCat?: string) => {
    if (cat && cat !== 'all' && b.category !== cat) return false;
    if (subCat && b.subCategory !== subCat) return false;
    return true;
  };

  const matchesAuthors = (b: BookProduct, authors: string[]) => {
    if (authors.length === 0) return true;
    return authors.some((author) => b.author.includes(author));
  };

  const matchesPublishers = (b: BookProduct, publishers: string[]) => {
    if (publishers.length === 0) return true;
    return publishers.some((pub) => b.publisher === pub || b.publisher.includes(pub) || pub.includes(b.publisher));
  };

  const matchesFormats = (b: BookProduct, formats: string[]) => {
    if (formats.length === 0) return true;
    return b.binding ? formats.includes(b.binding) : false;
  };

  const matchesConditions = (b: BookProduct, conditions: string[]) => {
    if (conditions.length === 0) return true;
    return b.condition ? conditions.includes(b.condition) : false;
  };

  const matchesLanguages = (b: BookProduct, languages: string[]) => {
    if (languages.length === 0) return true;
    return b.language ? languages.includes(b.language) : false;
  };

  const matchesRating = (b: BookProduct, minRating: number) => {
    if (minRating <= 0) return true;
    return b.rating >= minRating;
  };

  const matchesDiscount = (b: BookProduct, discountRange?: number) => {
    if (discountRange === undefined || discountRange <= 0) return true;
    if (!b.mrp || b.mrp <= 0 || b.price >= b.mrp) return false;
    const discountVal = Math.round(((b.mrp - b.price) / b.mrp) * 100);
    return discountVal >= discountRange;
  };

  const matchesPrice = (b: BookProduct, minPrice?: number, maxPrice?: number) => {
    if (minPrice !== undefined && b.price < minPrice) return false;
    if (maxPrice !== undefined && b.price > maxPrice) return false;
    return true;
  };

  // Master Filter Matching Predicate (reused by filteredBooks and computeMatchCount)
  const matchesAllFilters = (book: BookProduct, state: FilterState, q: string) => {
    if (!matchesQuery(book, q)) return false;
    if (!matchesCategory(book, state.category, state.subCategory)) return false;
    if (!matchesAuthors(book, state.authors)) return false;
    if (!matchesPublishers(book, state.publishers)) return false;
    if (!matchesFormats(book, state.formats)) return false;
    if (!matchesConditions(book, state.conditions)) return false;
    if (!matchesLanguages(book, state.languages)) return false;
    if (!matchesRating(book, state.minRating)) return false;
    if (!matchesDiscount(book, state.discountRange)) return false;
    if (!matchesPrice(book, state.minPrice, state.maxPrice)) return false;
    return true;
  };

  // High-performance live match counter for Mobile Drawer draft state (Task 5)
  const computeMatchCount = React.useCallback(
    (draft: FilterState) => {
      const qTrimmed = queryParam.trim();
      return SEARCH_CATALOG.filter((book) => matchesAllFilters(book, draft, qTrimmed)).length;
    },
    [queryParam]
  );

  // Compute live filtered books based on search query, category, and multi-facet selections
  const filteredBooks = useMemo(() => {
    const qTrimmed = queryParam.trim();

    return SEARCH_CATALOG.filter((book) => matchesAllFilters(book, filterState, qTrimmed)).sort((a, b) => {
      // Helper for effective deal price comparison (Task 26)
      const getEffectivePrice = (item: BookProduct) => {
        const deal = getActiveDealForBook(item.bookId);
        return deal ? deal.dealPrice : item.price;
      };

      // Task 26: Smart Price Low-to-High sorting (in-stock lowest price first)
      if (sortBy === 'price-asc') {
        const aValid = a.inStock && a.price > 0;
        const bValid = b.inStock && b.price > 0;
        if (aValid && !bValid) return -1;
        if (!aValid && bValid) return 1;

        const priceA = getEffectivePrice(a);
        const priceB = getEffectivePrice(b);
        if (priceA !== priceB) return priceA - priceB;
        return (b.rating || 0) - (a.rating || 0);
      }

      // Price: High to Low (In-stock prioritized over out-of-stock)
      if (sortBy === 'price-desc') {
        if (a.inStock && !b.inStock) return -1;
        if (!a.inStock && b.inStock) return 1;
        const priceA = getEffectivePrice(a);
        const priceB = getEffectivePrice(b);
        if (priceA !== priceB) return priceB - priceA;
        return (b.rating || 0) - (a.rating || 0);
      }

      // Task 27: Bayesian Weighted Average Rating sorting
      // Fix: 0-review items must rank below verified reviewed items
      if (sortBy === 'rating') {
        const getRatingScore = (item: BookProduct) => {
          const v = item.reviewsCount || 0;
          if (v === 0) return 0;
          const PRIOR_MEAN = 4.0;
          const MIN_REVIEWS = 5;
          return (v * item.rating + MIN_REVIEWS * PRIOR_MEAN) / (v + MIN_REVIEWS);
        };

        const scoreA = getRatingScore(a);
        const scoreB = getRatingScore(b);
        if (Math.abs(scoreB - scoreA) > 0.001) {
          return scoreB - scoreA;
        }
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      }

      // Task 28: Edition & Release Date-based "Newest Arrivals" sorting
      if (sortBy === 'newest') {
        const getEditionYear = (item: BookProduct) => {
          const match = item.edition?.match(/20\d{2}/);
          return match ? parseInt(match[0], 10) : 2020;
        };

        const yearA = getEditionYear(a);
        const yearB = getEditionYear(b);
        if (yearA !== yearB) {
          return yearB - yearA;
        }

        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) {
          return dateB - dateA;
        }

        return (b.rating || 0) - (a.rating || 0);
      }

      // Task 29: Rolling 30-Day "Best Selling" sorting
      if (sortBy === 'bestselling') {
        if (a.inStock && !b.inStock) return -1;
        if (!a.inStock && b.inStock) return 1;

        const getSalesScore = (item: BookProduct) => {
          let multiplier = 1.0;
          const badgeUpper = (item.badge || '').toUpperCase();
          if (badgeUpper.includes('BESTSELLER')) multiplier = 2.0;
          else if (badgeUpper.includes('POPULAR')) multiplier = 1.5;
          else if (badgeUpper.includes('UGB') || badgeUpper.includes('SYLLABUS')) multiplier = 1.25;

          return (item.reviewsCount || 0) * multiplier;
        };

        const scoreA = getSalesScore(a);
        const scoreB = getSalesScore(b);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return b.rating - a.rating;
      }

      // Task 25: Multi-Factor Weighted Relevance (Featured / Relevance)
      const qLower = qTrimmed.toLowerCase();
      const getTextRelevance = (item: BookProduct) => {
        if (!qLower) return 1.0;
        if (item.title.toLowerCase().includes(qLower) || item.titleBn.toLowerCase().includes(qLower)) return 1.0;
        if (item.author.toLowerCase().includes(qLower)) return 0.85;
        if (item.publisher.toLowerCase().includes(qLower)) return 0.7;
        if (item.keywords?.some((k) => k.toLowerCase().includes(qLower))) return 0.6;
        return 0.4;
      };

      const relA = getTextRelevance(a);
      const relB = getTextRelevance(b);

      const vA = a.reviewsCount || 0;
      const vB = b.reviewsCount || 0;
      const bayesA = vA > 0 ? ((vA * a.rating) + (5 * 4.0)) / (vA + 5) : 1.0;
      const bayesB = vB > 0 ? ((vB * b.rating) + (5 * 4.0)) / (vB + 5) : 1.0;

      const popA = Math.min(vA / 500, 1.0);
      const popB = Math.min(vB / 500, 1.0);

      const stockA = a.inStock ? 1.0 : 0.0;
      const stockB = b.inStock ? 1.0 : 0.0;

      const scoreA = (relA * 0.45) + ((bayesA / 5.0) * 0.30) + (popA * 0.15) + (stockA * 0.10);
      const scoreB = (relB * 0.45) + ((bayesB / 5.0) * 0.30) + (popB * 0.15) + (stockB * 0.10);

      return scoreB - scoreA;
    });
  }, [queryParam, filterState, sortBy]);

  // Paginated books slice (Task 46 & 47)
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const pagedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBooks.slice(start, start + pageSize);
  }, [filteredBooks, currentPage, pageSize]);

  // DISJUNCTIVE FACETING ENGINE
  // Computes facet counts across each dimension by applying all active filters except that dimension
  const facetGroups = useMemo<FacetGroup[]>(() => {
    const qTrimmed = queryParam.trim();

    // Base query match
    const baseQueryBooks = SEARCH_CATALOG.filter((b) => matchesQuery(b, qTrimmed));

    // 1. Category Facet: All filters applied EXCEPT category & subCategory
    const categoryFiltered = baseQueryBooks.filter((b) =>
      matchesAuthors(b, filterState.authors) &&
      matchesPublishers(b, filterState.publishers) &&
      matchesFormats(b, filterState.formats) &&
      matchesConditions(b, filterState.conditions) &&
      matchesLanguages(b, filterState.languages) &&
      matchesRating(b, filterState.minRating) &&
      matchesDiscount(b, filterState.discountRange) &&
      matchesPrice(b, filterState.minPrice, filterState.maxPrice)
    );

    const categoryOptions = [
      { id: 'all', label: 'All Departments', labelBn: 'সকল বিভাগ', count: categoryFiltered.length },
      {
        id: 'wbcs-special',
        label: 'WBCS Special',
        labelBn: 'WBCS ও সিভিল সার্ভিস',
        count: categoryFiltered.filter((b) => b.category === 'wbcs-special').length,
      },
      {
        id: 'college-university',
        label: 'College & University',
        labelBn: 'কলেজ ও বিশ্ববিদ্যালয়',
        count: categoryFiltered.filter((b) => b.category === 'college-university').length,
      },
      {
        id: 'primary-tet-slst',
        label: 'Primary TET & School Service',
        labelBn: 'টেট ও স্কুল সার্ভিস',
        count: categoryFiltered.filter((b) => b.category === 'primary-tet-slst').length,
      },
      {
        id: 'competitive-exams',
        label: 'Competitive Exams (Police/RRB)',
        labelBn: 'সরকারি চাকরির পরীক্ষা',
        count: categoryFiltered.filter((b) => b.category === 'competitive-exams').length,
      },
      {
        id: 'bengali-literature',
        label: 'Bengali Literature & Fiction',
        labelBn: 'বাংলা সাহিত্য ও উপন্যাস',
        count: categoryFiltered.filter((b) => b.category === 'bengali-literature').length,
      },
      {
        id: 'school-madhyamik-hs',
        label: 'School (Madhyamik & HS)',
        labelBn: 'স্কুল (মাধ্যমিক ও উচ্চমাধ্যমিক)',
        count: categoryFiltered.filter((b) => b.category === 'school-madhyamik-hs').length,
      },
    ];

    // 2. Authors Facet: All filters applied EXCEPT authors
    const authorFiltered = baseQueryBooks.filter((b) =>
      matchesCategory(b, filterState.category, filterState.subCategory) &&
      matchesPublishers(b, filterState.publishers) &&
      matchesFormats(b, filterState.formats) &&
      matchesConditions(b, filterState.conditions) &&
      matchesLanguages(b, filterState.languages) &&
      matchesRating(b, filterState.minRating) &&
      matchesDiscount(b, filterState.discountRange) &&
      matchesPrice(b, filterState.minPrice, filterState.maxPrice)
    );

    const topAuthors = [
      'ড. অশোক কুমার ঘোষ',
      'সত্যজিৎ রায়',
      'শরদিন্দু বন্দ্যোপাধ্যায়',
      'সুনীল গঙ্গোপাধ্যায়',
      'রবীন্দ্রনাথ ঠাকুর',
      'শান্তনু পাত্র',
      'অভিজিৎ মুখোপাধ্যায়',
    ];
    const authorOptions = topAuthors.map((author) => ({
      id: author,
      label: author,
      labelBn: author,
      count: authorFiltered.filter((b) => b.author.includes(author)).length,
    }));

    // 3. Publishers Facet: All filters applied EXCEPT publishers
    const publisherFiltered = baseQueryBooks.filter((b) =>
      matchesCategory(b, filterState.category, filterState.subCategory) &&
      matchesAuthors(b, filterState.authors) &&
      matchesFormats(b, filterState.formats) &&
      matchesConditions(b, filterState.conditions) &&
      matchesLanguages(b, filterState.languages) &&
      matchesRating(b, filterState.minRating) &&
      matchesDiscount(b, filterState.discountRange) &&
      matchesPrice(b, filterState.minPrice, filterState.maxPrice)
    );

    const topPublishers = [
      'ছায়া প্রকাশনী',
      'আনন্দ পাবলিশার্স',
      'দে’জ পাবলিশিং',
      'মিত্র ও ঘোষ পাবলিশার্স',
      'পারুল প্রকাশনী',
      'বিশ্বভারতী গ্রন্থন বিভাগ',
      'মৌলিক লাইব্রেরী',
      'এম.এম হেরিটেজ প্রেস',
      'পশ্চিমবঙ্গ রাজ্য পুস্তক পর্ষদ',
    ];
    const publisherOptions = topPublishers.map((pub) => ({
      id: pub,
      label: pub,
      labelBn: pub,
      count: publisherFiltered.filter((b) => b.publisher === pub).length,
    }));

    // 4. Binding Format: All filters applied EXCEPT formats
    const formatFiltered = baseQueryBooks.filter((b) =>
      matchesCategory(b, filterState.category, filterState.subCategory) &&
      matchesAuthors(b, filterState.authors) &&
      matchesPublishers(b, filterState.publishers) &&
      matchesConditions(b, filterState.conditions) &&
      matchesLanguages(b, filterState.languages) &&
      matchesRating(b, filterState.minRating) &&
      matchesDiscount(b, filterState.discountRange) &&
      matchesPrice(b, filterState.minPrice, filterState.maxPrice)
    );

    const formatOptions = [
      {
        id: 'paperback',
        label: 'Paperback',
        labelBn: 'পেপারব্যাক (Paperback)',
        count: formatFiltered.filter((b) => b.binding === 'paperback').length,
      },
      {
        id: 'hardcover',
        label: 'Hardcover',
        labelBn: 'হার্ডকভার (Hardcover)',
        count: formatFiltered.filter((b) => b.binding === 'hardcover').length,
      },
      {
        id: 'bundle',
        label: 'Combo Bundle',
        labelBn: 'কম্বো সেট (Book Bundle)',
        count: formatFiltered.filter((b) => b.binding === 'bundle').length,
      },
    ];

    // 5. Condition: All filters applied EXCEPT conditions
    const conditionFiltered = baseQueryBooks.filter((b) =>
      matchesCategory(b, filterState.category, filterState.subCategory) &&
      matchesAuthors(b, filterState.authors) &&
      matchesPublishers(b, filterState.publishers) &&
      matchesFormats(b, filterState.formats) &&
      matchesLanguages(b, filterState.languages) &&
      matchesRating(b, filterState.minRating) &&
      matchesDiscount(b, filterState.discountRange) &&
      matchesPrice(b, filterState.minPrice, filterState.maxPrice)
    );

    const conditionOptions = [
      {
        id: 'new',
        label: 'New Edition',
        labelBn: 'নতুন বই (New Edition)',
        count: conditionFiltered.filter((b) => b.condition === 'new').length,
      },
      {
        id: 'used',
        label: 'Used / Second-hand',
        labelBn: 'ব্যবহৃত বই (Used)',
        count: conditionFiltered.filter((b) => b.condition === 'used').length,
      },
    ];

    // 6. Language: All filters applied EXCEPT languages
    const languageFiltered = baseQueryBooks.filter((b) =>
      matchesCategory(b, filterState.category, filterState.subCategory) &&
      matchesAuthors(b, filterState.authors) &&
      matchesPublishers(b, filterState.publishers) &&
      matchesFormats(b, filterState.formats) &&
      matchesConditions(b, filterState.conditions) &&
      matchesRating(b, filterState.minRating) &&
      matchesDiscount(b, filterState.discountRange) &&
      matchesPrice(b, filterState.minPrice, filterState.maxPrice)
    );

    const languageOptions = [
      {
        id: 'bengali',
        label: 'Bengali',
        labelBn: 'বাংলা',
        count: languageFiltered.filter((b) => b.language === 'bengali').length,
      },
      {
        id: 'english',
        label: 'English',
        labelBn: 'ইংরেজি',
        count: languageFiltered.filter((b) => b.language === 'english').length,
      },
      {
        id: 'bilingual',
        label: 'Bilingual (EN+BN)',
        labelBn: 'দ্বিভাষিক',
        count: languageFiltered.filter((b) => b.language === 'bilingual').length,
      },
      {
        id: 'hindi',
        label: 'Hindi',
        labelBn: 'হিন্দি',
        count: languageFiltered.filter((b) => b.language === 'hindi').length,
      },
    ];

    // 7. Rating: All filters applied EXCEPT rating
    const ratingFiltered = baseQueryBooks.filter((b) =>
      matchesCategory(b, filterState.category, filterState.subCategory) &&
      matchesAuthors(b, filterState.authors) &&
      matchesPublishers(b, filterState.publishers) &&
      matchesFormats(b, filterState.formats) &&
      matchesConditions(b, filterState.conditions) &&
      matchesLanguages(b, filterState.languages) &&
      matchesDiscount(b, filterState.discountRange) &&
      matchesPrice(b, filterState.minPrice, filterState.maxPrice)
    );

    const ratingOptions = [
      {
        id: '4',
        label: '4 Stars & Up',
        labelBn: '৪★ ও তদূর্ধ্ব',
        count: ratingFiltered.filter((b) => b.rating >= 4.0).length,
      },
      {
        id: '3',
        label: '3 Stars & Up',
        labelBn: '৩★ ও তদূর্ধ্ব',
        count: ratingFiltered.filter((b) => b.rating >= 3.0).length,
      },
      {
        id: '2',
        label: '2 Stars & Up',
        labelBn: '২★ ও তদূর্ধ্ব',
        count: ratingFiltered.filter((b) => b.rating >= 2.0).length,
      },
      {
        id: '1',
        label: '1 Star & Up',
        labelBn: '১★ ও তদূর্ধ্ব',
        count: ratingFiltered.filter((b) => b.rating >= 1.0).length,
      },
    ];

    // 8. Price Brackets: All filters applied EXCEPT price
    const priceFiltered = baseQueryBooks.filter((b) =>
      matchesCategory(b, filterState.category, filterState.subCategory) &&
      matchesAuthors(b, filterState.authors) &&
      matchesPublishers(b, filterState.publishers) &&
      matchesFormats(b, filterState.formats) &&
      matchesConditions(b, filterState.conditions) &&
      matchesLanguages(b, filterState.languages) &&
      matchesRating(b, filterState.minRating) &&
      matchesDiscount(b, filterState.discountRange)
    );

    const priceOptions = [
      {
        id: 'under-200',
        label: 'Under ₹200',
        labelBn: '₹২০০ এর নিচে',
        count: priceFiltered.filter((b) => b.price < 200).length,
      },
      {
        id: '200-500',
        label: '₹200 – ₹500',
        labelBn: '₹২০০ – ₹৫০০',
        count: priceFiltered.filter((b) => b.price >= 200 && b.price <= 500).length,
      },
      {
        id: '500-1000',
        label: '₹500 – ₹1,000',
        labelBn: '₹৫০০ – ₹১,০০০',
        count: priceFiltered.filter((b) => b.price >= 500 && b.price <= 1000).length,
      },
      {
        id: 'over-1000',
        label: 'Over ₹1,000',
        labelBn: '₹১,০০০ এর বেশি',
        count: priceFiltered.filter((b) => b.price > 1000).length,
      },
    ];

    // 9. Discount Ranges: All filters applied EXCEPT discount
    const discountFiltered = baseQueryBooks.filter((b) =>
      matchesCategory(b, filterState.category, filterState.subCategory) &&
      matchesAuthors(b, filterState.authors) &&
      matchesPublishers(b, filterState.publishers) &&
      matchesFormats(b, filterState.formats) &&
      matchesConditions(b, filterState.conditions) &&
      matchesLanguages(b, filterState.languages) &&
      matchesRating(b, filterState.minRating) &&
      matchesPrice(b, filterState.minPrice, filterState.maxPrice)
    );

    const getDiscountPct = (b: BookProduct) =>
      Math.round(((b.mrp - b.price) / b.mrp) * 100);

    const discountOptions = [
      {
        id: '50',
        label: '50% Off or more',
        labelBn: '৫০% বা তার বেশি ছাড়',
        count: discountFiltered.filter((b) => getDiscountPct(b) >= 50).length,
      },
      {
        id: '35',
        label: '35% Off or more',
        labelBn: '৩৫% বা তার বেশি ছাড়',
        count: discountFiltered.filter((b) => getDiscountPct(b) >= 35).length,
      },
      {
        id: '25',
        label: '25% Off or more',
        labelBn: '২৫% বা তার বেশি ছাড়',
        count: discountFiltered.filter((b) => getDiscountPct(b) >= 25).length,
      },
      {
        id: '10',
        label: '10% Off or more',
        labelBn: '১০% বা তার বেশি ছাড়',
        count: discountFiltered.filter((b) => getDiscountPct(b) >= 10).length,
      },
    ];

    return [
      {
        id: 'category',
        title: 'Department / Category',
        titleBn: 'বিষয় ও পরীক্ষা',
        options: categoryOptions,
      },
      {
        id: 'publishers',
        title: 'Publishers',
        titleBn: 'শীর্ষ প্রকাশনী',
        options: publisherOptions,
      },
      {
        id: 'authors',
        title: 'Authors',
        titleBn: 'জনপ্রিয় লেখক',
        options: authorOptions,
      },
      {
        id: 'price',
        title: 'Price Range',
        titleBn: 'বইয়ের মূল্য',
        options: priceOptions,
      },
      {
        id: 'discount',
        title: 'Discount & Deals',
        titleBn: 'বিশেষ ছাড় ও অফার',
        options: discountOptions,
      },
      {
        id: 'rating',
        title: 'Customer Reviews',
        titleBn: 'গ্রাহক রিভিউ',
        options: ratingOptions,
      },
      {
        id: 'languages',
        title: 'Language',
        titleBn: 'বইয়ের ভাষা',
        options: languageOptions,
      },
      {
        id: 'formats',
        title: 'Binding Format',
        titleBn: 'বাঁধাইয়ের ধরন',
        options: formatOptions,
      },
      {
        id: 'conditions',
        title: 'Book Condition',
        titleBn: 'বইয়ের অবস্থা',
        options: conditionOptions,
      },
    ];
  }, [queryParam, filterState]);

  // Dynamically compute Hierarchical Category Tree (Task 11)
  const hierarchyCategories = useMemo<HierarchyCategoryNode[]>(() => {
    const qTrimmed = queryParam.trim();
    const queryMatched = SEARCH_CATALOG.filter((book) => matchesQuery(book, qTrimmed));

    const getCount = (catId: string, subId?: string) => {
      return queryMatched.filter((b) => {
        if (b.category !== catId) return false;
        if (subId && b.subCategory !== subId) return false;
        return true;
      }).length;
    };

    return [
      {
        id: 'wbcs-special',
        label: 'WBCS & Civil Services',
        labelBn: 'WBCS ও সিভিল সার্ভিস',
        count: getCount('wbcs-special'),
        subCategories: [
          {
            id: 'wbcs-manual',
            label: 'Prelims & Mains Manual',
            labelBn: 'প্রিলিমিনারি ও মেইনস ম্যানুয়াল',
            count: getCount('wbcs-special', 'wbcs-manual'),
          },
          {
            id: 'wbcs-scanner',
            label: 'Scanner & Solved Papers',
            labelBn: 'সলভড স্ক্যানার ও প্রশ্নব্যাংক',
            count: getCount('wbcs-special', 'wbcs-scanner'),
          },
          {
            id: 'wbcs-current-affairs',
            label: 'Current Affairs & Yearbook',
            labelBn: 'কারেন্ট অ্যাফেয়ার্স ও ইয়ারবুক',
            count: getCount('wbcs-special', 'wbcs-current-affairs'),
          },
          {
            id: 'wbcs-bundle',
            label: 'Complete Combo Bundles',
            labelBn: 'সম্পূর্ণ কম্বো বান্ডল প্যাকেজ',
            count: getCount('wbcs-special', 'wbcs-bundle'),
          },
        ],
      },
      {
        id: 'college-university',
        label: 'College & University',
        labelBn: 'কলেজ ও বিশ্ববিদ্যালয় (UGB)',
        count: getCount('college-university'),
        subCategories: [
          {
            id: 'ugb-sem-1-2',
            label: 'Semester 1 & 2 (1st Year)',
            labelBn: 'সেমিস্টার ১ ও ২ (১ম বর্ষ CBCS)',
            count: getCount('college-university', 'ugb-sem-1-2'),
          },
          {
            id: 'ugb-sem-3-4',
            label: 'Semester 3 & 4 (2nd Year)',
            labelBn: 'সেমিস্টার ৩ ও ৪ (২য় বর্ষ অনার্স/পাস)',
            count: getCount('college-university', 'ugb-sem-3-4'),
          },
          {
            id: 'malda-heritage',
            label: 'Malda Heritage & History',
            labelBn: 'মালদা হেরিটেজ ও আঞ্চলিক ইতিহাস',
            count: getCount('college-university', 'malda-heritage'),
          },
        ],
      },
      {
        id: 'primary-tet-slst',
        label: 'Primary TET & School Service',
        labelBn: 'টেট ও স্কুল সার্ভিস',
        count: getCount('primary-tet-slst'),
        subCategories: [
          {
            id: 'primary-tet',
            label: 'Primary TET Complete',
            labelBn: 'প্রাথমিক টেট (Primary TET)',
            count: getCount('primary-tet-slst', 'primary-tet'),
          },
          {
            id: 'upper-primary',
            label: 'Upper Primary TET',
            labelBn: 'উচ্চ প্রাথমিক টেট (Upper Primary)',
            count: getCount('primary-tet-slst', 'upper-primary'),
          },
          {
            id: 'slst-ssc',
            label: 'SLST Assistant Teacher',
            labelBn: 'স্কুল সার্ভিস কমিশন (SLST)',
            count: getCount('primary-tet-slst', 'slst-ssc'),
          },
        ],
      },
      {
        id: 'competitive-exams',
        label: 'Police & Railway Exams',
        labelBn: 'পুলিশ ও রেলওয়ে পরীক্ষা',
        count: getCount('competitive-exams'),
        subCategories: [
          {
            id: 'wb-police',
            label: 'WB Police & Constable',
            labelBn: 'পশ্চিমবঙ্গ পুলিশ ও কনস্টেবল',
            count: getCount('competitive-exams', 'wb-police'),
          },
          {
            id: 'railway-rrb',
            label: 'Railway RRB ALP/Tech',
            labelBn: 'রেলওয়ে রিক্রুটমেন্ট (RRB)',
            count: getCount('competitive-exams', 'railway-rrb'),
          },
          {
            id: 'ssc-central',
            label: 'SSC CHSL & CGL',
            labelBn: 'স্টাফ সিলেকশন কমিশন (SSC)',
            count: getCount('competitive-exams', 'ssc-central'),
          },
        ],
      },
      {
        id: 'bengali-literature',
        label: 'Bengali Literature & Fiction',
        labelBn: 'বাংলা সাহিত্য ও উপন্যাস',
        count: getCount('bengali-literature'),
        subCategories: [
          {
            id: 'detective-feluda',
            label: 'Feluda Detective Series',
            labelBn: 'ফেলুদা সমগ্র - সত্যজিৎ রায়',
            count: getCount('bengali-literature', 'detective-feluda'),
          },
          {
            id: 'detective-byomkesh',
            label: 'Byomkesh Samagra',
            labelBn: 'ব্যোমকেশ সমগ্র - শরদিন্দু',
            count: getCount('bengali-literature', 'detective-byomkesh'),
          },
          {
            id: 'tagore-poetry',
            label: 'Rabindranath Tagore Collection',
            labelBn: 'রবীন্দ্র সাহিত্য ও সঞ্চয়িতা',
            count: getCount('bengali-literature', 'tagore-poetry'),
          },
          {
            id: 'historical-novels',
            label: 'Classics & Modern Novels',
            labelBn: 'ধ্রুপদী ও আধুনিক উপন্যাস',
            count: getCount('bengali-literature', 'historical-novels'),
          },
        ],
      },
      {
        id: 'school-madhyamik-hs',
        label: 'School (Madhyamik & HS)',
        labelBn: 'স্কুল (মাধ্যমিক ও উচ্চমাধ্যমিক)',
        count: getCount('school-madhyamik-hs'),
        subCategories: [
          {
            id: 'madhyamik-10',
            label: 'Madhyamik 10th (WBBSE)',
            labelBn: 'মাধ্যমিক দশম শ্রেণি (WBBSE)',
            count: getCount('school-madhyamik-hs', 'madhyamik-10'),
          },
          {
            id: 'hs-12',
            label: 'Higher Secondary 12th (WBCHSE)',
            labelBn: 'উচ্চমাধ্যমিক দ্বাদশ শ্রেণি (WBCHSE)',
            count: getCount('school-madhyamik-hs', 'hs-12'),
          },
        ],
      },
    ];
  }, [queryParam]);

  // Task 48 & 49: Intelligent "Did You Mean" Suggestion on Zero Results
  const didYouMean = useMemo(() => {
    if (!queryParam || filteredBooks.length > 0) return null;
    const qClean = queryParam.trim().toLowerCase();

    const candidates = Array.from(
      new Set([
        ...POPULAR_SUGGESTION_TAGS,
        ...SEARCH_CATALOG.map((b) => b.title),
        ...SEARCH_CATALOG.map((b) => b.titleBn),
        ...SEARCH_CATALOG.map((b) => b.author),
        ...SEARCH_CATALOG.map((b) => b.publisher),
      ])
    );

    let bestCandidate: string | null = null;
    let minDistance = 999;

    for (const cand of candidates) {
      const candLower = cand.toLowerCase();
      if (candLower.includes(qClean) || qClean.includes(candLower)) {
        return cand;
      }
      const dist = levenshteinDistance(qClean, candLower);
      if (dist < minDistance && dist <= Math.max(2, Math.floor(qClean.length * 0.4))) {
        minDistance = dist;
        bestCandidate = cand;
      }
    }

    return bestCandidate;
  }, [queryParam, filteredBooks.length]);

  // Task 48: Popular Bestsellers recommendation for Zero-Result Recovery
  const popularBestsellers = useMemo(() => {
    return SEARCH_CATALOG.filter(
      (b) => b.badge === 'BESTSELLER' || b.badge === 'MALDA TOP SELLER' || b.rating >= 4.8
    ).slice(0, 4);
  }, []);

  // Compute subCategoryLabel for active chips (Task 11)
  const subCategoryLabel = useMemo(() => {
    if (!filterState.subCategory) return undefined;
    for (const cat of hierarchyCategories) {
      const sub = cat.subCategories.find((s) => s.id === filterState.subCategory);
      if (sub) {
        return isBengali ? sub.labelBn : sub.label;
      }
    }
    return filterState.subCategory;
  }, [filterState.subCategory, hierarchyCategories, isBengali]);

  // Count active filters
  const activeFiltersCount =
    (filterState.category && filterState.category !== 'all' ? 1 : 0) +
    (filterState.subCategory ? 1 : 0) +
    filterState.authors.length +
    filterState.publishers.length +
    filterState.formats.length +
    filterState.conditions.length +
    filterState.languages.length +
    (filterState.minRating > 0 ? 1 : 0) +
    (filterState.discountRange !== undefined ? 1 : 0) +
    (filterState.minPrice !== undefined || filterState.maxPrice !== undefined ? 1 : 0);

  const handleClearAllFilters = () => {
    const defaultState: FilterState = {
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
      page: 1,
    };
    setCurrentPage(1);
    setFilterState(defaultState);
    syncFiltersToUrl(defaultState, sortBy, viewMode, 1, true);
  };

  const handleRemoveFilterChip = (
    type: 'category' | 'subCategory' | 'author' | 'publisher' | 'format' | 'condition' | 'language' | 'rating' | 'price' | 'discount',
    val?: string
  ) => {
    const next: FilterState = { ...filterState };
    if (type === 'category') {
      next.category = 'all';
      next.subCategory = undefined;
    } else if (type === 'subCategory') {
      next.subCategory = undefined;
    } else if (type === 'price') {
      next.minPrice = undefined;
      next.maxPrice = undefined;
    } else if (type === 'discount') {
      next.discountRange = undefined;
    } else if (type === 'author' && val) {
      next.authors = next.authors.filter((a) => a !== val);
    } else if (type === 'publisher' && val) {
      next.publishers = next.publishers.filter((p) => p !== val);
    } else if (type === 'format' && val) {
      next.formats = next.formats.filter((f) => f !== val);
    } else if (type === 'condition' && val) {
      next.conditions = next.conditions.filter((c) => c !== val);
    } else if (type === 'language' && val) {
      next.languages = next.languages.filter((l) => l !== val);
    } else if (type === 'rating') {
      next.minRating = 0;
    }
    handleFilterChange(next, true);
  };

  // Hook for Smart Auto Scroll-to-Top on filter or sort change (Task 6)
  useScrollToResults({
    containerId: 'search-results-main',
    triggerDeps: [filterState, sortBy, currentPage],
    enabled: !isMobileDrawerOpen,
  });

  // Tasks 34, 38 & 39: Dynamic Canonical URL, Social OpenGraph Tags, and Dynamic SEO Title
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Dynamic Robots Meta Tag (Tasks 34 & 39: Crawl budget protection)
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    const hasFacets = activeFiltersCount > 0 || sortBy !== 'relevance' || currentPage > 1;
    robotsMeta.content = hasFacets ? 'noindex, follow' : 'index, follow';

    // 2. Dynamic Canonical Link Tag (Tasks 34 & 39)
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanCanonical =
      filterState.category && filterState.category !== 'all'
        ? `${origin}/search?category=${encodeURIComponent(filterState.category)}`
        : queryParam
        ? `${origin}/search?q=${encodeURIComponent(queryParam)}`
        : `${origin}/search`;
    canonicalLink.href = cleanCanonical;

    // 3. Dynamic Title & OpenGraph Preview Tags (Task 38)
    const selectedCategoryOption = facetGroups[0]?.options.find((o) => o.id === filterState.category);
    const categoryName = isBengali ? selectedCategoryOption?.labelBn : selectedCategoryOption?.label;

    let pageTitle = 'বই অনুসন্ধান ও ফিল্টারিং ক্যাটালগ | M.M Book House Malda';
    let ogDesc = 'মালদার বৃহত্তম অনলাইন বুক স্টোর - কলেজ, বিশ্ববিদ্যালয় (UGB), WBCS, প্রাথমিক টেট ও স্কুল সার্ভিসের বই সুলভ মূল্যে খুঁজুন ও কিনুন।';

    if (queryParam) {
      pageTitle = `"${queryParam}" - বই অনুসন্ধান ফলাফল (${toBengaliNumerals(filteredBooks.length)}টি বই) | M.M Book House`;
      ogDesc = `"${queryParam}" সম্পর্কিত ${toBengaliNumerals(filteredBooks.length)}টি বইয়ের ক্যাটালগ। সরাসরি মালদা থেকে দ্রুত ডেলিভারি।`;
    } else if (filterState.category && filterState.category !== 'all' && categoryName) {
      pageTitle = `${categoryName} বইসমূহ (${toBengaliNumerals(filteredBooks.length)}টি বই) | M.M Book House`;
      ogDesc = `${categoryName} ক্যাটাগরির সমস্ত সিলেবাস ভিত্তিক বই। বিশেষ ছাড় ও দ্রুত ডেলিভারি।`;
    }

    if (currentPage > 1) {
      pageTitle += ` (পৃষ্ঠা ${toBengaliNumerals(currentPage)})`;
    }

    document.title = pageTitle;

    const setMetaTag = (property: string, contentVal: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = contentVal;
    };

    setMetaTag('og:title', pageTitle);
    setMetaTag('og:description', ogDesc);
    setMetaTag('og:url', typeof window !== 'undefined' ? window.location.href : cleanCanonical);
  }, [activeFiltersCount, sortBy, filterState.category, queryParam, filteredBooks.length, facetGroups, isBengali, currentPage]);

  // Task 35: Map filter category ID to permanent SEO category slug
  const getCategorySlug = (catId: string): string => {
    switch (catId) {
      case 'wbcs-special':
        return 'wbcs';
      case 'college-university':
        return 'college';
      case 'school-madhyamik-hs':
        return 'school';
      case 'competitive-exams':
        return 'competitive-exams';
      case 'bengali-literature':
        return 'literature';
      case 'primary-tet-slst':
        return 'competitive-exams/tet';
      default:
        return catId;
    }
  };

  const whatsAppText = encodeURIComponent(
    `নমস্কার M.M Book House, আমি একটি বই খুঁজছি${queryParam ? `: "${queryParam}"` : ''}। এটি কি আপনার স্টোরে উপলব্ধ রয়েছে?`
  );

  return (
    <>
      {/* Task 49: Top Progress & Shimmer Bar during Transitions */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-amber-500 via-[#e77600] to-orange-500 transition-opacity duration-200 ${
          isTransitioning ? 'opacity-100 animate-pulse' : 'opacity-0 pointer-events-none'
        }`}
        role="progressbar"
        aria-hidden={!isTransitioning}
      />
      <div id="search-results-top" className="scroll-mt-20" />

      <SearchResultsLayout
        sidebar={
          <DesktopFacetSidebar
            facetGroups={facetGroups}
            hierarchyCategories={hierarchyCategories}
            filterState={filterState}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAllFilters}
            hasActiveFilters={activeFiltersCount > 0}
            isBengali={isBengali}
          />
        }
        header={
          <ResultSummaryHeader
            query={queryParam}
            categoryName={
              filterState.category !== 'all'
                ? facetGroups[0]?.options.find((o) => o.id === filterState.category)?.labelBn || filterState.category
                : undefined
            }
            categorySlug={filterState.category !== 'all' ? getCategorySlug(filterState.category) : undefined}
            totalResults={filteredBooks.length}
            page={currentPage}
            pageSize={pageSize}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            isBengali={isBengali}
          />
        }
        activeChips={
          <ActiveFilterChips
            filterState={filterState}
            facetGroups={facetGroups}
            subCategoryLabel={subCategoryLabel}
            onRemoveFilter={handleRemoveFilterChip}
            onClearAll={handleClearAllFilters}
            isBengali={isBengali}
          />
        }
        pagination={
          filteredBooks.length > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalResults={filteredBooks.length}
              isBengali={isBengali}
            />
          ) : undefined
        }
      >
        {/* Main Products Display (Grid vs List View - Task 2) */}
        {isTransitioning ? (
          <ProductGridSkeleton count={pageSize} viewMode={viewMode} />
        ) : filteredBooks.length > 0 ? (
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              /* Adaptive Grid View (4 cols lg, 3 cols md, 2 cols mobile) */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {pagedBooks.map((book) => (
                  <ProductCard
                    key={book.id}
                    book={book}
                    viewMode="grid"
                    isBengali={isBengali}
                  />
                ))}
              </div>
            ) : (
              /* Amazon-Style Horizontal List View (Task 2) */
              <div className="flex flex-col gap-4">
                {pagedBooks.map((book) => (
                  <ProductCard
                    key={book.id}
                    book={book}
                    viewMode="list"
                    isBengali={isBengali}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Task 48 & 49: Amazon-Style Zero-Result Recovery State */
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 text-center max-w-xl mx-auto space-y-6 my-6 shadow-xs">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                <Package className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {isBengali
                    ? `কোনো বই খুঁজে পাওয়া যায়নি`
                    : `No books matched your criteria`}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  {isBengali
                    ? 'ফিল্টারের পরিধি শিথিল করুন অথবা অন্যান্য জনপ্রিয় বইসমূহ অন্বেষণ করুন।'
                    : 'Try relaxing your filter criteria or explore popular books below.'}
                </p>
              </div>

              {/* "Did You Mean" Suggestion Pill (Task 49) */}
              {didYouMean && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-900 font-medium">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>{isBengali ? 'আপনি কি এটি খুঁজছেন?' : 'Did you mean:'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(didYouMean)}`);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-sm font-bold text-[#b12704] hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>&ldquo;{didYouMean}&rdquo;</span>
                  </button>
                </div>
              )}

              {/* Task 48: Relax Active Filter Chips individually */}
              {activeFiltersCount > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-700 block">
                    {isBengali ? 'সক্রিয় ফিল্টার শিথিল করুন:' : 'Relax specific filters:'}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {filterState.category !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFilterChip('category')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <span>{filterState.category}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {filterState.authors.map((author) => (
                      <button
                        key={author}
                        type="button"
                        onClick={() => handleRemoveFilterChip('author', author)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <span>{author}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                    {filterState.publishers.map((pub) => (
                      <button
                        key={pub}
                        type="button"
                        onClick={() => handleRemoveFilterChip('publisher', pub)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <span>{pub}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                    {(filterState.minPrice !== undefined || filterState.maxPrice !== undefined) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFilterChip('price')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <span>₹{filterState.minPrice ?? 0}–₹{filterState.maxPrice ?? '∞'}</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {filterState.minRating > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFilterChip('rating')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <span>{filterState.minRating}★+</span>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isBengali ? 'সমস্ত ফিল্টার রিসেট করুন' : 'Reset All Filters'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Popular Searches Pills */}
              <div className="space-y-2 pt-1 text-left">
                <span className="text-xs font-bold text-gray-700 block text-center">
                  {isBengali ? 'মালদার জনপ্রিয় অনুসন্ধান:' : 'Popular searches in Malda:'}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {POPULAR_SUGGESTION_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(tag)}`);
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-gray-700 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task 48: Direct WhatsApp Sourcing Option */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-left bg-gray-50 p-3.5 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {isBengali ? 'নির্দিষ্ট বইটি স্টোরে চান?' : 'Looking for a specific book?'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {isBengali
                      ? 'আমাদের জানান, মালদা কাউন্টার থেকে দ্রুত সংগ্রহ করে দেব।'
                      : 'WhatsApp our team and we will source it for you immediately.'}
                  </p>
                </div>

                <a
                  href={`https://wa.me/919800123456?text=${whatsAppText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{isBengali ? 'WhatsApp অনুরোধ' : 'WhatsApp Request'}</span>
                </a>
              </div>
            </div>

            {/* Task 48: Empathetic Recommendations below Zero-Results (Amazon-Standard Shelf) */}
            {popularBestsellers.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>
                      {isBengali
                        ? 'মালদা স্টোরের জনপ্রিয় বেস্টসেলার বইসমূহ'
                        : 'Popular Bestsellers in Malda Store'}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    {isBengali ? 'সব বই দেখুন' : 'View all books'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {popularBestsellers.map((book) => (
                    <ProductCard
                      key={book.id}
                      book={book}
                      viewMode="grid"
                      isBengali={isBengali}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SearchResultsLayout>

      {/* Mobile Sticky Bottom Sort & Filter Action Bar (Task 3) */}
      <MobileSortFilterBar
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onOpenFilterDrawer={() => setIsMobileDrawerOpen(true)}
        activeFiltersCount={activeFiltersCount}
        isBengali={isBengali}
      />

      {/* Amazon-Style Dual-Pane Mobile Filter Drawer (Task 4 & 5) */}
      <MobileDualPaneDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        facetGroups={facetGroups}
        hierarchyCategories={hierarchyCategories}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        matchingCount={filteredBooks.length}
        computeMatchCount={computeMatchCount}
        onApply={() => setIsMobileDrawerOpen(false)}
        isBengali={isBengali}
      />

      {/* Spacing padding at bottom for mobile sticky bar */}
      <div className="h-16 md:hidden" />
    </>
  );
}

function SearchLoadingSkeleton() {
  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 min-h-[75vh]">
      <div className="h-4 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="h-16 bg-gray-200 rounded-xl mb-6 animate-pulse" />
      <div className="flex gap-6">
        <div className="hidden md:block w-64 h-96 bg-gray-200 rounded-xl shrink-0 animate-pulse" />
        <div className="flex-1">
          <ProductGridSkeleton count={8} viewMode="grid" />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingSkeleton />}>
      <SearchResultsContent />
    </Suspense>
  );
}
