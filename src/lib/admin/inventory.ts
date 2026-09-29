import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, likeTerm } from "@/lib/admin/data";

export interface StockRow {
  book_id: string;
  title: string;
  isbn: string | null;
  status: string;
  on_hand: number;
  threshold: number;
  rack: string | null;
}

export async function listStock(opts: { q?: string; filter?: string; page: number }): Promise<{ rows: StockRow[]; total: number }> {
  const service = createServiceClient();
  let query = service
    .from("inventory")
    .select("book_id, on_hand, low_stock_threshold, books!inner(title, isbn, status, search_text, book_private(rack_location))", { count: "exact" })
    .neq("books.status", "archived");
  const term = opts.q ? likeTerm(opts.q) : "";
  if (term) query = query.or(`title.ilike.%${term}%,isbn.ilike.%${term}%,search_text.ilike.%${term.toLowerCase()}%`, { referencedTable: "books" });
  if (opts.filter === "out") query = query.eq("on_hand", 0);
  const from = (opts.page - 1) * PAGE_SIZE;

  if (opts.filter === "low") {
    // Column-to-column comparison isn't available in PostgREST filters: use the SQL helper.
    const { data } = await service.rpc("admin_low_stock", { p_limit: 500 });
    const all = (data ?? []) as { book_id: string; title: string; on_hand: number; threshold: number; rack_location: string | null }[];
    const filtered = term ? all.filter((r) => r.title.toLowerCase().includes(term.toLowerCase())) : all;
    return {
      total: filtered.length,
      rows: filtered.slice(from, from + PAGE_SIZE).map((r) => ({ book_id: r.book_id, title: r.title, isbn: null, status: "active", on_hand: r.on_hand, threshold: r.threshold, rack: r.rack_location })),
    };
  }

  const { data, count, error } = await query.order("on_hand", { ascending: true }).range(from, from + PAGE_SIZE - 1);
  if (error) console.error("[admin] listStock:", error.message);
  return {
    total: count ?? 0,
    rows: ((data ?? []) as any[]).map((r) => {
      const priv = Array.isArray(r.books.book_private) ? r.books.book_private[0] : r.books.book_private;
      return { book_id: r.book_id, title: r.books.title, isbn: r.books.isbn, status: r.books.status, on_hand: r.on_hand, threshold: r.low_stock_threshold, rack: priv?.rack_location ?? null };
    }),
  };
}

export async function listMovements(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await createServiceClient()
    .from("stock_movements")
    .select("id, delta, reason, note, created_at, books(title), order_id", { count: "exact" })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  return { rows: (data ?? []) as any[], total: count ?? 0 };
}
