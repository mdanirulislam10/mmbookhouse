import { Download } from "lucide-react";
import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { BarChart, Empty, PageHeader, Panel, StatCard, Table, Td, Th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { first, formatINR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

interface Report {
  totals: { orders: number; gross: number; discount: number; delivery: number; net: number; units: number; profit: number };
  by_day: { d: string; orders: number; net: number }[];
  by_hour: { h: number; orders: number; net: number }[];
  by_payment: { payment_method: string; orders: number; net: number }[];
  by_channel: { channel: string; orders: number; net: number }[];
  by_district: { district: string; orders: number; net: number }[];
  top_books: { title: string; qty: number; revenue: number }[];
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff([]);
  const sp = await searchParams;
  const { t, lang } = await getT();
  const today = new Date().toISOString().slice(0, 10);
  const from = DATE.test(first(sp.from) ?? "") ? first(sp.from)! : today.slice(0, 8) + "01";
  const to = DATE.test(first(sp.to) ?? "") ? first(sp.to)! : today;
  const service = createServiceClient();
  const [{ data: rep }, { data: dead }] = await Promise.all([
    service.rpc("admin_sales_report", { p_from: from, p_to: to }),
    service.rpc("admin_dead_stock", { p_days: 90, p_limit: 30 }),
  ]);
  const r = rep as Report | null;
  const qs = `from=${from}&to=${to}`;
  const hours = Array.from({ length: 24 }, (_, h) => ({ label: String(h), value: Number(r?.by_hour.find((x) => x.h === h)?.orders ?? 0) }));

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("admin.nav.reports")}
        actions={
          <form className="flex flex-wrap items-center gap-2" action="/admin/reports">
            <Input type="date" name="from" defaultValue={from} className="h-9 w-40" />
            <span>–</span>
            <Input type="date" name="to" defaultValue={to} className="h-9 w-40" />
            <button className={buttonClass("primary", "sm")}>{t("common.search")}</button>
          </form>
        }
      />
      {!r ? <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-700">{t("admin.dashboard.loadError")}</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label={t("admin.report.net")} value={formatINR(r.totals.net)} tone="good" />
            <StatCard label={t("admin.kpi.periodOrders")} value={String(r.totals.orders)} />
            <StatCard label={t("admin.report.units")} value={String(r.totals.units)} />
            <StatCard label={t("admin.report.discounts")} value={formatINR(r.totals.discount)} />
            <StatCard label={t("admin.kpi.profit")} value={formatINR(r.totals.profit)} hint={t("admin.report.profitHint")} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={t("admin.report.daily")}>
              {r.by_day.length ? <BarChart data={r.by_day.map((d) => ({ label: d.d.slice(5), value: Number(d.net) }))} format={formatINR} /> : <Empty>{t("admin.noSalesYet")}</Empty>}
            </Panel>
            <Panel title={t("admin.report.hourly")}>
              <BarChart data={hours} format={(n) => `${n}`} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title={t("admin.report.districts")} padded={false}>
              {r.by_district.length ? (
                <Table><tbody>{r.by_district.map((d) => <tr key={d.district}><Td>{d.district}</Td><Td>{d.orders}</Td><Td className="text-right">{formatINR(d.net)}</Td></tr>)}</tbody></Table>
              ) : <Empty>—</Empty>}
            </Panel>
            <Panel title={t("admin.report.payments")} padded={false}>
              <Table><tbody>{[...r.by_payment, ...r.by_channel.map((c) => ({ payment_method: `[${c.channel}]`, orders: c.orders, net: c.net }))].map((p) => <tr key={p.payment_method}><Td>{p.payment_method.toUpperCase()}</Td><Td>{p.orders}</Td><Td className="text-right">{formatINR(p.net)}</Td></tr>)}</tbody></Table>
            </Panel>
            <Panel title={t("admin.topBooks")} padded={false}>
              {r.top_books.length ? (
                <Table><tbody>{r.top_books.map((b) => <tr key={b.title}><Td className="max-w-[200px] truncate">{b.title}</Td><Td>×{b.qty}</Td><Td className="text-right">{formatINR(b.revenue)}</Td></tr>)}</tbody></Table>
              ) : <Empty>—</Empty>}
            </Panel>
          </div>
        </>
      )}

      <Panel title={t("admin.report.deadStock")} padded={false}>
        {(dead as { book_id: string; title: string; on_hand: number; cost_value: number; last_sold: string | null }[] | null)?.length ? (
          <Table>
            <thead><tr><Th>{t("admin.col.book")}</Th><Th>{t("admin.col.onHand")}</Th><Th>{t("admin.report.tiedUp")}</Th><Th>{t("admin.report.lastSold")}</Th></tr></thead>
            <tbody>
              {(dead as { book_id: string; title: string; on_hand: number; cost_value: number; last_sold: string | null }[]).map((d) => (
                <tr key={d.book_id}><Td>{d.title}</Td><Td>{d.on_hand}</Td><Td>{formatINR(d.cost_value)}</Td><Td>{d.last_sold ? formatDate(d.last_sold, lang) : t("admin.report.never")}</Td></tr>
              ))}
            </tbody>
          </Table>
        ) : <Empty>{t("admin.report.noDead")}</Empty>}
      </Panel>

      <Panel title={t("admin.report.downloads")}>
        <div className="flex flex-wrap gap-2">
          {[
            { k: "orders", l: t("admin.report.exportOrders") },
            { k: "gstr1", l: t("admin.report.exportGst") },
            { k: "inventory", l: t("admin.report.exportInventory") },
            { k: "customers", l: t("admin.report.exportCustomers") },
          ].map((d) => (
            <a key={d.k} href={`/api/admin/export/${d.k}?${qs}`} className={buttonClass("secondary", "sm")}><Download size={14} /> {d.l}</a>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{t("admin.report.gstNote")}</p>
      </Panel>
    </div>
  );
}
