"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { answerQuestion, moderateReview, setEnquiryStatus } from "@/app/admin/actions/moderation";
import { useRun } from "@/components/admin/useRun";
import { Empty, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { Textarea } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import { formatDate } from "@/lib/utils";

export interface ReviewItem { id: string; book_title: string; reviewer_name: string | null; rating: number; title: string | null; body: string | null; verified_purchase: boolean; created_at: string }
export interface QuestionItem { id: string; book_title: string; asker_name: string | null; question: string; created_at: string }

export function ReviewsQueue({ reviews }: { reviews: ReviewItem[] }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  if (!reviews.length) return <Empty>{t("admin.reviews.none")}</Empty>;
  return (
    <ul className="divide-y">
      {reviews.map((r) => (
        <li key={r.id} className="space-y-1 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Stars value={r.rating} />
            <strong>{r.reviewer_name ?? "Reader"}</strong>
            {r.verified_purchase ? <Badge tone="green">{t("reviews.verified")}</Badge> : <Badge>{t("admin.reviews.unverified")}</Badge>}
            <span className="text-xs text-slate-500">{formatDate(r.created_at, lang)} · {r.book_title}</span>
          </div>
          {r.title ? <p className="font-medium">{r.title}</p> : null}
          {r.body ? <p className="whitespace-pre-line text-sm text-slate-700">{r.body}</p> : null}
          <div className="flex gap-2 pt-1">
            <Button size="sm" disabled={pending} onClick={() => run(() => moderateReview(r.id, "published"))}><Check size={14} /> {t("admin.reviews.publish")}</Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => moderateReview(r.id, "rejected"))}><X size={14} /> {t("admin.order.reject")}</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function QuestionRow({ q }: { q: QuestionItem }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  const [answer, setAnswer] = useState("");
  return (
    <li className="space-y-2 p-4">
      <p className="text-xs text-slate-500">{q.asker_name ?? "Reader"} · {formatDate(q.created_at, lang)} · {q.book_title}</p>
      <p className="font-medium">Q: {q.question}</p>
      <Textarea rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={t("admin.reviews.answerPh")} maxLength={2000} />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending || !answer.trim()} onClick={() => run(() => answerQuestion({ id: q.id, answer, publish: true }))}>{t("admin.reviews.answerPublish")}</Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => answerQuestion({ id: q.id, answer: "", publish: false }))}>{t("admin.order.reject")}</Button>
      </div>
    </li>
  );
}

export function QuestionsQueue({ items }: { items: QuestionItem[] }) {
  const { t } = useT();
  if (!items.length) return <Empty>{t("admin.reviews.noQuestions")}</Empty>;
  return <ul className="divide-y">{items.map((q) => <QuestionRow key={q.id} q={q} />)}</ul>;
}

export interface EnquiryItem { id: string; org: string | null; contact: string; phone: string; email: string | null; message: string; status: "new" | "contacted" | "closed"; created_at: string }

export function EnquiryList({ items }: { items: EnquiryItem[] }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  if (!items.length) return <Empty>{t("admin.enquiries.none")}</Empty>;
  return (
    <Panel padded={false}>
      <ul className="divide-y">
        {items.map((e) => (
          <li key={e.id} className="space-y-1 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <strong>{e.org ?? "—"}</strong> · {e.contact} · <a className="link" href={`tel:${e.phone}`}>{e.phone}</a>
              {e.email ? <a className="link" href={`mailto:${e.email}`}>{e.email}</a> : null}
              <Badge tone={e.status === "new" ? "amber" : e.status === "contacted" ? "blue" : "neutral"}>{t(`admin.enquiries.${e.status}` as "admin.enquiries.new")}</Badge>
              <span className="text-xs text-slate-500">{formatDate(e.created_at, lang, true)}</span>
            </div>
            <p className="whitespace-pre-line text-sm text-slate-700">{e.message}</p>
            <div className="flex gap-2 pt-1">
              {e.status !== "contacted" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setEnquiryStatus(e.id, "contacted"))}>{t("admin.enquiries.markContacted")}</Button> : null}
              {e.status !== "closed" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setEnquiryStatus(e.id, "closed"))}>{t("admin.enquiries.close")}</Button> : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
