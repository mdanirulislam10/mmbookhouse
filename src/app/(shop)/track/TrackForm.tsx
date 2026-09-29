"use client";

import { useState, useTransition } from "react";
import { trackOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderStatusBadge } from "@/components/orders/StatusBadge";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import type { OrderStatus } from "@/lib/types";
import { formatDate, formatINR } from "@/lib/utils";

interface Tracked {
  order_no: string;
  status: OrderStatus;
  fulfillment: "delivery" | "pickup";
  total: number;
  placed_at: string;
  courier_name: string | null;
  awb: string | null;
  tracking_url: string | null;
  events: { status: string; note: string | null; at: string }[];
  items: { title: string; qty: number }[];
}

export function TrackForm() {
  const { t, lang } = useT();
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Tracked | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(undefined);
    start(async () => {
      const res = await trackOrder(orderNo, phone);
      if (!res.ok) return setError(errorMessage(lang, res.error, res.detail));
      setResult((res.data as unknown as Tracked | null) ?? null);
    });
  };

  return (
    <div className="mt-5 space-y-5">
      <form onSubmit={submit} className="card grid gap-3 p-5 sm:grid-cols-2">
        <Field label={t("track.orderNo")} htmlFor="t-no">
          <Input id="t-no" value={orderNo} onChange={(e) => setOrderNo(e.target.value.toUpperCase())} placeholder="MMB-2609-01001" required className="font-mono" />
        </Field>
        <Field label={t("track.phone")} htmlFor="t-phone">
          <Input id="t-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("common.loading") : t("track.submit")}
          </Button>
        </div>
      </form>
      {error ? <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {result === null ? <p className="rounded bg-amber-50 px-4 py-3 text-amber-900">{t("track.notFound")}</p> : null}
      {result ? (
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="font-mono font-semibold">{result.order_no}</span>
            <OrderStatusBadge status={result.status} t={t} />
            <span className="text-sm text-slate-500">
              {formatDate(result.placed_at, lang)} · {formatINR(result.total)}
            </span>
          </div>
          <OrderTimeline
            status={result.status}
            fulfillment={result.fulfillment}
            events={result.events.map((e, i) => ({ id: i, status: e.status, note: e.note, created_at: e.at }))}
            t={t}
            lang={lang}
          />
          {result.awb ? (
            <p className="mt-4 text-sm">
              {result.courier_name}: <span className="font-mono">{result.awb}</span>
              {result.tracking_url ? (
                <>
                  {" "}
                  ·{" "}
                  <a className="link" href={result.tracking_url} target="_blank" rel="noopener noreferrer">
                    {t("order.trackLink")}
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
