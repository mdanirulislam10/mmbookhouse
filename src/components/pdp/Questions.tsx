"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { submitQuestion } from "@/app/actions/engagement";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import type { QuestionRow } from "@/lib/data/catalog";

export function Questions({ bookId, items }: { bookId: string; items: QuestionRow[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await submitQuestion({ bookId, question: q });
      if (res.ok) {
        setSent(true);
        setQ("");
        return;
      }
      if (res.error === "AUTH_REQUIRED") return router.push(`/login?next=${encodeURIComponent(path)}`);
      toast.error(errorMessage(lang, res.error));
    });
  };

  return (
    <section id="questions" className="card p-4 sm:p-5">
      <h2 className="mb-3 text-xl font-bold">{t("qa.title")}</h2>
      {sent ? (
        <p className="mb-4 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t("qa.pending")}</p>
      ) : (
        <form onSubmit={submit} className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start">
          <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("qa.placeholder")} minLength={5} maxLength={1000} required className="min-h-[44px] flex-1" rows={2} />
          <Button type="submit" disabled={pending || q.trim().length < 5}>
            {t("qa.submit")}
          </Button>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{t("qa.none")}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={it.id} className="text-sm">
              <p className="font-medium">Q: {it.question}</p>
              {it.answer ? (
                <p className="mt-1 text-slate-700">
                  <span className="font-medium">{t("qa.answer")}:</span> {it.answer}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
