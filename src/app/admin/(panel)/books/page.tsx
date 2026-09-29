import Link from "next/link";
import { Plus, Search, Upload } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requireStaff } from "@/lib/data/session";
import { listBooks } from "@/lib/admin/books";
import { PAGE_SIZE } from "@/lib/admin/data";
import { getCategories } from "@/lib/data/catalog";
import { Empty, PageHeader, Pager, Panel, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { BookCover } from "@/components/ui/BookCover";
import { buttonClass } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { first, formatINR, toInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BooksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff(["inventory_manager"]);
  const sp = await searchParams;
  const { t } = await getT();
  const q = first(sp.q)?.trim() || undefined;
  const status = first(sp.status) || undefined;
  const category = first(sp.category) || undefined;
  const page = Math.max(toInt(sp.page, 1), 1);
  const [{ rows, total }, categories] = await Promise.all([listBooks({ q, status, category, page }), getCategories()]);
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div>
      <PageHeader
        title={t("admin.nav.books")}
        subtitle={t("admin.books.count", { n: total })}
        actions={
          <>
            <Link href="/admin/books/import" className={buttonClass("secondary", "sm")}><Upload size={14} /> {t("admin.books.import")}</Link>
            <Link href="/admin/books/new" className={buttonClass("primary", "sm")}><Plus size={14} /> {t("admin.books.new")}</Link>
          </>
        }
      />
      <Panel padded={false}>
        <form action="/admin/books" className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder={t("admin.books.searchPh")} className="h-9 w-full rounded-full border border-slate-300 pl-9 pr-3 text-sm" />
          </div>
          <Select name="status" defaultValue={status ?? ""} className="h-9 w-40">
            <option value="">{t("admin.books.allStatus")}</option>
            <option value="active">{t("admin.status.active")}</option>
            <option value="draft">{t("admin.status.draft")}</option>
            <option value="archived">{t("admin.status.archived")}</option>
          </Select>
          <Select name="category" defaultValue={category ?? ""} className="h-9 w-48">
            <option value="">{t("admin.books.allCategories")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}
          </Select>
          <button className={buttonClass("secondary", "sm")}>{t("common.search")}</button>
        </form>
        {rows.length === 0 ? (
          <Empty>{t("admin.books.none")}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("admin.col.book")}</Th>
                <Th>{t("common.price")}</Th>
                <Th>{t("admin.col.onHand")}</Th>
                <Th>{t("common.status")}</Th>
                <Th>{t("admin.col.sold")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const stock = b.inventory?.on_hand ?? 0;
                const low = stock <= (b.inventory?.low_stock_threshold ?? 5);
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/admin/books/${b.id}`} className="flex items-center gap-3">
                        <div className="w-10 shrink-0"><BookCover src={b.cover_url} title={b.title} sizes="50px" /></div>
                        <div className="min-w-0">
                          <div className="line-clamp-1 font-medium text-brand-teal hover:underline">{b.title}</div>
                          <div className="text-xs text-slate-500">{[b.title_bn, b.publishers?.name, b.isbn].filter(Boolean).join(" · ")}</div>
                        </div>
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="font-semibold">{formatINR(b.sale_price)}</span>
                      {b.mrp > b.sale_price ? <span className="ml-1.5 text-xs text-slate-400"><s>{formatINR(b.mrp)}</s></span> : null}
                    </Td>
                    <Td className={stock === 0 ? "font-bold text-red-600" : low ? "font-semibold text-amber-700" : ""}>{stock}</Td>
                    <Td>
                      <Badge tone={b.status === "active" ? "green" : b.status === "draft" ? "amber" : "neutral"}>{t(`admin.status.${b.status}` as "admin.status.active")}</Badge>
                    </Td>
                    <Td>{b.sold_count}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <Pager basePath="/admin/books" params={{ q, status, category }} page={page} pages={pages} prev={t("common.previous")} next={t("common.next")} />
      </Panel>
    </div>
  );
}
