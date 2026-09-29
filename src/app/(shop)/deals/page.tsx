import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { getDealBooks } from "@/lib/data/catalog";
import { getWishlistIds } from "@/lib/data/wishlist";
import { BookCard, BookGrid } from "@/components/shop/BookCard";
import { Countdown } from "@/components/shop/Countdown";

export const metadata: Metadata = { title: "Today's deals" };
export const revalidate = 60;

export default async function DealsPage() {
  const { t } = await getT();
  const [books, wished] = await Promise.all([getDealBooks(60), getWishlistIds()]);
  const next = books.map((b) => b.deal_ends_at).filter(Boolean).sort()[0];
  return (
    <div className="container-page py-4">
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold">{t("page.deals")}</h1>
        {next ? (
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            {t("home.endsIn")} <Countdown to={next} />
          </span>
        ) : null}
      </div>
      <p className="mb-4 text-slate-600">{t("page.dealsText")}</p>
      {books.length ? (
        <BookGrid>
          {books.map((b) => (
            <BookCard key={b.id} book={b} wished={wished.has(b.id)} />
          ))}
        </BookGrid>
      ) : (
        <p className="card p-10 text-center text-slate-500">{t("list.emptyTitle")}</p>
      )}
    </div>
  );
}
