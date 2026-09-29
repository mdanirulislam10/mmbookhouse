"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, MapPin, Plus, QrCode, Store, Tag, Truck, X } from "lucide-react";
import { getDeliveryQuote } from "@/app/actions/delivery";
import { previewCoupon } from "@/app/actions/cart";
import { placeOrder } from "@/app/actions/orders";
import { AddressForm } from "@/components/account/AddressForm";
import { BookCover } from "@/components/ui/BookCover";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { pick } from "@/lib/i18n";
import type { Address, DeliveryQuote } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

export interface CheckoutItem {
  book_id: string;
  title: string;
  title_bn: string | null;
  cover_url: string | null;
  price: number;
  mrp: number;
  qty: number;
  in_stock: boolean;
}

interface Props {
  items: CheckoutItem[];
  addresses: Address[];
  buyNow: { bookId: string; qty: number } | null;
  defaultName: string;
  defaultPhone: string;
  settings: { codEnabled: boolean; codMax: number; upiEnabled: boolean; upiConfigured: boolean; pickupEnabled: boolean; pickupAddress: string };
}

export function CheckoutView({ items, addresses, buyNow, defaultName, defaultPhone, settings }: Props) {
  const { t, lang } = useT();
  const router = useRouter();
  const toast = useToast();
  const [placing, startPlace] = useTransition();
  const [, startQuote] = useTransition();

  const [addressId, setAddressId] = useState<string | null>(addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null);
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState<"cod" | "upi">(settings.codEnabled ? "cod" : "upi");
  const [quote, setQuote] = useState<DeliveryQuote | null | undefined>(undefined);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, startCoupon] = useTransition();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const address = addresses.find((a) => a.id === addressId) ?? null;
  const subtotal = useMemo(() => items.reduce((n, i) => n + i.price * i.qty, 0), [items]);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;

  // Delivery quote for the chosen address.
  useEffect(() => {
    if (fulfillment === "pickup" || !address) {
      setQuote(undefined);
      return;
    }
    startQuote(async () => {
      const res = await getDeliveryQuote(address.pincode, subtotal - discount);
      setQuote(res.ok ? res.data ?? null : undefined);
    });
  }, [address, fulfillment, subtotal, discount]);

  const fee = fulfillment === "pickup" ? 0 : quote?.fee ?? 0;
  const total = subtotal - discount + fee;
  const codAllowedHere = fulfillment === "pickup" || quote === undefined || quote?.cod_available === true;
  const codOk = settings.codEnabled && codAllowedHere && total <= settings.codMax;
  const upiOk = settings.upiEnabled && settings.upiConfigured;

  // Keep the payment choice valid as conditions change.
  useEffect(() => {
    if (payment === "cod" && !codOk && upiOk) setPayment("upi");
    if (payment === "upi" && !upiOk && codOk) setPayment("cod");
  }, [payment, codOk, upiOk]);

  const applyCoupon = () =>
    startCoupon(async () => {
      setCouponError(null);
      const res = await previewCoupon(couponInput, subtotal);
      if (!res.ok) return setCouponError(errorMessage(lang, res.error, res.detail));
      setCoupon(res.data!);
      toast.success(t("cart.couponApplied", { code: res.data!.code, amount: formatINR(res.data!.discount) }));
    });

  const canPlace =
    items.length > 0 &&
    items.every((i) => i.in_stock) &&
    (fulfillment === "pickup" || (address && quote)) &&
    ((payment === "cod" && codOk) || (payment === "upi" && upiOk));

  const place = () =>
    startPlace(async () => {
      setError(null);
      const res = await placeOrder({
        addressId: address?.id ?? null,
        paymentMethod: payment,
        fulfillment,
        coupon: coupon?.code,
        notes,
        buyNow: buyNow ?? undefined,
      });
      if (!res.ok) {
        const msg = errorMessage(lang, res.error, res.detail);
        setError(msg);
        toast.error(msg);
        return;
      }
      router.replace(`/account/orders/${res.data!.orderId}?placed=1`);
      router.refresh();
    });

  const choice = (active: boolean, disabled = false) =>
    cn("flex w-full items-start gap-3 rounded-lg border p-3 text-left transition", active ? "border-brand-amber bg-amber-50 ring-1 ring-brand-amber" : "border-slate-200 bg-white hover:border-slate-300", disabled && "cursor-not-allowed opacity-50");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Section n={1} title={t("checkout.step.delivery")}>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className={choice(fulfillment === "delivery")} onClick={() => setFulfillment("delivery")}>
              <Truck size={20} className="mt-0.5 shrink-0" />
              <span className="font-medium">{t("checkout.deliver")}</span>
            </button>
            <button type="button" className={choice(fulfillment === "pickup", !settings.pickupEnabled)} disabled={!settings.pickupEnabled} onClick={() => setFulfillment("pickup")}>
              <Store size={20} className="mt-0.5 shrink-0" />
              <span>
                <span className="block font-medium">{t("checkout.pickup")}</span>
                <span className="text-xs text-slate-600">{t("checkout.pickupText", { address: settings.pickupAddress })}</span>
              </span>
            </button>
          </div>
        </Section>

        {fulfillment === "delivery" ? (
          <Section n={2} title={t("checkout.step.address")}>
            {addingAddress ? (
              <AddressForm
                defaultName={defaultName}
                defaultPhone={defaultPhone}
                onCancel={addresses.length ? () => setAddingAddress(false) : undefined}
                onSaved={(id) => {
                  setAddressId(id);
                  setAddingAddress(false);
                  router.refresh();
                }}
              />
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={choice(a.id === addressId)}>
                    <input type="radio" name="address" checked={a.id === addressId} onChange={() => setAddressId(a.id)} className="mt-1 accent-amber-500" />
                    <span className="text-sm">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <MapPin size={14} /> {a.full_name} <span className="font-normal text-slate-500">({a.label})</span>
                      </span>
                      <span className="block text-slate-700">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                      </span>
                      <span className="text-slate-500">{a.phone}</span>
                    </span>
                  </label>
                ))}
                <button type="button" onClick={() => setAddingAddress(true)} className="link inline-flex items-center gap-1 text-sm">
                  <Plus size={14} /> {t("checkout.addAddress")}
                </button>
                {address && quote === null ? <p className="text-sm text-red-600">{t("err.NOT_SERVICEABLE")}</p> : null}
              </div>
            )}
          </Section>
        ) : null}

        <Section n={fulfillment === "delivery" ? 3 : 2} title={t("checkout.step.payment")}>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={!codOk} className={choice(payment === "cod", !codOk)} onClick={() => setPayment("cod")}>
              <Banknote size={20} className="mt-0.5 shrink-0" />
              <span>
                <span className="block font-medium">{t("checkout.cod")}</span>
                <span className="text-xs text-slate-600">
                  {!settings.codEnabled ? t("err.COD_DISABLED") : !codAllowedHere ? t("book.codNotAvailable") : total > settings.codMax ? t("checkout.codLimit", { amount: formatINR(settings.codMax) }) : t("checkout.codText")}
                </span>
              </span>
            </button>
            <button type="button" disabled={!upiOk} className={choice(payment === "upi", !upiOk)} onClick={() => setPayment("upi")}>
              <QrCode size={20} className="mt-0.5 shrink-0" />
              <span>
                <span className="block font-medium">{t("checkout.upi")}</span>
                <span className="text-xs text-slate-600">{upiOk ? t("checkout.upiText") : t("order.upiNotConfigured")}</span>
              </span>
            </button>
          </div>
        </Section>

        <Section n={fulfillment === "delivery" ? 4 : 3} title={t("checkout.step.review")}>
          {buyNow ? <p className="mb-2 text-sm font-medium text-amber-700">{t("checkout.buyNowOf")}</p> : null}
          <ul className="divide-y">
            {items.map((i) => (
              <li key={i.book_id} className="flex gap-3 py-3">
                <div className="w-14 shrink-0">
                  <BookCover src={i.cover_url} title={i.title} sizes="70px" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-medium">{pick(lang, i.title, i.title_bn)}</p>
                  <p className="text-slate-500">
                    {formatINR(i.price)} × {i.qty}
                  </p>
                  {!i.in_stock ? <p className="text-red-600">{t("cart.unavailable")}</p> : null}
                </div>
                <p className="font-semibold">{formatINR(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <label htmlFor="notes" className="mb-1 block text-sm font-medium">
              {t("checkout.notes")}
            </label>
            <Textarea id="notes" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="card space-y-3 p-4">
          <Button variant="buy" size="lg" className="w-full" disabled={!canPlace || placing} onClick={place}>
            {placing ? t("checkout.placing") : t("checkout.placeOrder")}
          </Button>
          {error ? (
            <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <p className="text-xs text-slate-500">{t("checkout.terms")}</p>

          <div className="border-t pt-3">
            {coupon ? (
              <p className="flex items-center justify-between rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <Tag size={14} /> {t("cart.couponApplied", { code: coupon.code, amount: formatINR(discount) })}
                </span>
                <button aria-label={t("cart.couponRemove")} onClick={() => setCoupon(null)}>
                  <X size={16} />
                </button>
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyCoupon();
                }}
                className="flex gap-2"
              >
                <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder={t("cart.coupon")} maxLength={24} className="h-9 flex-1 uppercase" aria-label={t("cart.coupon")} />
                <Button type="submit" size="sm" variant="secondary" disabled={couponBusy || couponInput.trim().length < 3}>
                  {t("cart.couponApply")}
                </Button>
              </form>
            )}
            {couponError ? <p className="mt-1 text-xs text-red-600">{couponError}</p> : null}
          </div>

          <dl className="space-y-1.5 border-t pt-3 text-sm">
            <Line label={`${t("checkout.itemsTotal")} (${items.reduce((n, i) => n + i.qty, 0)})`} value={formatINR(subtotal)} />
            {discount > 0 ? <Line label={t("checkout.discount")} value={`−${formatINR(discount)}`} tone="green" /> : null}
            <Line label={t("checkout.delivery")} value={fulfillment === "pickup" ? t("common.free") : quote ? (fee === 0 ? t("common.free") : formatINR(fee)) : "—"} />
            <div className="border-t pt-2 text-base font-bold">
              <Line label={t("checkout.orderTotal")} value={formatINR(total)} bold />
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-3 text-lg font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Line({ label, value, tone, bold }: { label: string; value: string; tone?: "green"; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", tone === "green" && "text-stock", bold && "font-bold")}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
