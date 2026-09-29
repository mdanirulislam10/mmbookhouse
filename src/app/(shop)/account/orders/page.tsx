import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/data/session";
import { getMyOrders } from "@/lib/data/account";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/StatusBadge";
import { BookCover } from "@/components/ui/BookCover";
import { LinkButton } from "@/components/ui/Button";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireUser("/account/orders");
  const { t, lang } = await getT();
  const orders = await getMyOrders(100);

  return (
    <AccountShell active="orders" title={t("account.orders")}>
      {orders.length === 0 ? (
        <div className="card p-10 text-center">
          <Package className="mx-auto mb-3 text-slate-300" size={48} />
          <h2 className="text-lg font-semibold">{t("order.emptyTitle")}</h2>
          <p className="mt-1 text-slate-500">{t("order.emptyText")}</p>
          <LinkButton href="/" className="mt-4">{t("cart.continue")}</LinkButton>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-4 py-2.5 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-600">
                  <span>{t("order.placedOn", { date: formatDate(o.placed_at, lang) })}</span>
                  <span>{t("common.total")}: <strong className="text-brand-ink">{formatINR(o.total)}</strong></span>
                  <span>{t(`order.method.${o.payment_method}` as "order.method.cod")}</span>
                </div>
                <span className="font-mono text-xs text-slate-500">{o.order_no}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 4).map((it, i) => (
                    <div key={i} className="w-12 rounded ring-2 ring-white">
                      <BookCover src={it.cover_url} title={it.title} sizes="60px" />
                    </div>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{o.items.map((i) => i.title).join(", ")}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <OrderStatusBadge status={o.status} t={t} />
                    <PaymentStatusBadge status={o.payment_status} t={t} />
                  </div>
                </div>
                <Link href={`/account/orders/${o.id}`} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50">
                  {t("order.viewOrder")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
