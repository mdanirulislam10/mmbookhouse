"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addToCart } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/ui/BookCover";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { pick } from "@/lib/i18n";
import type { BookCard } from "@/lib/types";
import { formatINR } from "@/lib/utils";

/** "Frequently bought together": the main book plus curated companions, added in one click. */
export function FbtBundle({ main, others }: { main: BookCard; others: BookCard[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const all = [main, ...others].filter((b) => b.in_stock);
  const [selected, setSelected] = useState<Set<string>>(new Set(all.map((b) => b.id)));
  const [pending, start] = useTransition();
  if (others.length === 0) return null;

  const chosen = all.filter((b) => selected.has(b.id));
  const total = chosen.reduce((n, b) => n + b.price, 0);

  const addAll = () =>
    start(async () => {
      for (const b of chosen) {
        const res = await addToCart(b.id, 1);
        if (!res.ok) {
          if (res.error === "AUTH_REQUIRED") return router.push(`/login?next=${encodeURIComponent(path)}`);
          return toast.error(errorMessage(lang, res.error, res.detail));
        }
      }
      toast.success(t("book.addedToCart"));
      router.refresh();
    });

  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mb-3 text-xl font-bold">{t("book.related")}</h2>
      <div className="flex flex-wrap items-center gap-3">
        {all.map((b, i) => (
          <div key={b.id} className="flex items-center gap-3">
            {i > 0 ? <Plus size={20} className="text-slate-400" /> : null}
            <div className="w-24 sm:w-28">
              <Link href={`/book/${b.slug}`}>
                <BookCover src={b.cover_url} title={pick(lang, b.title, b.title_bn)} sizes="120px" />
              </Link>
              <label className="mt-2 flex items-start gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={selected.has(b.id)}
                  disabled={b.id === main.id}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(b.id);
                    else next.delete(b.id);
                    setSelected(next);
                  }}
                  className="mt-0.5 accent-amber-500"
                />
                <span className="line-clamp-2">
                  {pick(lang, b.title, b.title_bn)} — <strong>{formatINR(b.price)}</strong>
                </span>
              </label>
            </div>
          </div>
        ))}
        <div className="ml-auto min-w-[180px] space-y-2">
          <p className="text-sm text-slate-600">
            {t("common.total")}: <strong className="text-lg text-price">{formatINR(total)}</strong>
          </p>
          <Button onClick={addAll} disabled={pending || chosen.length === 0} className="w-full">
            {t("book.addToCart")} ({chosen.length})
          </Button>
        </div>
      </div>
    </section>
  );
}
