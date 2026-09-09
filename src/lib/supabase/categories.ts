import { unstable_cache } from 'next/cache';
import { supabase } from './client';
import { CategoryItem } from '@/types/category-drawer';
import { DEPARTMENT_SUBCATEGORIES } from '@/components/category-drawer/departmentData';

export interface DbCategory {
  id: string;
  parent_id: string | null;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  icon_url: string | null;
  banner_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryTreeNode extends CategoryItem {
  parentId: string | null;
  fullPath: string; // e.g., "/category/college/ugb"
  subcategories: CategoryTreeNode[];
}

/**
 * Task 19: Build SEO-friendly hierarchical slug URL
 * Ensures structured URL patterns: /category/:parentSlug/:childSlug
 */
export function buildCategorySlugUrl(parentSlug?: string | null, slug: string = ''): string {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
  if (!parentSlug) {
    return `/category/${cleanSlug}`;
  }
  const cleanParent = parentSlug.replace(/^\/+|\/+$/g, '');
  return `/category/${cleanParent}/${cleanSlug}`;
}

/**
 * Task 16: Transform flat Adjacency List categories into hierarchical tree
 */
export function buildCategoryTree(flatCategories: DbCategory[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>();
  const rootCategories: CategoryTreeNode[] = [];

  // 1. Initialize map
  flatCategories.forEach((cat) => {
    categoryMap.set(cat.id, {
      id: cat.id,
      parentId: cat.parent_id,
      title: cat.name,
      titleBn: cat.name_bn || cat.name,
      slug: cat.slug,
      iconName: cat.icon_url || undefined,
      fullPath: buildCategorySlugUrl(null, cat.slug),
      hasSubcategories: false,
      subcategories: [],
    });
  });

  // 2. Build tree structure via parent_id relationships
  flatCategories.forEach((cat) => {
    const node = categoryMap.get(cat.id);
    if (!node) return;

    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      const parentNode = categoryMap.get(cat.parent_id)!;
      node.fullPath = buildCategorySlugUrl(parentNode.slug, cat.slug);
      parentNode.hasSubcategories = true;
      parentNode.subcategories.push(node);
    } else {
      rootCategories.push(node);
    }
  });

  return rootCategories;
}

/**
 * Fallback static tree if Supabase is unreachable or in mock mode
 */
export function getFallbackCategoryTree(): CategoryTreeNode[] {
  const departments: { id: string; title: string; titleBn: string; slug: string }[] = [
    { id: 'dept-wbcs', title: 'WBCS & Civil Services', titleBn: 'ডাব্লুবিসিএস ও সিভিল সার্ভিস', slug: 'wbcs' },
    { id: 'dept-college', title: 'College Semesters', titleBn: 'কলেজ ও বিশ্ববিদ্যালয় সেমিস্টার', slug: 'college' },
    { id: 'dept-school', title: 'School Education', titleBn: 'স্কুল এডুকেশন (মাধ্যমিক ও উচ্চমাধ্যমিক)', slug: 'school' },
    { id: 'dept-gov-jobs', title: 'Competitive Govt Exams', titleBn: 'চাকরির পরীক্ষা (রেল, SSC, পুলিশ, TET)', slug: 'competitive-exams' },
    { id: 'dept-literature', title: 'Literature & Fiction', titleBn: 'বাংলা সাহিত্য ও সাধারণ বই', slug: 'literature' },
    { id: 'dept-specials', title: 'Specials & Collector Editions', titleBn: 'স্পেশাল ও সংগ্রাহক সংস্করণ', slug: 'specials' },
    { id: 'dept-ebooks', title: 'E-Books & Guidelines', titleBn: 'ই-বুক ও সিলেবাস গাইডলাইন', slug: 'ebooks' },
  ];

  return departments.map((dept) => {
    const subItems = DEPARTMENT_SUBCATEGORIES[dept.id] || [];
    return {
      id: dept.id,
      parentId: null,
      title: dept.title,
      titleBn: dept.titleBn,
      slug: dept.slug,
      fullPath: buildCategorySlugUrl(null, dept.slug),
      hasSubcategories: subItems.length > 0,
      subcategories: subItems.map((sub) => {
        const subPath = sub.slug.startsWith('/category/')
          ? sub.slug
          : sub.slug.includes('/')
          ? `/category/${sub.slug}`
          : buildCategorySlugUrl(dept.slug, sub.slug);

        return {
          id: sub.id,
          parentId: dept.id,
          title: sub.title,
          titleBn: sub.titleBn,
          slug: sub.slug,
          fullPath: subPath,
          badge: sub.badge,
          hasSubcategories: false,
          subcategories: [],
        };
      }),
    };
  });
}

/**
 * Internal raw database query for categories
 */
async function getRawCategoryTree(): Promise<CategoryTreeNode[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return getFallbackCategoryTree();
    }

    const tree = buildCategoryTree(data as DbCategory[]);
    return tree.length > 0 ? tree : getFallbackCategoryTree();
  } catch {
    // Network / offline fallback
    return getFallbackCategoryTree();
  }
}

/**
 * Task 16 & 17: Fetch Dynamic Category Tree with Next.js Data Cache (ISR & Tags)
 * Supports on-demand revalidation via revalidateTag('categories')
 */
export const fetchCategoryTree = unstable_cache(
  async () => getRawCategoryTree(),
  ['categories-tree-cache'],
  {
    revalidate: 3600,
    tags: ['categories'],
  }
);
