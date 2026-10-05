"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { approveSubmission, deletePayout, recordPayout, rejectSubmission, reviewPartner } from "@/app/admin/actions/partners";
import { useRun } from "@/components/admin/useRun";
import { Empty, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { BookCover } from "@/components/ui/BookCover";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { totalsByCurrency, type PayoutRow, type SalesRow } from "@/lib/partner-accounts";
import { CURRENCIES } from "@/lib/validation/partner";
import { useT } from "@/lib/i18n/client";
import { formatDate, formatMoney } from "@/lib/utils";

export interface PartnerItem {
  id: string;
  kind: "publisher" | "author" | "supplier";
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  website: string | null;
  tax_id: string | null;
  catalogue: string;
  terms_version: string;
  terms_accepted_at: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  admin_note: string | null;
  created_at: string;
  account?: { sales: SalesRow[]; payouts: PayoutRow[] };
}

/** Earned / paid / due for one partner, the payments made, and a form to record a new payment. */
function PartnerAccount({ partnerId, account }: { partnerId: string; account: { sales: SalesRow[]; payouts: PayoutRow[] } }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const blank = { amount: "", currency: account.sales[0]?.currency ?? "INR", paidOn: today, method: "", reference: "", note: "" };
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const totals = totalsByCurrency(account.sales, account.payouts);
  const sold = account.sales.reduce((n, s) => n + Number(s.sold), 0);

  return (
    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-left">
        <b>{t("admin.partners.account")}</b>
        <span>
          {t("partner.stats.sold")}: {sold}
        </span>
        {totals.map((c) => (
          <span key={c.currency}>
            {t("partner.sales.due")}: <b className={c.balance > 0 ? "text-emerald-700" : ""}>{formatMoney(c.currency, c.balance)}</b>
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-500">{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          {account.sales.length ? (
            <ul className="space-y-0.5">
              {account.sales.map((s) => (
                <li key={s.book_id} className="flex flex-wrap justify-between gap-2">
                  <span>{s.title}</span>
                  <span className="text-slate-600">
                    {s.sold} × {formatMoney(s.currency, s.supply_price)} = <b>{formatMoney(s.currency, s.earned)}</b>
                    {s.pending ? ` (+${s.pending} ${t("partner.sales.pending")})` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">{t("partner.sales.none")}</p>
          )}
          {totals.map((c) => (
            <p key={c.currency} className="flex flex-wrap gap-x-4">
              <span>
                {t("partner.sales.earned")}: {formatMoney(c.currency, c.earned)}
              </span>
              <span>
                {t("partner.sales.paid")}: {formatMoney(c.currency, c.paid)}
              </span>
              <span>
                {t("partner.sales.due")}: <b>{formatMoney(c.currency, c.balance)}</b>
              </span>
            </p>
          ))}
          {account.payouts.length ? (
            <ul className="divide-y rounded border bg-white">
              {account.payouts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5">
                  <span>
                    {formatDate(p.paid_on, lang)} · <b>{formatMoney(p.currency, p.amount)}</b>
                    {p.method ? ` · ${p.method}` : ""}
                    {p.reference ? ` · ${p.reference}` : ""}
                    {p.note ? <span className="block text-xs text-slate-500">{p.note}</span> : null}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      if (window.confirm(t("admin.partners.confirmDelete"))) run(() => deletePayout(p.id));
                    }}
                  >
                    {t("admin.partners.deletePayout")}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <form
            className="grid gap-2 rounded border bg-white p-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => recordPayout({ partnerId, amount: Number(f.amount), currency: f.currency, paidOn: f.paidOn, method: f.method, reference: f.reference, note: f.note }), { onOk: () => setF(blank) });
            }}
          >
            <p className="font-medium sm:col-span-3">{t("admin.partners.recordPayout")}</p>
            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <Field label={t("admin.partners.amount")} htmlFor={`pa-${partnerId}`}>
                <Input id={`pa-${partnerId}`} type="number" required min={0.01} step="0.01" value={f.amount} onChange={set("amount")} />
              </Field>
              <Field label={t("partner.book.currency")} htmlFor={`pc-${partnerId}`}>
                <Select id={`pc-${partnerId}`} value={f.currency} onChange={set("currency")}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label={t("admin.partners.paidOn")} htmlFor={`pd-${partnerId}`}>
              <Input id={`pd-${partnerId}`} type="date" required max={today} value={f.paidOn} onChange={set("paidOn")} />
            </Field>
            <Field label={t("admin.partners.method")} htmlFor={`pm-${partnerId}`}>
              <Input id={`pm-${partnerId}`} maxLength={60} value={f.method} onChange={set("method")} />
            </Field>
            <Field label={t("admin.partners.reference")} htmlFor={`pr-${partnerId}`}>
              <Input id={`pr-${partnerId}`} maxLength={120} value={f.reference} onChange={set("reference")} />
            </Field>
            <Field label={t("admin.partners.note")} htmlFor={`pn-${partnerId}`} className="sm:col-span-2">
              <Input id={`pn-${partnerId}`} maxLength={500} value={f.note} onChange={set("note")} />
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit" size="sm" disabled={pending}>
                {t("admin.partners.recordPayout")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export interface SubmissionItem {
  id: string;
  title: string;
  title_bn: string | null;
  authors: string;
  publisher: string | null;
  isbn: string | null;
  language: string;
  binding: string;
  edition: string | null;
  pages: number | null;
  mrp: number;
  supply_price: number;
  currency: string;
  quantity: number | null;
  description: string | null;
  cover_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  book_id: string | null;
  created_at: string;
  partner_name: string;
}

const STATUS_TONE = { pending: "amber", approved: "green", rejected: "red", suspended: "red" } as const;

export function PartnerApplications({ items }: { items: PartnerItem[] }) {
  const { t, lang } = useT();
  const { run, pending } = useRun();
  const ask = () => window.prompt(t("admin.partners.reasonPrompt"))?.trim();

  if (!items.length) return <Empty>{t("admin.partners.noApplications")}</Empty>;
  return (
    <Panel padded={false}>
      <ul className="divide-y">
        {items.map((p) => (
          <li key={p.id} className="space-y-1 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-base">{p.name}</strong>
              <Badge tone="blue">{t(`partner.kind.${p.kind}`)}</Badge>
              <Badge tone={STATUS_TONE[p.status]}>{t(`partner.status.${p.status}`)}</Badge>
              <span className="text-xs text-slate-500">{formatDate(p.created_at, lang, true)}</span>
            </div>
            <p>
              {p.contact_person} · <a className="link" href={`mailto:${p.email}`}>{p.email}</a> · <a className="link" href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}>{p.phone}</a>
            </p>
            <p className="text-slate-600">
              {p.country} · {p.address}
              {p.tax_id ? ` · ${t("partner.taxId")}: ${p.tax_id}` : ""}
              {p.website ? (
                <>
                  {" · "}
                  <a className="link" href={p.website} target="_blank" rel="noopener noreferrer nofollow">
                    {p.website}
                  </a>
                </>
              ) : null}
            </p>
            <p className="whitespace-pre-line text-slate-700">{p.catalogue}</p>
            <p className="text-xs text-slate-500">{t("admin.partners.termsAccepted", { v: p.terms_version, date: formatDate(p.terms_accepted_at, lang) })}</p>
            {p.admin_note ? <p className="text-xs text-red-700">{t("partner.reason", { note: p.admin_note })}</p> : null}
            {p.account ? <PartnerAccount partnerId={p.id} account={p.account} /> : null}
            <div className="flex flex-wrap gap-2 pt-1">
              {p.status !== "approved" ? (
                <Button size="sm" disabled={pending} onClick={() => run(() => reviewPartner(p.id, "approved"))}>
                  {t("admin.partners.approve")}
                </Button>
              ) : null}
              {p.status === "pending" ? (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => { const n = ask(); if (n) run(() => reviewPartner(p.id, "rejected", n)); }}>
                  {t("admin.partners.reject")}
                </Button>
              ) : null}
              {p.status === "approved" ? (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => { const n = ask(); if (n) run(() => reviewPartner(p.id, "suspended", n)); }}>
                  {t("admin.partners.suspend")}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function PartnerSubmissions({ items }: { items: SubmissionItem[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const { run, pending } = useRun();

  if (!items.length) return <Empty>{t("admin.partners.noBooks")}</Empty>;
  return (
    <Panel padded={false}>
      <ul className="divide-y">
        {items.map((s) => (
          <li key={s.id} className="flex gap-3 p-4 text-sm">
            <div className="w-16 shrink-0">
              <BookCover src={s.cover_url} title={s.title} sizes="64px" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{s.title}</strong>
                {s.title_bn ? <span className="text-slate-600">{s.title_bn}</span> : null}
                <Badge tone={STATUS_TONE[s.status]}>{t(`partner.book.status.${s.status}`)}</Badge>
              </div>
              <p>
                {s.authors}
                {s.publisher ? ` · ${s.publisher}` : ""}
                {s.isbn ? ` · ISBN ${s.isbn}` : ""}
              </p>
              <p className="text-slate-600">
                {t(`lang.${s.language as "bn"}`)} · {t(`binding.${s.binding as "paperback"}`)}
                {s.edition ? ` · ${s.edition}` : ""}
                {s.pages ? ` · ${s.pages} p.` : ""}
              </p>
              <p>
                MRP ₹{Number(s.mrp)} · {t("admin.partners.supply")}: <b>{s.currency} {Number(s.supply_price)}</b>
                {s.quantity != null ? ` · ${t("partner.book.quantity")}: ${s.quantity}` : ""}
              </p>
              {s.description ? <p className="line-clamp-3 text-slate-600">{s.description}</p> : null}
              <p className="text-xs text-slate-500">
                {t("admin.partners.from")}: {s.partner_name} · {formatDate(s.created_at, lang, true)}
              </p>
              {s.admin_note ? <p className="text-xs text-red-700">{t("partner.reason", { note: s.admin_note })}</p> : null}
              <div className="flex flex-wrap gap-2 pt-1">
                {s.status === "pending" ? (
                  <>
                    <Button size="sm" disabled={pending} onClick={() => run(() => approveSubmission(s.id), { onOk: (d) => d && router.push(`/admin/books/${d.bookId}`) })}>
                      {t("admin.partners.acceptBook")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => {
                        const n = window.prompt(t("admin.partners.reasonPrompt"))?.trim();
                        if (n) run(() => rejectSubmission(s.id, n));
                      }}
                    >
                      {t("admin.partners.reject")}
                    </Button>
                  </>
                ) : null}
                {s.book_id ? (
                  <Link href={`/admin/books/${s.book_id}`} className="link text-sm">
                    {t("admin.partners.openBook")}
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
