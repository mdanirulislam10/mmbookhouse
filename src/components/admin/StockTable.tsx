"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { adjustStock, setStock } from "@/app/admin/actions/inventory";
import { useRun } from "@/components/admin/useRun";
import { Empty, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import type { StockRow } from "@/lib/admin/inventory";

function Row({ r }: { r: StockRow }) {
  const { t } = useT();
  const { run, pending } = useRun();
  const [qty, setQty] = useState("");
  const low = r.on_hand <= r.threshold;

  const add = (sign: 1 | -1) => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) return;
    run(() => adjustStock({ bookId: r.book_id, delta: sign * n, reason: sign > 0 ? "restock" : "adjust" }), { onOk: () => setQty("") });
  };

  return (
    <tr className={r.on_hand === 0 ? "bg-red-50/50" : low ? "bg-amber-50/50" : ""}>
      <Td>
        <Link href={`/admin/books/${r.book_id}`} className="link line-clamp-1 font-medium">{r.title}</Link>
        <div className="text-xs text-slate-500">{r.isbn ?? "—"}</div>
      </Td>
      <Td>
        <span className={`text-lg font-bold ${r.on_hand === 0 ? "text-red-600" : low ? "text-amber-700" : ""}`}>{r.on_hand}</span>
        {r.on_hand === 0 ? <Badge tone="red" className="ml-2">{t("book.outOfStock")}</Badge> : low ? <Badge tone="amber" className="ml-2">{t("admin.lowStockBadge")}</Badge> : null}
      </Td>
      <Td>{r.threshold}</Td>
      <Td>{r.rack ?? "—"}</Td>
      <Td>
        <div className="flex items-center gap-1.5">
          <input
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            aria-label={t("admin.stock.qty")}
            className="h-8 w-16 rounded border border-slate-300 px-2 text-center text-sm"
            onKeyDown={(e) => e.key === "Enter" && add(1)}
          />
          <Button size="sm" variant="secondary" disabled={pending || !qty} onClick={() => add(1)} aria-label={t("admin.stock.add")}><Plus size={14} /></Button>
          <Button size="sm" variant="secondary" disabled={pending || !qty} onClick={() => add(-1)} aria-label={t("admin.stock.remove")}><Minus size={14} /></Button>
          <Button size="sm" variant="ghost" disabled={pending || qty === ""} onClick={() => run(() => setStock({ bookId: r.book_id, onHand: Number(qty) }), { onOk: () => setQty("") })}>{t("admin.stock.setTo")}</Button>
        </div>
      </Td>
    </tr>
  );
}

export function StockTable({ rows }: { rows: StockRow[] }) {
  const { t } = useT();
  if (!rows.length) return <Empty>{t("admin.inventory.none")}</Empty>;
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t("admin.col.book")}</Th>
          <Th>{t("admin.col.onHand")}</Th>
          <Th>{t("admin.col.threshold")}</Th>
          <Th>{t("admin.col.rack")}</Th>
          <Th>{t("admin.stock.adjust")}</Th>
        </tr>
      </thead>
      <tbody>{rows.map((r) => <Row key={r.book_id} r={r} />)}</tbody>
    </Table>
  );
}
