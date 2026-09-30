import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, likeTerm } from "@/lib/admin/data";

export interface AdminBookRow {
  id: string;
  slug: string;
  title: string;
  title_bn: string | null;
  isbn: string | null;
  cover_url: string | null;
  mrp: number;
  sale_price: number;
  status: "draft" | "active" | "archived";
  is_featured: boolean;
  sold_count: number;
  updated_at: string;
  inventory: { on_hand: number; low_stock_threshold: number } | null;
  publishers: { name: string } | null;
}

export async function listBooks(opts: { q?: string; status?: string; category?: string; page: number }): Promise<{ rows: AdminBookRow[]; total: number }> {
  const service = createServiceClient();
  let ids: string[] | null = null;
  if (opts.category) {
    const { data } = await service.from("book_categories").select("book_id").eq("category_id", opts.category).limit(5000);
    ids = (data ?? []).map((r) => r.book_id as string);
  }
  let query = service
    .from("books")
    .select("id, slug, title, title_bn, isbn, cover_url, mrp, sale_price, status, is_featured, sold_count, updated_at, inventory(on_hand, low_stock_threshold), publishers(name)", { count: "exact" })
    .order("updated_at", { ascending: false });
  if (opts.status && ["draft", "active", "archived"].includes(opts.status)) query = query.eq("status", opts.status);
  if (ids) query = ids.length ? query.in("id", ids) : query.in("id", ["00000000-0000-0000-0000-000000000000"]);
  const term = opts.q ? likeTerm(opts.q) : "";
  if (term) query = query.or(`title.ilike.%${term}%,title_bn.ilike.%${term}%,isbn.ilike.%${term}%,slug.ilike.%${term}%,search_text.ilike.%${term.toLowerCase()}%`);
  const from = (opts.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) console.error("[admin] listBooks:", error.message);
  return { rows: (data ?? []) as unknown as AdminBookRow[], total: count ?? 0 };
}

export interface BookFormData {
  id: string;
  slug: string;
  title: string;
  title_bn: string;
  subtitle: string;
  description: string;
  description_bn: string;
  isbn: string;
  publisher: string;
  authors: string[];
  category_ids: string[];
  language: string;
  binding: string;
  condition: string;
  edition: string;
  edition_year: string;
  pages: string;
  weight_g: string;
  class_level: string;
  mrp: string;
  sale_price: string;
  cost_price: string;
  rack_location: string;
  supplier_note: string;
  on_hand: number;
  low_stock_threshold: string;
  hsn_code: string;
  cover_url: string;
  gallery: string[];
  preview_pages: string[];
  status: "draft" | "active" | "archived";
  is_featured: boolean;
  related: { id: string; title: string }[];
}

export async function getBookForEdit(id: string, withCost: boolean): Promise<BookFormData | null> {
  const service = createServiceClient();
  const { data: b } = await service
    .from("books")
    .select("*, publishers(name), book_authors(role, position, authors(name)), book_categories(category_id), inventory(on_hand, low_stock_threshold), book_private(cost_price, rack_location, supplier_note)")
    .eq("id", id)
    .maybeSingle();
  if (!b) return null;
  const r = b as Record<string, any>;
  const priv = Array.isArray(r.book_private) ? r.book_private[0] : r.book_private;
  const inv = Array.isArray(r.inventory) ? r.inventory[0] : r.inventory;
  const { data: rel } = await service.from("related_books").select("related_book_id, books:related_book_id(title)").eq("book_id", id).eq("kind", "fbt").order("position");
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    title_bn: s(r.title_bn),
    subtitle: s(r.subtitle),
    description: s(r.description),
    description_bn: s(r.description_bn),
    isbn: s(r.isbn),
    publisher: r.publishers?.name ?? "",
    authors: [...(r.book_authors ?? [])].filter((a: any) => a.role === "author").sort((x: any, y: any) => x.position - y.position).map((a: any) => a.authors?.name).filter(Boolean),
    category_ids: (r.book_categories ?? []).map((c: any) => c.category_id),
    language: r.language,
    binding: r.binding,
    condition: r.condition,
    edition: s(r.edition),
    edition_year: s(r.edition_year),
    pages: s(r.pages),
    weight_g: s(r.weight_g),
    class_level: s(r.class_level),
    mrp: s(r.mrp),
    sale_price: s(r.sale_price),
    cost_price: withCost ? s(priv?.cost_price) : "",
    rack_location: s(priv?.rack_location),
    supplier_note: s(priv?.supplier_note),
    on_hand: inv?.on_hand ?? 0,
    low_stock_threshold: s(inv?.low_stock_threshold ?? 5),
    hsn_code: s(r.hsn_code || "4901"),
    cover_url: s(r.cover_url),
    gallery: Array.isArray(r.gallery) ? r.gallery : [],
    preview_pages: Array.isArray(r.preview_pages) ? r.preview_pages : [],
    status: r.status,
    is_featured: r.is_featured,
    related: ((rel ?? []) as any[]).map((x) => ({ id: x.related_book_id, title: x.books?.title ?? "" })),
  };
}

export async function getFormLookups() {
  const service = createServiceClient();
  const [{ data: cats }, { data: pubs }, { data: auths }] = await Promise.all([
    service.from("categories").select("id, parent_id, name, name_bn, slug, is_active, sort_order").order("sort_order").order("name"),
    service.from("publishers").select("name, name_bn").order("name").limit(5000),
    service.from("authors").select("name, name_bn").order("name").limit(5000),
  ]);
  return {
    categories: (cats ?? []) as { id: string; parent_id: string | null; name: string; name_bn: string | null; slug: string; is_active: boolean; sort_order: number }[],
    publishers: (pubs ?? []) as { name: string; name_bn: string | null }[],
    authors: (auths ?? []) as { name: string; name_bn: string | null }[],
  };
}
