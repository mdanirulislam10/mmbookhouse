import Link from "next/link";
import { BookOpen, Truck, Store, Banknote, ShieldCheck } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { getBestsellers, getCategories, getDealBooks, getFeatured, getHeroBanners, getNewArrivals } from "@/lib/data/catalog";
import { getSettings } from "@/lib/data/settings";
import { HeroCarousel } from "@/components/shop/HeroCarousel";
import { Shelf } from "@/components/shop/Shelf";
import { Countdown } from "@/components/shop/Countdown";

export const revalidate = 60;

export default async function HomePage() {
  const { t, lang } = await getT();
  const [banners, deals, bestsellers, newest, featured, categories, settings] = await Promise.all([
    getHeroBanners(),
    getDealBooks(12),
    getBestsellers(12),
    getNewArrivals(12),
    getFeatured(12),
    getCategories(),
    getSettings(),
  ]);

  const hero = banners.filter((b) => b.placement === "hero");
  const homeCats = (categories.filter((c) => c.show_on_home).length ? categories.filter((c) => c.show_on_home) : categories.filter((c) => !c.parent_id)).slice(0, 12);
  const nextDealEnd = deals.map((d) => d.deal_ends_at).filter(Boolean).sort()[0] ?? null;
  const store = settings.store_profile;
  const hasBooks = deals.length + bestsellers.length + newest.length + featured.length > 0;

  const promises = [
    { icon: Truck, title: t("home.promise.delivery"), text: t("home.promise.deliveryText") },
    { icon: Store, title: t("home.promise.pickup"), text: t("home.promise.pickupText") },
    { icon: Banknote, title: t("home.promise.cod"), text: t("home.promise.codText") },
    { icon: ShieldCheck, title: t("home.promise.genuine"), text: t("home.promise.genuineText") },
  ];

  return (
    <div className="container-page space-y-4 py-3 sm:py-4">
      {hero.length ? (
        <HeroCarousel banners={hero} />
      ) : (
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-navy to-[#2b3a4d] px-6 py-10 text-white sm:px-12 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{pick(lang, store.name, store.name_bn)}</h1>
            <p className="mt-3 text-base text-slate-200 sm:text-xl">{pick(lang, store.tagline, store.tagline_bn)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/search" className="rounded-full bg-brand-amber px-6 py-2.5 font-semibold text-brand-ink hover:bg-brand-amberHover">
                {t("common.search")}
              </Link>
              <Link href="/new-arrivals" className="rounded-full border border-white/40 px-6 py-2.5 font-medium hover:bg-white/10">
                {t("nav.newArrivals")}
              </Link>
            </div>
          </div>
          <BookOpen className="absolute -right-6 -top-6 hidden h-64 w-64 text-white/5 sm:block" strokeWidth={1} aria-hidden />
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Store promises">
        {promises.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="line-clamp-2 text-xs text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {homeCats.length ? (
        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 text-xl font-bold">{t("home.shopByCategory")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {homeCats.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="group flex flex-col items-center rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 text-center transition hover:border-brand-amber hover:shadow-card">
                <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy text-brand-amber transition group-hover:scale-110">
                  <BookOpen size={22} />
                </span>
                <span className="text-sm font-medium leading-tight">{pick(lang, c.name, c.name_bn)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Shelf
        title={t("home.dealsTitle")}
        books={deals}
        href="/deals"
        right={
          nextDealEnd ? (
            <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              {t("home.endsIn")} <Countdown to={nextDealEnd} />
            </span>
          ) : null
        }
      />
      <Shelf title={t("home.bestsellers")} books={bestsellers} href="/bestsellers" />
      <Shelf title={t("home.newArrivals")} books={newest} href="/new-arrivals" />
      <Shelf title={t("home.featured")} books={featured} />

      {!hasBooks ? (
        <section className="card p-10 text-center">
          <BookOpen className="mx-auto mb-3 text-slate-300" size={48} />
          <h2 className="text-lg font-semibold">{t("home.emptyTitle")}</h2>
          <p className="mt-1 text-slate-500">{t("home.emptyText")}</p>
        </section>
      ) : null}
    </div>
  );
}
