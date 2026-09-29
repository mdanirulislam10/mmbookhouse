import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/data/session";
import type { BookCard } from "@/lib/types";

export interface CartLine {
  book_id: string;
  qty: number;
  saved_for_later: boolean;
  book: BookCard;
}

/** Items in the (active) cart, for the header badge. */
export const getCartCount = cache(async (): Promise<number> => {
  const user = await getSessionUser();
  if (!user) return 0;
  const supabase = await createClient();
  const { data } = await supabase.from("cart_items").select("qty").eq("user_id", user.id).eq("saved_for_later", false);
  return (data ?? []).reduce((n, r) => n + (r.qty as number), 0);
});

/** Full cart with live prices/stock from v_books. */
export async function getCartLines(): Promise<CartLine[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("cart_items")
    .select("book_id, qty, saved_for_later, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (!items?.length) return [];
  const { data: books } = await supabase
    .from("v_books")
    .select(
      "id, slug, title, title_bn, cover_url, mrp, price, discount_pct, rating_avg, rating_count, in_stock, low_stock, on_hand, author_names, author_names_bn, publisher_name, language, deal_ends_at",
    )
    .in(
      "id",
      items.map((i) => i.book_id),
    );
  const byId = new Map((books ?? []).map((b) => [b.id as string, b as unknown as BookCard]));
  return items
    .map((i) => ({ book_id: i.book_id as string, qty: i.qty as number, saved_for_later: i.saved_for_later as boolean, book: byId.get(i.book_id as string)! }))
    .filter((l) => l.book); // books that were archived/unpublished drop out silently
}
