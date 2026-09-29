"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/app/actions/cart";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { cn } from "@/lib/utils";

export function WishlistButton({ bookId, initial = false, className, label = false }: { bookId: string; initial?: boolean; className?: string; label?: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [wished, setWished] = useState(initial);
  const [pending, start] = useTransition();

  const text = wished ? t("book.wishlistRemove") : t("book.wishlistAdd");
  return (
    <button
      type="button"
      aria-pressed={wished}
      aria-label={text}
      title={text}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleWishlist(bookId);
          if (res.ok) return setWished(res.data!.wished);
          if (res.error === "AUTH_REQUIRED") return router.push(`/login?next=${encodeURIComponent(path)}`);
          toast.error(errorMessage(lang, res.error));
        })
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-600 shadow-sm transition hover:text-red-600 disabled:opacity-60",
        wished && "text-red-600",
        label && "px-4 text-sm",
        className,
      )}
    >
      <Heart size={18} fill={wished ? "currentColor" : "none"} />
      {label ? <span>{text}</span> : null}
    </button>
  );
}
