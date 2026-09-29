import Link from "next/link";
import { Search } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requireStaff } from "@/lib/data/session";
import { listMovements, listStock } from "@/lib/admin/inventory";
import { PAGE_SIZE } from "@/lib/admin/data";
import { StockTable } from "@/components/admin/StockTable";
import { Empty, PageHeader, Pager, Panel, Table, Td, Th } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { first, formatDate, toInt, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff(["inventory_manager"]);
  const sp = await searchParams;
  const { t, lang } = await getT();
  const filter = first(sp.filter) ?? "";
  const q = first(sp.q)?.trim() || undefined;
  const page = Math.max(toInt(sp.page, 1), 1);
  const isLog = filter === "log";

  const tabs = [
    { k: "", label: t("admin.tab.all") },
    { k: "low", label: t("admin.inventory.low") },
    { k: "out", label: t("book.outOfStock") },
    { k: "log", label: t("admin.inventory.log") },
  ];

  const stock = isLog ? null : await listStock({ q, filter, page });
  const log = isLog ? await listMovements(page) : null;
  const total = stock?.total ?? log?.total ?? 0;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div>
      <PageHeader title={t("admin.nav.inventory")} actions={<Link href="/admin/inventory/pos" className={buttonClass("primary", "sm")}>{t("admin.pos.title")}</Link>} />
      <Panel padded={false}>
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Link key={tab.k} href={tab.k ? `/admin/inventory?filter=${tab.k}` : "/admin/inventory"} className={cn("whitespace-nowrap rounded-full px-3 py-1.5 text-sm", tab.k === filter ? "bg-brand-navy font-semibold text-white" : "text-slate-600 hover:bg-slate-100")}>
                {tab.label}
              </Link>
            ))}
          </nav>
          {!isLog ? (
            <form action="/admin/inventory" className="relative">
              {filter ? <input type="hidden" name="filter" value={filter} /> : null}
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder={t("admin.books.searchPh")} className="h-9 w-full rounded-full border border-slate-300 pl-9 pr-3 text-sm sm:w-72" />
            </form>
          ) : null}
        </div>

        {stock ? <StockTable rows={stock.rows} /> : null}
        {log ? (
          log.rows.length ? (
            <Table>
              <thead><tr><Th>{t("common.date")}</Th><Th>{t("admin.col.book")}</Th><Th>{t("admin.stock.change")}</Th><Th>{t("admin.stock.reason")}</Th><Th>{t("common.notes")}</Th></tr></thead>
              <tbody>
                {log.rows.map((m) => (
                  <tr key={m.id}>
                    <Td className="whitespace-nowrap text-xs text-slate-500">{formatDate(m.created_at, lang, true)}</Td>
                    <Td>{m.books?.title ?? "—"}</Td>
                    <Td className={m.delta > 0 ? "font-semibold text-stock" : "font-semibold text-red-600"}>{m.delta > 0 ? `+${m.delta}` : m.delta}</Td>
                    <Td>{t(`admin.reason.${m.reason}` as "admin.reason.order")}</Td>
                    <Td className="text-slate-500">{m.note ?? ""}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Empty>{t("admin.inventory.none")}</Empty>
          )
        ) : null}
        <Pager basePath="/admin/inventory" params={{ filter: filter || undefined, q }} page={page} pages={pages} prev={t("common.previous")} next={t("common.next")} />
      </Panel>
    </div>
  );
}
