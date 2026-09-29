import Link from "next/link";
import { SlidersHorizontal, SearchX } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { getWishlistIds } from "@/lib/data/wishlist";
import { searchBooks, SORTS } from "@/lib/data/catalog";
import { first, toInt } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { BookCard, BookGrid } from "./BookCard";
import { SortSelect } from "./SortSelect";

export type RawParams = Record<string, string | string[] | undefined>;
const PAGE_SIZE = 24;
const LANGS = ["bn", "en", "hi", "ur", "sa"] as const;

export function parseFilters(sp: RawParams, defaults: { sort?: string } = {}) {
  const min = Number(first(sp.min));
  const max = Number(first(sp.max));
  const sort = first(sp.sort);
  return {
    q: first(sp.q)?.trim().slice(0, 100) || undefined,
    min: Number.isFinite(min) && first(sp.min) ? min : undefined,
    max: Number.isFinite(max) && first(sp.max) ? max : undefined,
    lang: LANGS.includes(first(sp.lang) as (typeof LANGS)[number]) ? first(sp.lang) : undefined,
    inStock: first(sp.stock) === "1",
    sort: SORTS.includes(sort as (typeof SORTS)[number]) ? (sort as string) : defaults.sort ?? "relevance",
    page: Math.max(toInt(sp.page, 1), 1),
  };
}

export async function Listing({
  basePath,
  sp,
  category,
  defaultSort,
  header,
  showSearchTerm = false,
}: {
  basePath: string;
  sp: RawParams;
  category?: string;
  defaultSort?: string;
  header: React.ReactNode;
  showSearchTerm?: boolean;
}) {
  const { t } = await getT();
  const f = parseFilters(sp, { sort: defaultSort });
  const [{ rows, total }, wished] = await Promise.all([
    searchBooks({ q: f.q, category, min: f.min, max: f.max, lang: f.lang, inStock: f.inStock, sort: f.sort, page: f.page, pageSize: PAGE_SIZE }),
    getWishlistIds(),
  ]);
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const keep: Record<string, string | undefined> = {
    q: f.q,
    sort: f.sort !== (defaultSort ?? "relevance") ? f.sort : undefined,
    min: f.min !== undefined ? String(f.min) : undefined,
    max: f.max !== undefined ? String(f.max) : undefined,
    lang: f.lang,
    stock: f.inStock ? "1" : undefined,
  };
  const hasFilters = Boolean(f.min !== undefined || f.max !== undefined || f.lang || f.inStock);

  const filters = (
    <form method="get" action={basePath} className="space-y-5 text-sm">
      {f.q ? <input type="hidden" name="q" value={f.q} /> : null}
      <input type="hidden" name="sort" value={f.sort} />
      <fieldset>
        <legend className="mb-2 font-semibold">{t("list.price")}</legend>
        <div className="flex items-center gap-2">
          <Input name="min" type="number" min={0} inputMode="numeric" placeholder={t("list.priceMin")} defaultValue={f.min} className="h-9" />
          <span>–</span>
          <Input name="max" type="number" min={0} inputMode="numeric" placeholder={t("list.priceMax")} defaultValue={f.max} className="h-9" />
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">{t("list.language")}</legend>
        <Select name="lang" defaultValue={f.lang ?? ""} className="h-9">
          <option value="">{t("common.all")}</option>
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {t(`book.lang.${l}` as "book.lang.bn")}
            </option>
          ))}
        </Select>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">{t("list.availability")}</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="stock" value="1" defaultChecked={f.inStock} className="h-4 w-4 accent-amber-500" />
          {t("list.inStockOnly")}
        </label>
      </fieldset>
      <div className="flex gap-2">
        <Button type="submit" size="sm">{t("list.apply")}</Button>
        {hasFilters ? (
          <Link href={f.q ? `${basePath}?q=${encodeURIComponent(f.q)}` : basePath} className="inline-flex h-8 items-center px-2 text-brand-teal hover:underline">
            {t("list.clear")}
          </Link>
        ) : null}
      </div>
    </form>
  );

  return (
    <div className="container-page py-4">
      {header}
      <div className="mt-3 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-32 p-4">
            <h2 className="mb-3 font-semibold">{t("list.filters")}</h2>
            {filters}
          </div>
        </aside>
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-sm text-slate-600">
              {showSearchTerm && f.q ? <span className="mr-1 font-medium text-brand-ink">{t("list.resultsFor", { q: f.q })} ·</span> : null}
              {t("list.showing", { count: total })}
            </p>
            <div className="flex items-center gap-2">
              <details className="relative lg:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm">
                  <SlidersHorizontal size={14} /> {t("list.filters")}
                </summary>
                <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border bg-white p-4 shadow-pop">{filters}</div>
              </details>
              <SortSelect current={f.sort} basePath={basePath} keep={keep} options={SORTS.map((s) => ({ value: s, label: t(`sort.${s}` as "sort.relevance") }))} label={t("list.sortBy")} />
            </div>
          </div>

          {rows.length ? (
            <BookGrid>
              {rows.map((b, i) => (
                <BookCard key={b.id} book={b} wished={wished.has(b.id)} priority={i < 4} />
              ))}
            </BookGrid>
          ) : (
            <div className="card p-10 text-center">
              <SearchX className="mx-auto mb-3 text-slate-300" size={48} />
              <h2 className="text-lg font-semibold">{t("list.emptyTitle")}</h2>
              <p className="mt-1 text-slate-500">{t("list.emptyText")}</p>
            </div>
          )}

          <Pagination basePath={basePath} params={keep} page={Math.min(f.page, pages)} pages={pages} labels={{ previous: t("common.previous"), next: t("common.next") }} />
        </div>
      </div>
    </div>
  );
}
