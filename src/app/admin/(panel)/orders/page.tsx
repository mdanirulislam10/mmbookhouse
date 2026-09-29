import Link from "next/link";
import { Search } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requireStaff } from "@/lib/data/session";
import { ORDER_TABS, listOrders, tabCounts, type OrderTab } from "@/lib/admin/orders";
import { PAGE_SIZE } from "@/lib/admin/data";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { PageHeader, Pager, Panel } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { first, toInt, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff(["dispatch_staff"]);
  const sp = await searchParams;
  const { t } = await getT();
  const tab = (ORDER_TABS as readonly string[]).includes(first(sp.tab) ?? "") ? (first(sp.tab) as OrderTab) : "all";
  const q = first(sp.q)?.trim() || undefined;
  const page = Math.max(toInt(sp.page, 1), 1);
  const [{ rows, total }, counts] = await Promise.all([listOrders({ tab, q, page }), tabCounts()]);
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div>
      <PageHeader title={t("admin.nav.orders")} actions={<Link href="/admin/inventory/pos" className={buttonClass("primary", "sm")}>{t("admin.pos.title")}</Link>} />
      <Panel padded={false}>
        <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none]" aria-label="Order tabs">
            {ORDER_TABS.map((k) => (
              <Link
                key={k}
                href={k === "all" ? "/admin/orders" : `/admin/orders?tab=${k}`}
                aria-current={k === tab}
                className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm", k === tab ? "bg-brand-navy font-semibold text-white" : "text-slate-600 hover:bg-slate-100")}
              >
                {t(`admin.tab.${k}` as "admin.tab.all")}
                <span className={cn("rounded-full px-1.5 text-xs", k === tab ? "bg-white/20" : "bg-slate-200", k === "verify" && counts[k] > 0 && k !== tab && "bg-amber-200 text-amber-900")}>{counts[k]}</span>
              </Link>
            ))}
          </nav>
          <form className="flex gap-2" action="/admin/orders">
            {tab !== "all" ? <input type="hidden" name="tab" value={tab} /> : null}
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder={t("admin.orders.searchPh")} className="h-9 w-full rounded-full border border-slate-300 pl-9 pr-3 text-sm lg:w-72" />
            </div>
          </form>
        </div>
        <OrdersTable
          rows={rows.map((o) => ({
            id: o.id,
            order_no: o.order_no,
            placed_at: o.placed_at,
            ship_name: o.ship_name,
            ship_phone: o.ship_phone,
            ship_city: o.ship_city,
            total: o.total,
            status: o.status,
            payment_status: o.payment_status,
            payment_method: o.payment_method,
            fulfillment: o.fulfillment,
            channel: o.channel,
            items: o.order_items.reduce((n, i) => n + i.qty, 0),
            titles: o.order_items.map((i) => i.title).join(", "),
          }))}
        />
        <Pager basePath="/admin/orders" params={{ tab: tab === "all" ? undefined : tab, q }} page={page} pages={pages} prev={t("common.previous")} next={t("common.next")} />
      </Panel>
    </div>
  );
}
