import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { getCategoryContext } from "@/lib/data/catalog";
import { Listing, type RawParams } from "@/components/shop/Listing";

type Props = { params: Promise<{ slug: string[] }>; searchParams: Promise<RawParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug.at(-1) ?? "";
  const ctx = await getCategoryContext(slug);
  if (!ctx) return { title: "Category" };
  return { title: ctx.category.name, description: `Buy ${ctx.category.name} books online from mmbookhouse.`, alternates: { canonical: `/category/${ctx.category.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const last = slug.at(-1) ?? "";
  const ctx = await getCategoryContext(decodeURIComponent(last));
  if (!ctx) notFound();
  const { t, lang } = await getT();
  const { category, trail, children } = ctx;
  const name = pick(lang, category.name, category.name_bn);

  return (
    <Listing
      basePath={`/category/${slug.join("/")}`}
      sp={await searchParams}
      category={category.id}
      defaultSort="popular"
      header={
        <>
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <Link href="/" className="link">{t("book.breadcrumbHome")}</Link>
            {trail.map((c, i) => (
              <span key={c.id} className="flex items-center gap-1">
                <ChevronRight size={14} />
                {i === trail.length - 1 ? <span className="text-slate-700">{pick(lang, c.name, c.name_bn)}</span> : <Link href={`/category/${c.slug}`} className="link">{pick(lang, c.name, c.name_bn)}</Link>}
              </span>
            ))}
          </nav>
          <h1 className="text-2xl font-bold">{t("page.category", { name })}</h1>
          {children.length ? (
            <div className="mt-3 flex flex-wrap gap-2" aria-label={t("list.subcategories")}>
              {children.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:border-brand-amber hover:bg-amber-50">
                  {pick(lang, c.name, c.name_bn)}
                </Link>
              ))}
            </div>
          ) : null}
        </>
      }
    />
  );
}
