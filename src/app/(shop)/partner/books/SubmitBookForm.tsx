"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { submitPartnerBook } from "@/app/actions/partners";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { CURRENCIES, type PartnerBookInput } from "@/lib/validation/partner";

const LANGS = ["bn", "en", "hi", "ur", "sa", "other"] as const;

export function SubmitBookForm({ defaultPublisher }: { defaultPublisher: string }) {
  const { t, lang } = useT();
  const router = useRouter();
  const empty = {
    title: "",
    title_bn: "",
    authors: "",
    publisher: defaultPublisher,
    isbn: "",
    language: "bn",
    binding: "paperback",
    edition: "",
    pages: "",
    mrp: "",
    supply_price: "",
    currency: "INR",
    quantity: "",
    description: "",
  };
  const [f, setF] = useState(empty);
  const [cover, setCover] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSent(false);
    setF({ ...f, [k]: e.target.value });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await submitPartnerBook({ ...f, cover_url: cover[0] ?? "" } as PartnerBookInput);
          if (res.ok) {
            setSent(true);
            setF(empty);
            setCover([]);
            router.refresh();
          } else setError(errorMessage(lang, res.error, res.detail));
        });
      }}
      className="card mt-3 grid gap-3 p-5 sm:grid-cols-2"
    >
      {error ? <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{error}</p> : null}
      {sent ? (
        <p className="flex items-center gap-2 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
          <CheckCircle2 size={18} /> {t("partner.books.sent")}
        </p>
      ) : null}
      <Field label={t("partner.book.title")} htmlFor="sb-t"><Input id="sb-t" required maxLength={250} value={f.title} onChange={set("title")} /></Field>
      <Field label={t("partner.book.titleBn")} hint={t("common.optional")} htmlFor="sb-tb"><Input id="sb-tb" maxLength={250} value={f.title_bn} onChange={set("title_bn")} /></Field>
      <Field label={t("partner.book.authors")} htmlFor="sb-a"><Input id="sb-a" required maxLength={500} value={f.authors} onChange={set("authors")} /></Field>
      <Field label={t("partner.book.publisher")} hint={t("common.optional")} htmlFor="sb-p"><Input id="sb-p" maxLength={120} value={f.publisher} onChange={set("publisher")} /></Field>
      <Field label={t("partner.book.isbn")} hint={t("common.optional")} htmlFor="sb-i"><Input id="sb-i" inputMode="numeric" maxLength={17} value={f.isbn} onChange={set("isbn")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("partner.book.language")} htmlFor="sb-l">
          <Select id="sb-l" value={f.language} onChange={set("language")}>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {t(`lang.${l}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("partner.book.binding")} htmlFor="sb-b">
          <Select id="sb-b" value={f.binding} onChange={set("binding")}>
            <option value="paperback">{t("binding.paperback")}</option>
            <option value="hardcover">{t("binding.hardcover")}</option>
          </Select>
        </Field>
      </div>
      <Field label={t("partner.book.edition")} hint={t("common.optional")} htmlFor="sb-e"><Input id="sb-e" maxLength={60} value={f.edition} onChange={set("edition")} /></Field>
      <Field label={t("partner.book.pages")} hint={t("common.optional")} htmlFor="sb-pg"><Input id="sb-pg" type="number" min={1} max={20000} value={f.pages} onChange={set("pages")} /></Field>
      <Field label={t("partner.book.mrp")} htmlFor="sb-m"><Input id="sb-m" type="number" required min={1} step="0.01" value={f.mrp} onChange={set("mrp")} /></Field>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Field label={t("partner.book.supplyPrice")} htmlFor="sb-s"><Input id="sb-s" type="number" required min={0} step="0.01" value={f.supply_price} onChange={set("supply_price")} /></Field>
        <Field label={t("partner.book.currency")} htmlFor="sb-c">
          <Select id="sb-c" value={f.currency} onChange={set("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t("partner.book.quantity")} hint={t("common.optional")} htmlFor="sb-q"><Input id="sb-q" type="number" min={0} value={f.quantity} onChange={set("quantity")} /></Field>
      <Field label={t("partner.book.description")} hint={t("common.optional")} htmlFor="sb-d" className="sm:col-span-2">
        <Textarea id="sb-d" rows={3} maxLength={4000} value={f.description} onChange={set("description")} />
      </Field>
      <div className="sm:col-span-2">
        <ImageUploader folder="covers" endpoint="/api/partner/upload" value={cover} onChange={setCover} label={t("partner.book.cover")} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {t("partner.book.submit")}
        </Button>
      </div>
    </form>
  );
}
