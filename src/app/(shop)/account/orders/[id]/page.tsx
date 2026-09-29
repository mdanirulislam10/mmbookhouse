import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CheckCircle2, ExternalLink, KeyRound } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/data/session";
import { getMyOrder } from "@/lib/data/account";
import { getSettings } from "@/lib/data/settings";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { UpiPayBox } from "@/components/orders/UpiPayBox";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { BookCover } from "@/components/ui/BookCover";
import { first, formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  await requireUser(`/account/orders/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [data, settings, sp] = await Promise.all([getMyOrder(id), getSettings(), searchParams]);
  if (!data) notFound();
  const { order: o, items, events } = data;
  const { t, lang } = await getT();
  const justPlaced = first(sp.placed) === "1";

  const needsUpi = o.payment_method === "upi" && ["unpaid", "failed", "pending_verification"].includes(o.payment_status) && !["cancelled", "returned"].includes(o.status);
  let qr: string | null = null;
  let upiUrl = "";
  if (needsUpi && settings.payment.upi_id) {
    const params = new URLSearchParams({ pa: settings.payment.upi_id, pn: settings.payment.upi_payee_name, am: o.total.toFixed(2), cu: "INR", tn: o.order_no });
    upiUrl = `upi://pay?${params.toString()}`;
    qr = await QRCode.toDataURL(upiUrl, { margin: 1, width: 360 });
  }
  const canCancel = ["pending", "confirmed"].includes(o.status);

  return (
    <AccountShell active="orders" title={t("order.no", { no: o.order_no })}>
      {justPlaced ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="mt-0.5 shrink-0" size={22} />
          <div>
            <p className="font-bold">{t("order.placed")}</p>
            <p className="text-sm">{t("order.placedText", { no: o.order_no })}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {needsUpi ? (
            <UpiPayBox
              orderId={o.id}
              amount={o.total}
              upiId={settings.payment.upi_id}
              payee={settings.payment.upi_payee_name}
              upiUrl={upiUrl}
              qrDataUrl={qr}
              submitted={o.payment_status === "pending_verification"}
            />
          ) : null}

          <section className="card p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={o.status} t={t} />
              <PaymentStatusBadge status={o.payment_status} t={t} />
              <span className="text-sm text-slate-500">{t("order.placedOn", { date: formatDate(o.placed_at, lang, true) })}</span>
            </div>
            <OrderTimeline status={o.status} fulfillment={o.fulfillment} events={events} t={t} lang={lang} />
            {o.courier_name || o.awb ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                <p><span className="text-slate-500">{t("order.courier")}:</span> <strong>{o.courier_name ?? "—"}</strong></p>
                {o.awb ? <p><span className="text-slate-500">{t("order.awb")}:</span> <span className="font-mono">{o.awb}</span></p> : null}
                {o.tracking_url ? (
                  <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-flex items-center gap-1">
                    {t("order.trackLink")} <ExternalLink size={13} />
                  </a>
                ) : null}
              </div>
            ) : null}
            {o.fulfillment === "pickup" && o.pickup_otp && !["cancelled", "returned", "delivered"].includes(o.status) ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg border-2 border-dashed border-brand-amber bg-amber-50 p-4">
                <KeyRound className="text-amber-700" />
                <div>
                  <p className="text-sm text-slate-600">{t("order.pickupCode")}</p>
                  <p className="font-mono text-3xl font-bold tracking-[0.3em]">{o.pickup_otp}</p>
                  <p className="text-xs text-slate-500">{t("order.pickupCodeText")}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {canCancel ? <CancelOrderButton orderId={o.id} /> : null}
              {o.status !== "cancelled" ? <Link href={`/account/orders/${o.id}/invoice`} target="_blank" className="link text-sm">{t("order.invoice")}</Link> : null}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-lg font-bold">{t("order.items")}</h2>
            <ul className="divide-y">
              {items.map((it) => (
                <li key={it.id} className="flex gap-3 py-3">
                  <div className="w-16 shrink-0">
                    <BookCover src={it.cover_url} title={it.title} sizes="80px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {it.slug ? <Link href={`/book/${it.slug}`} className="font-medium hover:text-brand-tealHover">{it.title}</Link> : <p className="font-medium">{it.title}</p>}
                    <p className="text-sm text-slate-500">{formatINR(it.unit_price)} × {it.qty}</p>
                    {o.status === "delivered" && it.slug ? <Link href={`/book/${it.slug}#reviews`} className="link text-sm">{t("order.leaveReview")}</Link> : null}
                  </div>
                  <p className="font-semibold">{formatINR(it.line_total)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5 text-sm">
            <h2 className="mb-3 text-lg font-bold">{t("order.summary")}</h2>
            <dl className="space-y-1.5">
              <Row label={t("checkout.itemsTotal")} value={formatINR(o.subtotal)} />
              {o.discount_total > 0 ? <Row label={`${t("checkout.discount")}${o.coupon_code ? ` (${o.coupon_code})` : ""}`} value={`−${formatINR(o.discount_total)}`} tone="green" /> : null}
              <Row label={t("checkout.delivery")} value={o.delivery_fee === 0 ? t("common.free") : formatINR(o.delivery_fee)} />
              <div className="border-t pt-2">
                <Row label={t("checkout.orderTotal")} value={formatINR(o.total)} bold />
              </div>
            </dl>
          </section>
          <section className="card p-5 text-sm">
            <h2 className="mb-2 text-lg font-bold">{o.fulfillment === "pickup" ? t("order.fulfillment.pickup") : t("order.shipTo")}</h2>
            {o.fulfillment === "delivery" ? (
              <address className="not-italic leading-relaxed text-slate-700">
                <strong>{o.ship_name}</strong><br />
                {o.ship_line1}{o.ship_line2 ? `, ${o.ship_line2}` : ""}<br />
                {o.ship_landmark ? <>{o.ship_landmark}<br /></> : null}
                {o.ship_city}{o.ship_district ? `, ${o.ship_district}` : ""}, {o.ship_state} {o.ship_pincode}<br />
                {o.ship_phone}
              </address>
            ) : (
              <p className="text-slate-700">{settings.checkout.pickup_address}</p>
            )}
            <p className="mt-3 text-slate-500">{t("order.payment")}: {t(`order.method.${o.payment_method}` as "order.method.cod")}</p>
          </section>
        </aside>
      </div>
    </AccountShell>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "green" }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "text-base font-bold" : ""} ${tone === "green" ? "text-stock" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
