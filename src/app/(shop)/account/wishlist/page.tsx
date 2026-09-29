import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { AccountShell } from "@/components/account/AccountShell";
import { BookCard, BookGrid } from "@/components/shop/BookCard";
import type { BookCard as Book } from "@/lib/types";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const { t } = await getT();
  const supabase = await createClient();
  const { data: items } = await supabase.from("wishlist_items").select("book_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  const ids = (items ?? []).map((i) => i.book_id as string);
  let books: Book[] = [];
  if (ids.length) {
    const { data } = await supabase
      .from("v_books")
      .select("id, slug, title, title_bn, cover_url, mrp, price, discount_pct, rating_avg, rating_count, in_stock, low_stock, on_hand, author_names, author_names_bn, publisher_name, language, deal_ends_at")
      .in("id", ids);
    const byId = new Map((data ?? []).map((b) => [b.id as string, b as unknown as Book]));
    books = ids.map((id) => byId.get(id)).filter(Boolean) as Book[];
  }
  return (
    <AccountShell active="wishlist" title={t("account.wishlist")}>
      {books.length ? (
        <BookGrid>
          {books.map((b) => (
            <BookCard key={b.id} book={b} wished />
          ))}
        </BookGrid>
      ) : (
        <div className="card p-10 text-center">
          <Heart className="mx-auto mb-3 text-slate-300" size={48} />
          <h2 className="text-lg font-semibold">{t("account.wishlistEmpty")}</h2>
          <p className="mt-1 text-slate-500">{t("account.wishlistEmptyText")}</p>
        </div>
      )}
    </AccountShell>
  );
}
