"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { addToCart } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";

export function AddToCartButton({
  bookId,
  qty = 1,
  disabled = false,
  size = "md",
  className,
}: {
  bookId: string;
  qty?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { t, lang } = useT();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [pending, start] = useTransition();

  const onClick = () =>
    start(async () => {
      const res = await addToCart(bookId, qty);
      if (res.ok) {
        toast.success(res.data?.capped ? t("cart.stockChanged", { n: res.data.qty }) : t("book.addedToCart"));
        router.refresh();
        return;
      }
      if (res.error === "AUTH_REQUIRED") {
        router.push(`/login?next=${encodeURIComponent(path)}`);
        return;
      }
      toast.error(errorMessage(lang, res.error, res.detail));
    });

  return (
    <Button variant="primary" size={size} className={className} onClick={onClick} disabled={disabled || pending}>
      <ShoppingCart size={16} />
      {t("book.addToCart")}
    </Button>
  );
}

export function BuyNowButton({ bookId, qty = 1, disabled, className }: { bookId: string; qty?: number; disabled?: boolean; className?: string }) {
  const { t } = useT();
  const router = useRouter();
  return (
    <Button variant="buy" size="md" className={className} disabled={disabled} onClick={() => router.push(`/checkout?buy=${bookId}&qty=${qty}`)}>
      <Zap size={16} />
      {t("book.buyNow")}
    </Button>
  );
}
