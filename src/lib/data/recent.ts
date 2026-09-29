import "server-only";
import { cookies } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { parseRecent, RECENT_COOKIE } from "@/lib/recent";
import type { BookCard } from "@/lib/types";

const CARD_COLUMNS =
  "id, slug, title, title_bn, cover_url, mrp, price, discount_pct, rating_avg, rating_count, in_stock, low_stock, on_hand, author_names, author_names_bn, publisher_name, language, deal_ends_at";

/** Books this visitor looked at recently, newest first. Draft/archived books are filtered out by the view. */
export async function getRecentlyViewed(excludeSlug?: string, limit = 12): Promise<BookCard[]> {
  const slugs = parseRecent((await cookies()).get(RECENT_COOKIE)?.value).filter((s) => s !== excludeSlug).slice(0, limit);
  if (!slugs.length) return [];
  const { data } = await createPublicClient().from("v_books").select(CARD_COLUMNS).in("slug", slugs);
  const bySlug = new Map((data ?? []).map((b) => [b.slug as string, b as BookCard]));
  return slugs.map((s) => bySlug.get(s)).filter((b): b is BookCard => Boolean(b));
}
