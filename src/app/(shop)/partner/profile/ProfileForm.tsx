"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { updatePartnerProfile } from "@/app/actions/partners";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";

type Values = { contact_person: string; email: string; phone: string; country: string; address: string; website: string; tax_id: string; catalogue: string };

export function ProfileForm({ initial }: { initial: Values }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setF({ ...f, [k]: e.target.value });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await updatePartnerProfile(f);
          if (res.ok) {
            setSaved(true);
            router.refresh();
          } else setError(errorMessage(lang, res.error, res.detail));
        });
      }}
      className="card mt-4 grid gap-3 p-5 sm:grid-cols-2"
    >
      {error ? <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{error}</p> : null}
      <Field label={t("partner.contact")} htmlFor="pp-c"><Input id="pp-c" required maxLength={100} value={f.contact_person} onChange={set("contact_person")} /></Field>
      <Field label={t("partner.email")} htmlFor="pp-e"><Input id="pp-e" type="email" required maxLength={200} value={f.email} onChange={set("email")} /></Field>
      <Field label={t("partner.phone")} htmlFor="pp-p"><Input id="pp-p" type="tel" required value={f.phone} onChange={set("phone")} /></Field>
      <Field label={t("partner.country")} htmlFor="pp-co"><Input id="pp-co" required maxLength={60} value={f.country} onChange={set("country")} /></Field>
      <Field label={t("partner.address")} htmlFor="pp-a" className="sm:col-span-2"><Textarea id="pp-a" required rows={2} maxLength={500} value={f.address} onChange={set("address")} /></Field>
      <Field label={t("partner.website")} hint={t("common.optional")} htmlFor="pp-w"><Input id="pp-w" type="url" maxLength={300} value={f.website} onChange={set("website")} /></Field>
      <Field label={t("partner.taxId")} hint={t("common.optional")} htmlFor="pp-t"><Input id="pp-t" maxLength={40} value={f.tax_id} onChange={set("tax_id")} /></Field>
      <Field label={t("partner.catalogue")} htmlFor="pp-cat" className="sm:col-span-2"><Textarea id="pp-cat" required rows={3} maxLength={2000} value={f.catalogue} onChange={set("catalogue")} /></Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {t("common.save")}
        </Button>
        {saved ? (
          <span className="flex items-center gap-1 text-sm text-emerald-700">
            <CheckCircle2 size={16} /> {t("common.saved")}
          </span>
        ) : null}
      </div>
    </form>
  );
}
