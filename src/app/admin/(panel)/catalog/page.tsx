import Link from "next/link";
import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { CatalogManager } from "@/components/admin/CatalogManager";
import { PageHeader } from "@/components/admin/ui";
import { first, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff(["inventory_manager"]);
  const sp = await searchParams;
  const { t } = await getT();
  const raw = first(sp.tab);
  const tab = raw === "authors" || raw === "publishers" ? raw : "categories";
  const service = createServiceClient();
  const [{ data: cats }, { data: authors }, { data: pubs }] = await Promise.all([
    service.from("categories").select("id, parent_id, name, name_bn, sort_order, show_on_home, is_active, slug").order("sort_order").order("name"),
    tab === "authors" ? service.from("authors").select("id, name, name_bn").order("name").limit(5000) : Promise.resolve({ data: [] }),
    tab === "publishers" ? service.from("publishers").select("id, name, name_bn").order("name").limit(5000) : Promise.resolve({ data: [] }),
  ]);
  const tabs = [
    { k: "categories", l: t("admin.book.categories") },
    { k: "authors", l: t("admin.book.authors") },
    { k: "publishers", l: t("book.publisher") },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title={t("admin.nav.catalog")} />
      <nav className="flex gap-1">
        {tabs.map((x) => (
          <Link key={x.k} href={`/admin/catalog?tab=${x.k}`} className={cn("rounded-full px-4 py-1.5 text-sm", x.k === tab ? "bg-brand-navy font-semibold text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>{x.l}</Link>
        ))}
      </nav>
      <CatalogManager tab={tab} categories={(cats ?? []) as never} authors={(authors ?? []) as never} publishers={(pubs ?? []) as never} />
    </div>
  );
}
