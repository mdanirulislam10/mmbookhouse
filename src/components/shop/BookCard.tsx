import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import type { BookCard as Book } from "@/lib/types";
import { BookCover } from "@/components/ui/BookCover";
import { Stars } from "@/components/ui/Stars";
import { Badge } from "@/components/ui/Badge";
import { Price } from "./Price";
import { AddToCartButton } from "./AddToCartButton";
import { WishlistButton } from "./WishlistButton";

export async function BookCard({ book, wished = false, priority = false }: { book: Book; wished?: boolean; priority?: boolean }) {
  const { t, lang } = await getT();
  const title = pick(lang, book.title, book.title_bn);
  const authors = pick(lang, book.author_names, book.author_names_bn);
  return (
    <article className="card group relative flex h-full flex-col p-3 transition-shadow hover:shadow-pop">
      <div className="absolute right-2 top-2 z-10">
        <WishlistButton bookId={book.id} initial={wished} />
      </div>
      <Link href={`/book/${book.slug}`} className="block" aria-label={title}>
        <div className="relative">
          <BookCover src={book.cover_url} title={title} priority={priority} className="transition-transform duration-300 group-hover:scale-[1.02]" />
          {book.discount_pct >= 5 && book.in_stock ? <Badge tone="red" className="absolute left-0 top-0 rounded-br">{t("book.off", { pct: book.discount_pct })}</Badge> : null}
        </div>
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <Link href={`/book/${book.slug}`} className="line-clamp-2 text-sm font-medium leading-snug text-brand-ink hover:text-brand-tealHover">
          {title}
        </Link>
        {authors ? <p className="line-clamp-1 text-xs text-slate-500">{t("book.by", { authors })}</p> : null}
        {book.rating_count > 0 ? (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Stars value={book.rating_avg} size={13} />
            <span>({book.rating_count})</span>
          </div>
        ) : null}
        <Price price={book.price} mrp={book.mrp} discountPct={book.discount_pct} offLabel={t("book.off", { pct: book.discount_pct })} />
        <p className={`text-xs font-medium ${book.in_stock ? (book.low_stock ? "text-amber-700" : "text-stock") : "text-red-600"}`}>
          {book.in_stock ? (book.low_stock ? t("book.onlyLeft", { n: book.on_hand }) : t("book.inStock")) : t("book.outOfStock")}
        </p>
        <div className="mt-auto pt-2">
          <AddToCartButton bookId={book.id} disabled={!book.in_stock} size="sm" className="w-full" />
        </div>
      </div>
    </article>
  );
}

export function BookGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{children}</div>;
}
