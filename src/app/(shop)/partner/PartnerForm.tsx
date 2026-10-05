"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { applyAsPartner } from "@/app/actions/partners";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { PARTNER_KINDS } from "@/lib/validation/partner";

export interface PartnerFormValues {
  kind: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  website: string;
  tax_id: string;
  catalogue: string;
}

export function PartnerForm({ initial, resubmit }: { initial: PartnerFormValues; resubmit: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [terms, setTerms] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof PartnerFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  if (done) {
    return (
      <div className="card mt-6 flex items-center gap-3 p-6 text-emerald-800">
        <CheckCircle2 className="shrink-0" /> {t("partner.sent")}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await applyAsPartner({ ...f, kind: f.kind as (typeof PARTNER_KINDS)[number], terms: terms as true });
          if (res.ok) {
            setDone(true);
            router.refresh();
          } else setError(errorMessage(lang, res.error, res.detail));
        });
      }}
      className="card mt-6 grid gap-3 p-5 sm:grid-cols-2"
    >
      {error ? <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{error}</p> : null}
      <Field label={t("partner.kind")} htmlFor="p-kind">
        <Select id="p-kind" value={f.kind} onChange={set("kind")}>
          {PARTNER_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`partner.kind.${k}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("partner.name")} htmlFor="p-name"><Input id="p-name" required maxLength={150} value={f.name} onChange={set("name")} /></Field>
      <Field label={t("partner.contact")} htmlFor="p-contact"><Input id="p-contact" required maxLength={100} value={f.contact_person} onChange={set("contact_person")} /></Field>
      <Field label={t("partner.email")} htmlFor="p-email"><Input id="p-email" type="email" required maxLength={200} value={f.email} onChange={set("email")} /></Field>
      <Field label={t("partner.phone")} htmlFor="p-phone"><Input id="p-phone" type="tel" required placeholder="+91 98XXXXXXXX" value={f.phone} onChange={set("phone")} /></Field>
      <Field label={t("partner.country")} htmlFor="p-country"><Input id="p-country" required maxLength={60} value={f.country} onChange={set("country")} /></Field>
      <Field label={t("partner.address")} htmlFor="p-address" className="sm:col-span-2"><Textarea id="p-address" required rows={2} maxLength={500} value={f.address} onChange={set("address")} /></Field>
      <Field label={t("partner.website")} hint={t("common.optional")} htmlFor="p-web"><Input id="p-web" type="url" placeholder="https://" maxLength={300} value={f.website} onChange={set("website")} /></Field>
      <Field label={t("partner.taxId")} hint={t("common.optional")} htmlFor="p-tax"><Input id="p-tax" maxLength={40} value={f.tax_id} onChange={set("tax_id")} /></Field>
      <Field label={t("partner.catalogue")} hint={t("partner.catalogueHint")} htmlFor="p-cat" className="sm:col-span-2">
        <Textarea id="p-cat" required rows={4} maxLength={2000} value={f.catalogue} onChange={set("catalogue")} />
      </Field>
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" required checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>
          {t("partner.terms", { link: "§" })
            .split("§")
            .flatMap((part, i) =>
              i === 0
                ? [part]
                : [
                    <Link key="terms" href="/partner/terms" target="_blank" className="link">
                      {t("partner.termsLink")}
                    </Link>,
                    part,
                  ],
            )}
        </span>
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending || !terms}>
          {t(resubmit ? "partner.resubmit" : "partner.submit")}
        </Button>
      </div>
    </form>
  );
}
