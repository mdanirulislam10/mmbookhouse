import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getProfile, requireUser } from "@/lib/data/session";
import { getCartLines } from "@/lib/data/cart";
import { getAddresses } from "@/lib/data/account";
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { CheckoutView, type CheckoutItem } from "@/components/checkout/CheckoutView";
import { first, toInt } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const buy = first(sp.buy);
  const qs = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
  const user = await requireUser(`/checkout${qs.toString() ? `?${qs}` : ""}`);
  const { t } = await getT();
  const [settings, addresses, profile] = await Promise.all([getSettings(), getAddresses(), getProfile()]);

  let items: CheckoutItem[] = [];
  let buyNow: { bookId: string; qty: number } | null = null;

  if (buy && /^[0-9a-f-]{36}$/i.test(buy)) {
    const supabase = await createClient();
    const { data: b } = await supabase.from("v_books").select("id, title, title_bn, cover_url, price, mrp, in_stock, on_hand").eq("id", buy).maybeSingle();
    if (b) {
      const qty = Math.min(Math.max(toInt(sp.qty, 1), 1), Math.max(b.on_hand, 1), settings.checkout.max_qty_per_item);
      buyNow = { bookId: b.id, qty };
      items = [{ book_id: b.id, title: b.title, title_bn: b.title_bn, cover_url: b.cover_url, price: Number(b.price), mrp: Number(b.mrp), qty, in_stock: b.in_stock }];
    }
  } else {
    const lines = (await getCartLines()).filter((l) => !l.saved_for_later);
    items = lines.map((l) => ({
      book_id: l.book_id,
      title: l.book.title,
      title_bn: l.book.title_bn,
      cover_url: l.book.cover_url,
      price: l.book.price,
      mrp: l.book.mrp,
      qty: Math.min(l.qty, Math.max(l.book.on_hand, 1)),
      in_stock: l.book.in_stock,
    }));
  }

  if (!items.length) redirect("/cart");

  return (
    <div className="container-page py-4">
      <h1 className="mb-4 text-2xl font-bold">{t("checkout.title")}</h1>
      <CheckoutView
        items={items}
        addresses={addresses}
        buyNow={buyNow}
        defaultName={profile?.full_name ?? user.fullName ?? ""}
        defaultPhone={profile?.phone ?? ""}
        settings={{
          codEnabled: settings.payment.cod_enabled,
          codMax: settings.payment.cod_max_order,
          upiEnabled: settings.payment.upi_enabled,
          upiConfigured: Boolean(settings.payment.upi_id),
          pickupEnabled: settings.checkout.pickup_enabled,
          pickupAddress: settings.checkout.pickup_address,
        }}
      />
    </div>
  );
}
