/**
 * Catalog Filter & Sorting Type Definitions
 * Module 6: Faceted Filter & Sorting Engine
 */

export type ViewMode = 'grid' | 'list';

export type SortOption =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'newest'
  | 'bestselling';

export interface FilterState {
  category: string;
  subCategory?: string;
  authors: string[];
  publishers: string[];
  formats: string[];
  conditions: string[];
  languages: string[];
  minRating: number;
  minPrice?: number;
  maxPrice?: number;
  discountRange?: number;
}

export interface SubCategoryNode {
  id: string;
  label: string;
  labelBn: string;
  count: number;
}

export interface HierarchyCategoryNode {
  id: string;
  label: string;
  labelBn: string;
  count: number;
  subCategories: SubCategoryNode[];
}

export interface FacetOption {
  id: string;
  label: string;
  labelBn: string;
  count: number;
  disabled?: boolean;
}

export interface FacetGroup {
  id: string;
  title: string;
  titleBn: string;
  icon?: string;
  options: FacetOption[];
}

export interface BookProduct {
  id: string;
  bookId: string;
  title: string;
  titleBn: string;
  author: string;
  publisher: string;
  category: string;
  categoryName: string;
  subCategory?: string;
  subCategoryName?: string;
  price: number;
  mrp: number;
  discount: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  edition: string;
  createdAt?: string;
  binding?: 'paperback' | 'hardcover' | 'bundle';
  condition?: 'new' | 'used';
  language?: 'bengali' | 'english' | 'bilingual' | 'hindi';
  coverImage?: string;
  keywords?: string[];
}
