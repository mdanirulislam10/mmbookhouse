"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { removeFromCart, setCartQty, setSavedForLater } from "@/app/actions/cart";
import { LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { BookCover } from "@/components/ui/BookCover";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { pick } from "@/lib/i18n";
import type { CartLine } from "@/lib/data/cart";
import { formatINR } from "@/lib/utils";
import { Price } from "@/components/shop/Price";

function Line({ line, maxQty, saved }: { line: CartLine; maxQty: number; saved: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const b = line.book;
  const title = pick(lang, b.title, b.title_bn);
  const limit = Math.max(Math.min(b.on_hand, maxQty), 1);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; detail?: string; data?: { capped?: boolean; qty?: number } }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(errorMessage(lang, res.error, res.detail));
      else if (res.data?.capped) toast.error(t("cart.stockChanged", { n: res.data.qty ?? 0 }));
      router.refresh();
    });

  return (
    <li className={`flex gap-3 py-4 ${pending ? "opacity-60" : ""}`}>
      <Link href={`/book/${b.slug}`} className="w-20 shrink-0 sm:w-24">
        <BookCover src={b.cover_url} title={title} sizes="100px" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/book/${b.slug}`} className="line-clamp-2 font-medium hover:text-brand-tealHover">
          {title}
        </Link>
        {b.author_names ? <p className="text-xs text-slate-500">{t("book.by", { authors: pick(lang, b.author_names, b.author_names_bn) })}</p> : null}
        <Price price={b.price} mrp={b.mrp} discountPct={b.discount_pct} offLabel={t("book.off", { pct: b.discount_pct })} />
        <p className={`text-xs font-medium ${b.in_stock ? "text-stock" : "text-red-600"}`}>{b.in_stock ? t("book.inStock") : t("cart.unavailable")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {!saved ? (
            <Select
              aria-label={t("book.qtyLabel")}
              className="h-8 w-20 py-0"
              value={Math.min(line.qty, limit)}
              disabled={!b.in_stock || pending}
              onChange={(e) => run(() => setCartQty(b.id, Number(e.target.value)))}
            >
              {Array.from({ length: limit }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          ) : null}
          <button className="link" disabled={pending} onClick={() => run(() => removeFromCart(b.id))}>
            {t("cart.remove")}
          </button>
          <button className="link" disabled={pending || (saved && !b.in_stock)} onClick={() => run(() => setSavedForLater(b.id, !saved))}>
            {saved ? t("cart.moveToCart") : t("cart.saveForLater")}
          </button>
        </div>
      </div>
      {!saved ? <p className="shrink-0 font-semibold">{formatINR(b.price * line.qty)}</p> : null}
    </li>
  );
}

export function CartView({ lines, maxQty }: { lines: CartLine[]; maxQty: number }) {
  const { t } = useT();
  const active = lines.filter((l) => !l.saved_for_later);
  const saved = lines.filter((l) => l.saved_for_later);
  const payable = active.filter((l) => l.book.in_stock);
  const items = payable.reduce((n, l) => n + l.qty, 0);
  const subtotal = payable.reduce((n, l) => n + l.book.price * l.qty, 0);
  const mrpTotal = payable.reduce((n, l) => n + l.book.mrp * l.qty, 0);
  const savings = mrpTotal - subtotal;

  if (!active.length && !saved.length) {
    return (
      <div className="card mx-auto max-w-xl p-10 text-center">
        <ShoppingBag className="mx-auto mb-3 text-slate-300" size={56} />
        <h1 className="text-xl font-bold">{t("cart.empty")}</h1>
        <p className="mt-1 text-slate-500">{t("cart.emptyText")}</p>
        <LinkButton href="/" size="lg" className="mt-5">
          {t("cart.continue")}
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <section className="card p-4 sm:p-5">
          <h1 className="border-b pb-3 text-2xl font-bold">{t("cart.title")}</h1>
          {active.length ? (
            <ul className="divide-y">
              {active.map((l) => (
                <Line key={l.book_id} line={l} maxQty={maxQty} saved={false} />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-slate-500">{t("cart.emptyText")}</p>
          )}
          {active.length ? (
            <p className="border-t pt-3 text-right text-lg">
              {t("cart.subtotalItems", { n: items })}: <strong>{formatINR(subtotal)}</strong>
            </p>
          ) : null}
        </section>

        {saved.length ? (
          <section className="card p-4 sm:p-5">
            <h2 className="border-b pb-3 text-xl font-bold">{t("cart.saved", { n: saved.length })}</h2>
            <ul className="divide-y">
              {saved.map((l) => (
                <Line key={l.book_id} line={l} maxQty={maxQty} saved />
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="card space-y-3 p-4">
          <p className="text-lg">
            {t("cart.subtotalItems", { n: items })}: <strong>{formatINR(subtotal)}</strong>
          </p>
          {savings > 0 ? <p className="text-sm font-medium text-stock">{t("cart.savings", { amount: formatINR(savings) })}</p> : null}
          <p className="text-xs text-slate-500">{t("cart.deliveryNote")}</p>
          <LinkButton href="/checkout" variant="buy" size="lg" className="w-full" aria-disabled={!payable.length} tabIndex={payable.length ? 0 : -1}>
            {t("cart.proceed")}
          </LinkButton>
          <LinkButton href="/" variant="ghost" size="sm" className="w-full">
            {t("cart.continue")}
          </LinkButton>
        </div>
      </aside>
    </div>
  );
}
