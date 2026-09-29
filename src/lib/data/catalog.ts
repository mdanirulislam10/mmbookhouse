import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Banner, BookCard, Category, CategoryNode, SearchRow } from "@/lib/types";

export const CATALOG_TAG = "catalog";

const CARD_COLUMNS =
  "id, slug, title, title_bn, cover_url, mrp, price, discount_pct, rating_avg, rating_count, in_stock, low_stock, on_hand, author_names, author_names_bn, publisher_name, language, deal_ends_at";

function warn<T>(label: string, error: { message: string } | null, fallback: T): T {
  if (error) console.error(`[catalog] ${label}:`, error.message);
  return fallback;
}

/* ------------------------------------------------------------ categories */

export function buildTree(list: Category[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  for (const c of list) byId.set(c.id, { ...c, children: [] });
  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (a: CategoryNode, b: CategoryNode) => a.sort_order - b.sort_order || a.name.localeCompare(b.name);
  const walk = (nodes: CategoryNode[]) => {
    nodes.sort(sort);
    nodes.forEach((n) => walk(n.children));
  };
  walk(roots);
  return roots;
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data, error } = await createPublicClient()
      .from("categories")
      .select("id, parent_id, slug, name, name_bn, image_url, sort_order, show_on_home")
      .order("sort_order")
      .order("name");
    return warn("categories", error, (data ?? []) as Category[]);
  },
  ["categories"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);

export async function getCategoryTree(): Promise<CategoryNode[]> {
  return buildTree(await getCategories());
}

/** The category, its ancestors (for breadcrumbs) and its direct children. */
export async function getCategoryContext(slug: string) {
  const all = await getCategories();
  const category = all.find((c) => c.slug === slug);
  if (!category) return null;
  const byId = new Map(all.map((c) => [c.id, c]));
  const trail: Category[] = [];
  for (let c: Category | undefined = category; c; c = c.parent_id ? byId.get(c.parent_id) : undefined) trail.unshift(c);
  const children = all.filter((c) => c.parent_id === category.id);
  return { category, trail, children };
}

/* ---------------------------------------------------------------- lists */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function bookList(build: (q: any) => PromiseLike<{ data: unknown; error: { message: string } | null }>, label: string): Promise<BookCard[]> {
  const q = createPublicClient().from("v_books").select(CARD_COLUMNS);
  const { data, error } = await build(q);
  return warn(label, error, (data ?? []) as BookCard[]);
}

