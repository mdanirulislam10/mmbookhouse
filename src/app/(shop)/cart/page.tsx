import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/data/session";
import { getCartLines } from "@/lib/data/cart";
import { getSettings } from "@/lib/data/settings";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Shopping cart", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  if (!(await getSessionUser())) redirect("/login?next=/cart");
  const [lines, settings] = await Promise.all([getCartLines(), getSettings()]);
  return (
    <div className="container-page py-4">
      <CartView lines={lines} maxQty={settings.checkout.max_qty_per_item} />
    </div>
  );
}
