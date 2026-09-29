"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { bulkSetStatus } from "@/app/admin/actions/orders";
import { useRun } from "@/components/admin/useRun";
import { Button } from "@/components/ui/Button";
import { Empty, Table, Td, Th } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/StatusBadge";
import { useT } from "@/lib/i18n/client";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { formatDate, formatINR } from "@/lib/utils";

export interface OrderTableRow {
  id: string;
  order_no: string;
  placed_at: string;
  ship_name: string;
  ship_phone: string;
  ship_city: string | null;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  fulfillment: string;
  channel: string;
  items: number;
  titles: string;
}

export function OrdersTable({ rows }: { rows: OrderTableRow[] }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const ids = [...sel];
  const all = rows.length > 0 && rows.every((r) => sel.has(r.id));

  const toggle = (id: string) => {
    const n = new Set(sel);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSel(n);
  };

  if (!rows.length) return <Empty>{t("admin.orders.none")}</Empty>;

  return (
    <div>
      {ids.length ? (
        <div className="no-print flex flex-wrap items-center gap-2 border-b bg-amber-50 px-4 py-2 text-sm">
          <strong>{t("admin.selected", { n: ids.length })}</strong>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => bulkSetStatus({ orderIds: ids, status: "processing" }), { success: t("admin.bulkDone"), onOk: () => setSel(new Set()) })}>
            {t("admin.orders.markPacking")}
          </Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => bulkSetStatus({ orderIds: ids, status: "ready" }), { success: t("admin.bulkDone"), onOk: () => setSel(new Set()) })}>
            {t("admin.orders.markReady")}
          </Button>
          {(["label", "slip", "invoice"] as const).map((type) => (
            <Link key={type} target="_blank" href={`/admin/print/${type}?ids=${ids.join(",")}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50">
              <Printer size={14} /> {t(`admin.print.${type}` as "admin.print.label")}
            </Link>
          ))}
        </div>
      ) : null}
      <Table>
        <thead>
          <tr>
            <Th className="w-8">
              <input type="checkbox" aria-label="Select all" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r.id)))} className="accent-amber-500" />
            </Th>
            <Th>{t("admin.col.order")}</Th>
            <Th>{t("admin.col.customer")}</Th>
            <Th>{t("admin.col.items")}</Th>
            <Th>{t("common.total")}</Th>
            <Th>{t("admin.col.payment")}</Th>
            <Th>{t("common.status")}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={sel.has(r.id) ? "bg-amber-50/60" : "hover:bg-slate-50"}>
              <Td>
                <input type="checkbox" aria-label={r.order_no} checked={sel.has(r.id)} onChange={() => toggle(r.id)} className="accent-amber-500" />
              </Td>
              <Td>
                <Link href={`/admin/orders/${r.id}`} className="link font-mono font-medium">
                  {r.order_no}
                </Link>
                <div className="text-xs text-slate-500">{formatDate(r.placed_at, lang, true)}</div>
              </Td>
              <Td>
                <div className="font-medium">{r.ship_name}</div>
                <div className="text-xs text-slate-500">
                  {r.ship_phone}
                  {r.ship_city ? ` · ${r.ship_city}` : ""}
                </div>
              </Td>
              <Td className="max-w-[240px]">
                <div className="truncate" title={r.titles}>
                  {r.titles}
                </div>
                <div className="text-xs text-slate-500">
                  {r.items} · {r.fulfillment === "pickup" ? t("order.fulfillment.pickup") : t("order.fulfillment.delivery")}
                </div>
              </Td>
              <Td className="whitespace-nowrap font-semibold">{formatINR(r.total)}</Td>
              <Td>
                <div className="flex flex-col items-start gap-1">
                  <PaymentStatusBadge status={r.payment_status} t={t} />
                  <span className="text-xs text-slate-500">{t(`order.method.${r.payment_method}` as "order.method.cod")}</span>
                </div>
              </Td>
              <Td>
                <OrderStatusBadge status={r.status} t={t} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