export const getBestsellers = unstable_cache(
  (limit: number = 12) => bookList((q) => q.eq("in_stock", true).order("sold_count", { ascending: false }).order("created_at", { ascending: false }).limit(limit), "bestsellers"),
  ["bestsellers"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

export const getNewArrivals = unstable_cache(
  (limit: number = 12) => bookList((q) => q.order("created_at", { ascending: false }).limit(limit), "new arrivals"),
  ["new-arrivals"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

export const getFeatured = unstable_cache(
  (limit: number = 12) => bookList((q) => q.eq("is_featured", true).order("created_at", { ascending: false }).limit(limit), "featured"),
  ["featured"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

export const getDealBooks = unstable_cache(
  (limit: number = 24) => bookList((q) => q.not("deal_ends_at", "is", null).order("deal_ends_at", { ascending: true }).limit(limit), "deals"),
  ["deal-books"],
  { revalidate: 60, tags: [CATALOG_TAG] },
);

export const getHeroBanners = unstable_cache(
  async (): Promise<Banner[]> => {
    const { data, error } = await createPublicClient()
      .from("banners")
      .select("id, placement, title, title_bn, subtitle, subtitle_bn, image_url, mobile_image_url, link_url, cta_label, cta_label_bn, bg_color, sort_order")
      .order("sort_order");
    return warn("banners", error, (data ?? []) as Banner[]);
  },
  ["banners"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

/* ---------------------------------------------------------------- search */

export interface SearchParams {
  q?: string;
  category?: string; // category id
  min?: number;
  max?: number;
  lang?: string;
  inStock?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export const SORTS = ["relevance", "newest", "popular", "price_asc", "price_desc", "rating", "discount"] as const;
export type SortKey = (typeof SORTS)[number];

export async function searchBooks(params: SearchParams): Promise<{ rows: SearchRow[]; total: number }> {
  const pageSize = params.pageSize ?? 24;
  const page = Math.max(params.page ?? 1, 1);
  const { data, error } = await createPublicClient().rpc("search_books", {
    p_q: params.q?.trim() || null,
    p_category: params.category ?? null,
    p_min: params.min ?? null,
    p_max: params.max ?? null,
    p_lang: params.lang ?? null,
    p_in_stock: params.inStock ?? false,
    p_sort: SORTS.includes(params.sort as SortKey) ? params.sort : "relevance",
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) {
    console.error("[catalog] search_books:", error.message);
    return { rows: [], total: 0 };
  }
  const rows = (data ?? []) as SearchRow[];
  return { rows, total: rows[0]?.total_count ?? 0 };
}

/* ------------------------------------------------------------- book page */

export interface BookDetail {
  id: string;
  slug: string;
  title: string;
  title_bn: string | null;
  subtitle: string | null;
  description: string | null;
  description_bn: string | null;
  isbn: string | null;
  language: string;
  edition: string | null;
  edition_year: number | null;
  pages: number | null;
  binding: string;
  condition: string;
  weight_g: number | null;
  class_level: string | null;
  cover_url: string | null;
  gallery: string[];
  preview_pages: string[];
  status: string;
  hsn_code: string;
  created_at: string;
  updated_at: string;
  publisher: { id: string; slug: string; name: string; name_bn: string | null } | null;
  authors: { id: string; slug: string; name: string; name_bn: string | null; role: string }[];
  categories: { id: string; slug: string; name: string; name_bn: string | null; parent_id: string | null }[];
  card: BookCard;
}

export const getBookBySlug = unstable_cache(
  async (slug: string): Promise<BookDetail | null> => {
    const supabase = createPublicClient();
    const [{ data: book, error }, { data: card }] = await Promise.all([
      supabase
        .from("books")
        .select(
          "*, publishers(id, slug, name, name_bn), book_authors(role, position, authors(id, slug, name, name_bn)), book_categories(categories(id, slug, name, name_bn, parent_id))",
        )
        .eq("slug", slug)
        .maybeSingle(),
      supabase.from("v_books").select(CARD_COLUMNS).eq("slug", slug).maybeSingle(),
    ]);
    if (error || !book || !card) return null;
    const b = book as Record<string, any>;
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      title_bn: b.title_bn,
      subtitle: b.subtitle,
      description: b.description,
      description_bn: b.description_bn,
      isbn: b.isbn,
      language: b.language,
      edition: b.edition,
      edition_year: b.edition_year,
      pages: b.pages,
      binding: b.binding,
      condition: b.condition,
      weight_g: b.weight_g,
      class_level: b.class_level,
      cover_url: b.cover_url,
      gallery: Array.isArray(b.gallery) ? b.gallery : [],
      preview_pages: Array.isArray(b.preview_pages) ? b.preview_pages : [],
      status: b.status,
      hsn_code: b.hsn_code,
      created_at: b.created_at,
      updated_at: b.updated_at,
      publisher: b.publishers ?? null,
      authors: [...(b.book_authors ?? [])]
        .sort((x: any, y: any) => x.position - y.position)
        .map((ba: any) => ({ ...ba.authors, role: ba.role })),
      categories: (b.book_categories ?? []).map((bc: any) => bc.categories).filter(Boolean),
      card: card as BookCard,
    };
  },
  ["book-by-slug"],
  { revalidate: 60, tags: [CATALOG_TAG] },
);

export const getRelatedBooks = unstable_cache(
  async (bookId: string, kind: "fbt" | "similar" = "fbt", limit = 4): Promise<BookCard[]> => {
    const supabase = createPublicClient();
    const { data: rel } = await supabase
      .from("related_books")
      .select("related_book_id, position")
      .eq("book_id", bookId)
      .eq("kind", kind)
      .order("position")
      .limit(limit);
    const ids = (rel ?? []).map((r) => r.related_book_id);
    if (!ids.length) return [];
    const { data } = await supabase.from("v_books").select(CARD_COLUMNS).in("id", ids);
    const byId = new Map((data ?? []).map((b: any) => [b.id, b as BookCard]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as BookCard[];
  },
  ["related-books"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

/** Same-category titles as a fallback for "customers also viewed". */
export const getSimilarByCategory = unstable_cache(
  async (bookId: string, limit = 12): Promise<BookCard[]> => {
    const supabase = createPublicClient();
    const { data: cats } = await supabase.from("book_categories").select("category_id").eq("book_id", bookId);
    const catIds = (cats ?? []).map((c) => c.category_id);
    if (!catIds.length) return [];
    const { data: peers } = await supabase.from("book_categories").select("book_id").in("category_id", catIds).neq("book_id", bookId).limit(60);
    const ids = [...new Set((peers ?? []).map((p) => p.book_id))];
    if (!ids.length) return [];
    const { data } = await supabase.from("v_books").select(CARD_COLUMNS).in("id", ids).order("sold_count", { ascending: false }).limit(limit);
    return (data ?? []) as BookCard[];
  },
  ["similar-books"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);

export interface ReviewRow {
  id: string;
  reviewer_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export const getBookReviews = unstable_cache(
  async (bookId: string, limit = 20): Promise<ReviewRow[]> => {
    const { data } = await createPublicClient()
      .from("reviews")
      .select("id, reviewer_name, rating, title, body, verified_purchase, helpful_count, created_at")
      .eq("book_id", bookId)
      .eq("status", "published")
      .order("helpful_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as ReviewRow[];
  },
  ["book-reviews"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

export interface QuestionRow {
  id: string;
  asker_name: string | null;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
}

export const getBookQuestions = unstable_cache(
  async (bookId: string, limit = 20): Promise<QuestionRow[]> => {
    const { data } = await createPublicClient()
      .from("book_questions")
      .select("id, asker_name, question, answer, answered_at, created_at")
      .eq("book_id", bookId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as QuestionRow[];
  },
  ["book-questions"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

/** Slugs for sitemap / static params. */
export async function getAllBookSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const { data } = await createPublicClient().from("books").select("slug, updated_at").eq("status", "active").order("updated_at", { ascending: false }).limit(5000);
  return (data ?? []) as { slug: string; updated_at: string }[];
}
