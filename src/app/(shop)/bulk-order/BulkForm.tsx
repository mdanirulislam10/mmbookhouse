"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitBulkEnquiry } from "@/app/actions/engagement";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";

export function BulkForm() {
  const { t, lang } = useT();
  const [f, setF] = useState({ org: "", contact: "", phone: "", email: "", details: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (done) {
    return (
      <div className="card mt-5 flex items-center gap-3 p-6 text-emerald-800">
        <CheckCircle2 /> {t("bulk.thanks")}
      </div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await submitBulkEnquiry(f);
          if (res.ok) setDone(true);
          else setError(errorMessage(lang, res.error, res.detail));
        });
      }}
      className="card mt-5 grid gap-3 p-5 sm:grid-cols-2"
    >
      {error ? <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{error}</p> : null}
      <Field label={t("bulk.org")} htmlFor="b-org"><Input id="b-org" required value={f.org} onChange={set("org")} /></Field>
      <Field label={t("bulk.contact")} htmlFor="b-contact"><Input id="b-contact" required value={f.contact} onChange={set("contact")} /></Field>
      <Field label={t("common.phone")} htmlFor="b-phone"><Input id="b-phone" type="tel" required value={f.phone} onChange={set("phone")} /></Field>
      <Field label={t("common.email")} hint={t("common.optional")} htmlFor="b-email"><Input id="b-email" type="email" value={f.email} onChange={set("email")} /></Field>
      <Field label={t("bulk.details")} htmlFor="b-details" className="sm:col-span-2"><Textarea id="b-details" required rows={5} value={f.details} onChange={set("details")} /></Field>
      <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={pending}>{t("bulk.submit")}</Button></div>
    </form>
  );
}
