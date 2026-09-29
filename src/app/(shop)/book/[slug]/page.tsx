import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { getBookBySlug, getBookQuestions, getBookReviews, getRelatedBooks, getSimilarByCategory } from "@/lib/data/catalog";
import { getSettings } from "@/lib/data/settings";
import { getSessionUser } from "@/lib/data/session";
import { getWishlistIds } from "@/lib/data/wishlist";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { Gallery } from "@/components/pdp/Gallery";
import { BuyBox } from "@/components/pdp/BuyBox";
import { FbtBundle } from "@/components/pdp/FbtBundle";
import { Reviews } from "@/components/pdp/Reviews";
import { Questions } from "@/components/pdp/Questions";
import { Shelf } from "@/components/shop/Shelf";
import { Price } from "@/components/shop/Price";
import { Stars } from "@/components/ui/Stars";
import { Badge } from "@/components/ui/Badge";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getBookBySlug(decodeURIComponent((await params).slug));
  if (!book) return { title: "Book not found" };
  const authors = book.authors.map((a) => a.name).join(", ");
  const description = (book.description ?? `${book.title}${authors ? ` by ${authors}` : ""} — buy online from mmbookhouse.`).slice(0, 200);
  return {
    title: book.title_bn ? `${book.title} (${book.title_bn})` : book.title,
    description,
    alternates: { canonical: `/book/${book.slug}` },
    openGraph: { title: book.title, description, type: "website", images: book.cover_url ? [{ url: book.cover_url }] : undefined },
  };
}

export default async function BookPage({ params }: Props) {
  const slug = decodeURIComponent((await params).slug);
  const book = await getBookBySlug(slug);
  if (!book) notFound();
  const { t, lang } = await getT();
  const user = await getSessionUser();

  const [settings, fbt, similar, reviews, questions, wished] = await Promise.all([
    getSettings(),
    getRelatedBooks(book.id, "fbt", 3),
    getSimilarByCategory(book.id, 12),
    getBookReviews(book.id),
    getBookQuestions(book.id),
    getWishlistIds(),
  ]);

  let alerted = false;
  if (user && !book.card.in_stock) {
    const supabase = await createClient();
    const { data } = await supabase.from("stock_alerts").select("book_id").eq("user_id", user.id).eq("book_id", book.id).maybeSingle();
    alerted = Boolean(data);
  }

  const title = pick(lang, book.title, book.title_bn);
  const description = pick(lang, book.description, book.description_bn);
  const authorLinks = book.authors.filter((a) => a.role === "author");
  const images = [book.cover_url, ...book.gallery].filter(Boolean) as string[];
  const c = book.card;

  const specs: [string, string | null][] = [
    [t("book.publisher"), book.publisher ? pick(lang, book.publisher.name, book.publisher.name_bn) : null],
    [t("book.language"), t(`book.lang.${book.language}` as "book.lang.bn")],
    [t("book.binding"), book.binding === "hardcover" ? t("book.hardcover") : t("book.paperback")],
    [t("book.pages"), book.pages ? t("book.pagesN", { n: book.pages }) : null],
    [t("book.edition"), [book.edition, book.edition_year].filter(Boolean).join(", ") || null],
    [t("book.isbn"), book.isbn],
    [t("book.classLevel"), book.class_level],
    [t("book.weight"), book.weight_g ? `${book.weight_g} g` : null],
    [t("book.condition"), book.condition === "used" ? t("book.used") : t("book.new")],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    ...(book.title_bn ? { alternateName: book.title_bn } : {}),
    url: `${publicEnv.siteUrl}/book/${book.slug}`,
    ...(book.cover_url ? { image: book.cover_url } : {}),
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(authorLinks.length ? { author: authorLinks.map((a) => ({ "@type": "Person", name: a.name })) } : {}),
    ...(book.publisher ? { publisher: { "@type": "Organization", name: book.publisher.name } } : {}),
    inLanguage: book.language,
    ...(c.rating_count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: c.rating_avg, reviewCount: c.rating_count } } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: c.price,
      availability: c.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${publicEnv.siteUrl}/book/${book.slug}`,
      itemCondition: book.condition === "used" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="container-page space-y-4 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="link">{t("book.breadcrumbHome")}</Link>
        {book.categories[0] ? (
          <>
            <ChevronRight size={14} />
            <Link href={`/category/${book.categories[0].slug}`} className="link">{pick(lang, book.categories[0].name, book.categories[0].name_bn)}</Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(280px,420px)_1fr_300px]">
        <Gallery title={title} images={images} preview={book.preview_pages} />

        <div className="min-w-0 space-y-3">
          <div>
            <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{title}</h1>
            {book.subtitle ? <p className="mt-1 text-slate-600">{book.subtitle}</p> : null}
            {authorLinks.length ? (
              <p className="mt-1 text-sm">
                {authorLinks.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 ? ", " : ""}
                    <Link href={`/search?q=${encodeURIComponent(a.name)}`} className="link">{pick(lang, a.name, a.name_bn)}</Link>
                  </span>
                ))}
              </p>
            ) : null}
          </div>

          {c.rating_count > 0 ? (
            <a href="#reviews" className="flex items-center gap-2 text-sm hover:underline">
              <span className="font-medium">{c.rating_avg.toFixed(1)}</span>
              <Stars value={c.rating_avg} size={16} />
              <span className="text-brand-teal">{t("reviews.count", { n: c.rating_count })}</span>
            </a>
          ) : null}

          <hr />
          <div className="space-y-1">
            <Price price={c.price} mrp={c.mrp} discountPct={c.discount_pct} size="lg" mrpLabel={t("book.mrp")} offLabel={t("book.save", { pct: c.discount_pct })} />
            <div className="flex flex-wrap gap-2 pt-1">
              {book.condition === "used" ? <Badge tone="amber">{t("book.used")}</Badge> : null}
              {c.discount_pct >= 5 ? <Badge tone="red">{t("book.off", { pct: c.discount_pct })}</Badge> : null}
            </div>
          </div>
          <hr />

          {description ? (
            <div>
              <h2 className="mb-1 text-lg font-semibold">{t("book.description")}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{description}</p>
            </div>
          ) : null}

          <div>
            <h2 className="mb-2 text-lg font-semibold">{t("book.details")}</h2>
            <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-1.5 text-sm">
              {specs
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <BuyBox
            book={{ id: c.id, price: c.price, on_hand: c.on_hand, in_stock: c.in_stock, low_stock: c.low_stock, deal_ends_at: c.deal_ends_at }}
            maxQty={settings.checkout.max_qty_per_item}
            wished={wished.has(book.id)}
            alerted={alerted}
            defaultPin={settings.store_profile.pincode}
            codEnabled={settings.payment.cod_enabled}
            pickupEnabled={settings.checkout.pickup_enabled}
          />
        </aside>
      </div>

      <FbtBundle main={c} others={fbt} />
      <Reviews bookId={book.id} avg={c.rating_avg} count={c.rating_count} reviews={reviews} />
      <Questions bookId={book.id} items={questions} />
      <Shelf title={t("book.similar")} books={similar} />
    </div>
  );
}
