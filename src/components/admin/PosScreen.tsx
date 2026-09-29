"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Printer, Trash2 } from "lucide-react";
import { posSale } from "@/app/admin/actions/inventory";
import { BookPicker, type PickedBook } from "@/components/admin/BookPicker";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { formatINR } from "@/lib/utils";

interface Line {
  book: PickedBook;
  qty: number;
  price: number;
}

export function PosScreen() {
  const { t, lang } = useT();
  const toast = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [payment, setPayment] = useState<"cash" | "upi">("cash");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState<{ orderId: string; orderNo: string; total: number } | null>(null);
  const [pending, start] = useTransition();

  const total = lines.reduce((n, l) => n + l.price * l.qty, 0);

  const add = (b: PickedBook) => {
    if (b.on_hand < 1) return toast.error(t("err.OUT_OF_STOCK", { detail: b.title }));
    setDone(null);
    setLines((cur) => {
      const i = cur.findIndex((l) => l.book.id === b.id);
      if (i >= 0) return cur.map((l, j) => (j === i ? { ...l, qty: Math.min(l.qty + 1, b.on_hand) } : l));
      return [...cur, { book: b, qty: 1, price: b.price }];
    });
  };

  const complete = () =>
    start(async () => {
      const res = await posSale({ items: lines.map((l) => ({ bookId: l.book.id, qty: l.qty, unitPrice: l.price })), payment, customer, phone });
      if (!res.ok) return toast.error(errorMessage(lang, res.error, res.detail));
      setDone(res.data!);
      setLines([]);
      setCustomer("");
      setPhone("");
      toast.success(t("admin.pos.sold", { no: res.data!.orderNo }));
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <Panel title={t("admin.pos.cart")}>
        <BookPicker onPick={add} autoFocus placeholder={t("admin.pos.scan")} />
        {done ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 />
            <div className="flex-1">
              <p className="font-semibold">{t("admin.pos.sold", { no: done.orderNo })}</p>
              <p className="text-sm">{formatINR(done.total)}</p>
            </div>
            <Link target="_blank" href={`/admin/print/invoice?ids=${done.orderId}`} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium">
              <Printer size={14} /> {t("admin.print.invoice")}
            </Link>
          </div>
        ) : null}
        {lines.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{t("admin.pos.empty")}</p>
        ) : (
          <ul className="mt-3 divide-y">
            {lines.map((l, i) => (
              <li key={l.book.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.book.title}</p>
                  <p className="text-xs text-slate-500">{t("book.mrp")} {formatINR(l.book.mrp)} · {t("admin.col.onHand")} {l.book.on_hand}</p>
                </div>
                <label className="text-xs text-slate-500">
                  {t("common.price")}
                  <Input inputMode="decimal" value={l.price} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, price: Math.min(Number(e.target.value.replace(/[^\d.]/g, "")) || 0, l.book.mrp) } : x)))} className="h-8 w-24 text-right" />
                </label>
                <label className="text-xs text-slate-500">
                  {t("common.qty")}
                  <Input inputMode="numeric" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: Math.min(Math.max(Number(e.target.value.replace(/\D/g, "")) || 1, 1), l.book.on_hand) } : x)))} className="h-8 w-16 text-center" />
                </label>
                <p className="w-24 text-right font-semibold">{formatINR(l.price * l.qty)}</p>
                <button aria-label={t("common.delete")} onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t("admin.pos.payment")} className="lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3">
          <p className="text-3xl font-extrabold">{formatINR(total)}</p>
          <Select value={payment} onChange={(e) => setPayment(e.target.value as "cash" | "upi")}>
            <option value="cash">{t("order.method.cash")}</option>
            <option value="upi">{t("order.method.upi")}</option>
          </Select>
          <Input placeholder={t("admin.pos.customer")} value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={80} />
          <Input placeholder={t("common.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} />
          <Button size="lg" variant="buy" className="w-full" disabled={pending || lines.length === 0} onClick={complete}>
            {t("admin.pos.complete")}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
