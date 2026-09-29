import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { requireStaff } from "@/lib/data/session";
import { canSeeMoney } from "@/lib/admin/permissions";
import { getCounters, getDashboard, getLowStock } from "@/lib/admin/data";
import { BarChart, Empty, PageHeader, Panel, StatCard, Table, Td, Th } from "@/components/admin/ui";
import { formatINR } from "@/lib/utils";
import { first } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const { t } = await getT();
  const money = canSeeMoney(staff.role);
  const [d, counters, low] = await Promise.all([getDashboard(30), getCounters(), getLowStock(8)]);
  const delta = d && d.yesterday.sales > 0 ? Math.round(((d.today.sales - d.yesterday.sales) / d.yesterday.sales) * 100) : null;

  return (
    <div className="space-y-4">
      <PageHeader title={t("admin.nav.dashboard")} subtitle={t("admin.dashboard.subtitle")} />
      {first(sp.denied) ? <p className="rounded-md bg-amber-100 px-4 py-2 text-sm text-amber-900">{t("admin.denied")}</p> : null}
      {!d ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t("admin.dashboard.loadError")}</p> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("admin.kpi.todaySales")} value={formatINR(d?.today.sales ?? 0)} hint={delta === null ? undefined : t("admin.kpi.vsYesterday", { pct: `${delta > 0 ? "+" : ""}${delta}` })} tone="good" />
        <StatCard label={t("admin.kpi.todayOrders")} value={String(d?.today.orders ?? 0)} href="/admin/orders" />
        <StatCard label={t("admin.kpi.toDispatch")} value={String(d?.to_dispatch ?? 0)} href="/admin/orders?tab=processing" tone={(d?.to_dispatch ?? 0) > 0 ? "warn" : "default"} />
        <StatCard label={t("admin.kpi.lowStock")} value={String(counters.low_stock)} href="/admin/inventory?filter=low" tone={counters.low_stock > 0 ? "bad" : "default"} />
      </div>

      {counters.verify_payments > 0 || counters.pending_orders > 0 ? (
        <Panel title={t("admin.needsAttention")}>
          <ul className="space-y-1.5 text-sm">
            {counters.pending_orders > 0 ? (
              <li>
                <Link className="link" href="/admin/orders?tab=pending">{t("admin.attn.pending", { n: counters.pending_orders })}</Link>
              </li>
            ) : null}
            {counters.verify_payments > 0 ? (
              <li>
                <Link className="link" href="/admin/orders?tab=verify">{t("admin.paymentsWaiting", { n: counters.verify_payments })}</Link>
              </li>
            ) : null}
          </ul>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("admin.chart.sales30")} className="lg:col-span-2">
          {d ? (
            <>
              <div className="mb-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                <span>{t("admin.kpi.periodSales")}: <strong>{formatINR(d.period.sales)}</strong></span>
                <span>{t("admin.kpi.periodOrders")}: <strong>{d.period.orders}</strong></span>
                <span>{t("admin.kpi.aov")}: <strong>{formatINR(d.period.aov)}</strong></span>
                {money ? <span>{t("admin.kpi.profit")}: <strong className="text-stock">{formatINR(d.period.profit)}</strong></span> : null}
              </div>
              <BarChart data={d.series.map((s) => ({ label: s.d.slice(5), value: Number(s.sales) }))} format={formatINR} />
            </>
          ) : null}
        </Panel>

        <Panel title={t("admin.topBooks")} padded={false}>
          {d?.top_books.length ? (
            <ol className="divide-y text-sm">
              {d.top_books.map((b, i) => (
                <li key={b.title} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-5 text-slate-400">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{b.title}</span>
                  <span className="text-slate-500">×{b.qty}</span>
                </li>
              ))}
            </ol>
          ) : (
            <Empty>{t("admin.noSalesYet")}</Empty>
          )}
        </Panel>
      </div>

      <Panel title={t("admin.lowStockTitle")} actions={<Link href="/admin/inventory?filter=low" className="link text-sm">{t("common.viewAll")}</Link>} padded={false}>
        {low.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t("admin.col.book")}</Th>
                <Th>{t("admin.col.onHand")}</Th>
                <Th>{t("admin.col.threshold")}</Th>
                <Th>{t("admin.col.rack")}</Th>
              </tr>
            </thead>
            <tbody>
              {low.map((b) => (
                <tr key={b.book_id}>
                  <Td><Link className="link" href={`/admin/books/${b.book_id}`}>{b.title}</Link></Td>
                  <Td className={b.on_hand === 0 ? "font-bold text-red-600" : "font-semibold text-amber-700"}>{b.on_hand}</Td>
                  <Td>{b.threshold}</Td>
                  <Td>{b.rack_location ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty>{t("admin.noLowStock")}</Empty>
        )}
      </Panel>
    </div>
  );
}
