"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { submitReview, voteReviewHelpful } from "@/app/actions/engagement";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Stars } from "@/components/ui/Stars";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { formatDate } from "@/lib/utils";
import type { ReviewRow } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

export function Reviews({ bookId, avg, count, reviews }: { bookId: string; avg: number; count: number; reviews: ReviewRow[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await submitReview({ bookId, rating, title, body });
      if (res.ok) return setSent(true);
      if (res.error === "AUTH_REQUIRED") return router.push(`/login?next=${encodeURIComponent(path)}`);
      toast.error(errorMessage(lang, res.error));
    });
  };

  return (
    <section id="reviews" className="card p-4 sm:p-5">
      <h2 className="mb-3 text-xl font-bold">{t("reviews.title")}</h2>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div>
          {count > 0 ? (
            <div className="flex items-center gap-2">
              <Stars value={avg} size={20} />
              <span className="text-lg font-semibold">{t("reviews.outOf", { avg: avg.toFixed(1) })}</span>
            </div>
          ) : null}
          <p className="mt-1 text-sm text-slate-500">{count > 0 ? t("reviews.count", { n: count }) : t("reviews.none")}</p>
          {sent ? (
            <p className="mt-4 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t("reviews.pending")}</p>
          ) : (
            <Button variant="secondary" className="mt-4 w-full" onClick={() => setOpen((v) => !v)}>
              {t("reviews.write")}
            </Button>
          )}
        </div>

        <div className="space-y-5">
          {open && !sent ? (
            <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="mb-1 text-sm font-medium">{t("reviews.rating")}</p>
                <div role="radiogroup" aria-label={t("reviews.rating")} className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n}`}
                      onClick={() => setRating(n)}
                      className={cn("h-9 w-9 rounded-full border text-sm font-semibold", rating >= n ? "border-amber-500 bg-amber-400 text-brand-ink" : "border-slate-300 bg-white text-slate-500")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Field label={t("reviews.headline")} htmlFor="rv-title">
                <Input id="rv-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label={t("reviews.body")} htmlFor="rv-body">
                <Textarea id="rv-body" value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} />
              </Field>
              <Button type="submit" disabled={pending || rating === 0}>
                {t("reviews.submit")}
              </Button>
            </form>
          ) : null}

          {reviews.map((r) => (
            <article key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{r.reviewer_name ?? "Reader"}</span>
                {r.verified_purchase ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                    <BadgeCheck size={14} /> {t("reviews.verified")}
                  </span>
                ) : null}
                <span className="text-xs text-slate-400">{formatDate(r.created_at, lang)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Stars value={r.rating} size={14} />
                {r.title ? <h3 className="text-sm font-semibold">{r.title}</h3> : null}
              </div>
              {r.body ? <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.body}</p> : null}
              <button
                type="button"
                disabled={voted.has(r.id)}
                onClick={async () => {
                  const res = await voteReviewHelpful(r.id);
                  if (res.ok) setVoted(new Set(voted).add(r.id));
                  else if (res.error === "AUTH_REQUIRED") router.push(`/login?next=${encodeURIComponent(path)}`);
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <ThumbsUp size={13} /> {t("reviews.helpful")} ({r.helpful_count + (voted.has(r.id) ? 1 : 0)})
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
