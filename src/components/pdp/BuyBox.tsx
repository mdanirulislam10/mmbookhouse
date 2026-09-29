"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Banknote, Bell, Check, MapPin, Store, Truck } from "lucide-react";
import { getDeliveryQuote } from "@/app/actions/delivery";
import { requestStockAlert } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { AddToCartButton, BuyNowButton } from "@/components/shop/AddToCartButton";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { Countdown } from "@/components/shop/Countdown";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import type { DeliveryQuote } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { pick } from "@/lib/i18n";

interface Props {
  book: { id: string; price: number; on_hand: number; in_stock: boolean; low_stock: boolean; deal_ends_at: string | null };
  maxQty: number;
  wished: boolean;
  alerted: boolean;
  defaultPin: string;
  codEnabled: boolean;
  pickupEnabled: boolean;
}

export function BuyBox({ book, maxQty, wished, alerted, defaultPin, codEnabled, pickupEnabled }: Props) {
  const { t, lang } = useT();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState(defaultPin);
  const [quote, setQuote] = useState<DeliveryQuote | null | undefined>(undefined);
  const [pinError, setPinError] = useState(false);
  const [checking, startCheck] = useTransition();
  const [alertOn, setAlertOn] = useState(alerted);
  const [alerting, startAlert] = useTransition();
  const limit = Math.max(Math.min(book.on_hand, maxQty), 1);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )mm_pin=(\d{6})/);
    if (m) setPin(m[1]);
  }, []);

  const check = (value = pin, q = qty) => {
    if (!/^[1-9][0-9]{5}$/.test(value)) {
      setPinError(true);
      setQuote(undefined);
      return;
    }
    setPinError(false);
    startCheck(async () => {
      const res = await getDeliveryQuote(value, book.price * q);
      if (res.ok) {
        setQuote(res.data ?? null);
        document.cookie = `mm_pin=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      }
    });
  };

  useEffect(() => {
    if (/^[1-9][0-9]{5}$/.test(pin)) check(pin, qty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty]);

  const remind = () =>
    startAlert(async () => {
      const res = await requestStockAlert(book.id);
      if (res.ok) return setAlertOn(true);
      if (res.error === "AUTH_REQUIRED") return router.push(`/login?next=${encodeURIComponent(path)}`);
      toast.error(errorMessage(lang, res.error));
    });

  return (
    <div className="card space-y-4 p-4">
      {book.deal_ends_at ? (
        <p className="rounded bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
          {t("book.dealEnds")} <Countdown to={book.deal_ends_at} />
        </p>
      ) : null}

      {book.in_stock ? (
        <>
          <p className={`text-lg font-semibold ${book.low_stock ? "text-amber-700" : "text-stock"}`}>{book.low_stock ? t("book.onlyLeft", { n: book.on_hand }) : t("book.inStock")}</p>
          <div className="flex items-center gap-3">
            <label htmlFor="qty" className="text-sm font-medium">
              {t("book.qtyLabel")}
            </label>
            <Select id="qty" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-9 w-20">
              {Array.from({ length: limit }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <AddToCartButton bookId={book.id} qty={qty} size="lg" className="w-full" />
            <BuyNowButton bookId={book.id} qty={qty} className="h-12 w-full text-base" />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-lg font-semibold text-red-600">{t("book.outOfStock")}</p>
          <Button variant="secondary" className="w-full" onClick={remind} disabled={alertOn || alerting}>
            {alertOn ? <Check size={16} /> : <Bell size={16} />}
            {alertOn ? t("book.notifyOn") : t("book.notifyMe")}
          </Button>
        </div>
      )}

      <WishlistButton bookId={book.id} initial={wished} label className="w-full justify-center" />

      <div className="space-y-2 border-t pt-3 text-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
          className="flex items-center gap-2"
        >
          <MapPin size={16} className="shrink-0 text-slate-500" />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            placeholder={t("nav.enterPincode")}
            aria-label={t("book.deliveryTo")}
            aria-invalid={pinError}
            className={`h-9 min-w-0 flex-1 rounded border px-2 ${pinError ? "border-red-500" : "border-slate-300"}`}
          />
          <Button type="submit" size="sm" variant="secondary" disabled={checking}>
            {t("book.checkPincode")}
          </Button>
        </form>

        {quote === null ? <p className="text-red-600">{t("book.notServiceable")}</p> : null}
        {quote ? (
          <ul className="space-y-1.5">
            <li className="flex gap-2">
              <Truck size={16} className="mt-0.5 shrink-0 text-slate-500" />
              <span>
                <strong>{pick(lang, quote.label, quote.label_bn)}</strong> · {t("book.deliveryBy", { min: quote.eta_min_days, max: quote.eta_max_days })} ·{" "}
                {quote.fee === 0 ? t("common.free") : t("book.deliveryFee", { fee: formatINR(quote.fee) })}
              </span>
            </li>
            <li className="flex gap-2 text-slate-600">
              <Banknote size={16} className="mt-0.5 shrink-0 text-slate-500" />
              {quote.cod_available && codEnabled ? t("book.codAvailable") : t("book.codNotAvailable")}
            </li>
          </ul>
        ) : null}
        {pickupEnabled ? (
          <p className="flex gap-2 text-slate-600">
            <Store size={16} className="mt-0.5 shrink-0 text-slate-500" />
            {t("book.pickupFree")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
