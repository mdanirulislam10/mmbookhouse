import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requireStaff } from "@/lib/data/session";
import { canSeeMoney } from "@/lib/admin/permissions";
import { getOrderDetail } from "@/lib/admin/orders";
import { OrderActions } from "@/components/admin/OrderActions";
import { PageHeader, Panel, Table, Td, Th } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { BookCover } from "@/components/ui/BookCover";
import { formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(["dispatch_staff"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const money = canSeeMoney(staff.role);
  const data = await getOrderDetail(id, money);
  if (!data) notFound();
  const { order: o, items, events, payments } = data;
  const { t, lang } = await getT();
  const cost = items.reduce((n, i) => n + (i.unit_cost ?? 0) * i.qty, 0);
  const utr = payments.map((p) => p.utr).filter(Boolean).at(-1) ?? null;

  return (
    <div className="space-y-4">
      <Link href="/admin/orders" className="link inline-flex items-center gap-1 text-sm">
        <ArrowLeft size={14} /> {t("admin.nav.orders")}
      </Link>
      <PageHeader
        title={o.order_no}
        subtitle={formatDate(o.placed_at, lang, true)}
        actions={
          <>
            <OrderStatusBadge status={o.status} t={t} />
            <PaymentStatusBadge status={o.payment_status} t={t} />
            {(["label", "slip", "invoice"] as const).map((type) => (
              <Link key={type} target="_blank" href={`/admin/print/${type}?ids=${o.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50">
                <Printer size={14} /> {t(`admin.print.${type}` as "admin.print.label")}
              </Link>
            ))}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Panel title={t("order.items")} padded={false}>
            <Table>
              <thead>
                <tr>
                  <Th>{t("admin.col.book")}</Th>
                  <Th>{t("admin.col.rack")}</Th>
                  <Th>{t("common.price")}</Th>
                  <Th>{t("common.qty")}</Th>
                  <Th>{t("common.total")}</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 shrink-0">
                          <BookCover src={i.cover_url} title={i.title} sizes="50px" />
                        </div>
                        <div className="min-w-0">
                          {i.book_id ? <Link href={`/admin/books/${i.book_id}`} className="link line-clamp-2 font-medium">{i.title}</Link> : <span className="font-medium">{i.title}</span>}
                          {i.isbn ? <div className="font-mono text-xs text-slate-500">{i.isbn}</div> : null}
                        </div>
                      </div>
                    </Td>
                    <Td>{i.rack_location ?? "—"}</Td>
                    <Td>{formatINR(i.unit_price)}</Td>
                    <Td>{i.qty}</Td>
                    <Td className="font-semibold">{formatINR(i.line_total)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <dl className="ml-auto max-w-xs space-y-1 p-4 text-sm">
              <div className="flex justify-between"><dt>{t("checkout.itemsTotal")}</dt><dd>{formatINR(o.subtotal)}</dd></div>
              {o.discount_total > 0 ? <div className="flex justify-between text-stock"><dt>{t("checkout.discount")} {o.coupon_code ? `(${o.coupon_code})` : ""}</dt><dd>−{formatINR(o.discount_total)}</dd></div> : null}
              <div className="flex justify-between"><dt>{t("checkout.delivery")}</dt><dd>{formatINR(o.delivery_fee)}</dd></div>
              <div className="flex justify-between border-t pt-1 text-base font-bold"><dt>{t("checkout.orderTotal")}</dt><dd>{formatINR(o.total)}</dd></div>
              {money && cost > 0 ? (
                <div className="flex justify-between border-t pt-1 text-xs text-slate-500"><dt>{t("admin.order.estProfit")}</dt><dd className="font-semibold text-stock">{formatINR(o.subtotal - o.discount_total - cost)}</dd></div>
              ) : null}
            </dl>
          </Panel>

          <Panel title={t("order.timeline")}>
            <OrderTimeline status={o.status} fulfillment={o.fulfillment} events={events.map((e) => ({ ...e, note: [e.note, e.actor_name ? `— ${e.actor_name}` : ""].filter(Boolean).join(" ") || null }))} t={t} lang={lang} />
          </Panel>
        </div>

        <div className="space-y-4">
          <OrderActions
            orderId={o.id}
            status={o.status}
            fulfillment={o.fulfillment}
            paymentStatus={o.payment_status}
            paymentMethod={o.payment_method}
            utr={utr}
            courier={o.courier_name}
            awb={o.awb}
            trackingUrl={o.tracking_url}
          />

          <Panel title={t("admin.order.customer")}>
            <dl className="space-y-1 text-sm">
              <div><dt className="text-xs text-slate-500">{t("common.name")}</dt><dd className="font-medium">{o.ship_name}</dd></div>
              <div><dt className="text-xs text-slate-500">{t("common.phone")}</dt><dd><a className="link" href={`tel:${o.ship_phone}`}>{o.ship_phone}</a></dd></div>
              {o.customer_email ? <div><dt className="text-xs text-slate-500">{t("common.email")}</dt><dd>{o.customer_email}</dd></div> : null}
              {o.fulfillment === "delivery" ? (
                <div>
                  <dt className="text-xs text-slate-500">{t("order.shipTo")}</dt>
                  <dd>
                    {o.ship_line1}{o.ship_line2 ? `, ${o.ship_line2}` : ""}<br />
                    {o.ship_landmark ? <>{o.ship_landmark}<br /></> : null}
                    {o.ship_city}{o.ship_district ? `, ${o.ship_district}` : ""}, {o.ship_state} {o.ship_pincode}
                  </dd>
                </div>
              ) : (
                <div><dt className="text-xs text-slate-500">{t("order.fulfillment.pickup")}</dt><dd>{o.status === "delivered" ? t("status.delivered") : t("admin.order.awaitingPickup")}</dd></div>
              )}
              {o.notes ? <div><dt className="text-xs text-slate-500">{t("common.notes")}</dt><dd className="rounded bg-amber-50 p-2">{o.notes}</dd></div> : null}
            </dl>
          </Panel>

          <Panel title={t("order.payment")} padded={false}>
            <ul className="divide-y text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span>
                    {p.method.toUpperCase()} · {formatINR(p.amount)}
                    {p.utr ? <span className="ml-2 font-mono text-xs text-slate-500">{p.utr}</span> : null}
                  </span>
                  <span className="text-xs font-medium text-slate-600">{p.status}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
