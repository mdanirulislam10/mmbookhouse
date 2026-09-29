import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import type { BookCard as Book } from "@/lib/types";
import { BookCard } from "./BookCard";
import { getWishlistIds } from "@/lib/data/wishlist";

/** Titled horizontal shelf of books (scrolls on mobile). */
export async function Shelf({ title, books, href, right }: { title: string; books: Book[]; href?: string; right?: React.ReactNode }) {
  if (!books.length) return null;
  const { t } = await getT();
  const wished = await getWishlistIds();
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          {right}
        </div>
        {href ? (
          <Link href={href} className="link text-sm">
            {t("common.viewAll")}
          </Link>
        ) : null}
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {books.map((b) => (
          <div key={b.id} className="w-[44vw] max-w-[220px] shrink-0 snap-start sm:w-48 lg:w-52">
            <BookCard book={b} wished={wished.has(b.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
