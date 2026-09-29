import Link from "next/link";
import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { BannersManager, BulkPriceTool, CouponsManager, DealsManager, type BannerRow, type CouponRow, type DealRow } from "@/components/admin/MarketingManagers";
import { PageHeader } from "@/components/admin/ui";
import { first, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff([]);
  const { t } = await getT();
  const raw = first((await searchParams).tab);
  const tab = raw === "banners" || raw === "deals" || raw === "prices" ? raw : "coupons";
  const service = createServiceClient();

  let body: React.ReactNode = null;
  if (tab === "coupons") {
    const { data } = await service.from("coupons").select("*").order("created_at", { ascending: false }).limit(200);
    body = <CouponsManager coupons={(data ?? []) as CouponRow[]} />;
  } else if (tab === "banners") {
    const { data } = await service.from("banners").select("*").order("sort_order").order("created_at", { ascending: false });
    body = <BannersManager banners={(data ?? []) as BannerRow[]} />;
  } else if (tab === "deals") {
    const { data } = await service.from("flash_deals").select("id, book_id, deal_price, ends_at, books(title, sale_price)").eq("is_active", true).gt("ends_at", new Date().toISOString()).order("ends_at");
    body = <DealsManager deals={((data ?? []) as any[]).map((d) => ({ id: d.id, book_id: d.book_id, title: d.books?.title ?? "", deal_price: Number(d.deal_price), sale_price: Number(d.books?.sale_price ?? 0), ends_at: d.ends_at })) as DealRow[]} />;
  } else {
    const [{ data: pubs }, { data: cats }] = await Promise.all([service.from("publishers").select("id, name").order("name").limit(1000), service.from("categories").select("id, name").order("name")]);
    body = <BulkPriceTool publishers={(pubs ?? []) as never} categories={(cats ?? []) as never} />;
  }

  const tabs = [
    { k: "coupons", l: t("admin.marketing.coupons") },
    { k: "banners", l: t("admin.marketing.banners") },
    { k: "deals", l: t("admin.marketing.deals") },
    { k: "prices", l: t("admin.marketing.prices") },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title={t("admin.nav.marketing")} />
      <nav className="flex gap-1 overflow-x-auto">
        {tabs.map((x) => <Link key={x.k} href={`/admin/marketing?tab=${x.k}`} className={cn("whitespace-nowrap rounded-full px-4 py-1.5 text-sm", x.k === tab ? "bg-brand-navy font-semibold text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>{x.l}</Link>)}
      </nav>
      {body}
    </div>
  );
}
