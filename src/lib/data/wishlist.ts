import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/data/session";

/** Book ids the current user has wishlisted (empty for guests). */
export const getWishlistIds = cache(async (): Promise<Set<string>> => {
  const user = await getSessionUser();
  if (!user) return new Set();
  const supabase = await createClient();
  const { data } = await supabase.from("wishlist_items").select("book_id").eq("user_id", user.id);
  return new Set((data ?? []).map((r) => r.book_id as string));
});
