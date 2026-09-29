"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Smartphone } from "lucide-react";
import { submitUtr } from "@/app/actions/orders";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { formatINR } from "@/lib/utils";

/** UPI payment instructions + UTR submission for an unpaid UPI order. */
export function UpiPayBox({
  orderId,
  amount,
  upiId,
  payee,
  upiUrl,
  qrDataUrl,
  submitted,
}: {
  orderId: string;
  amount: number;
  upiId: string;
  payee: string;
  upiUrl: string;
  qrDataUrl: string | null;
  submitted: boolean;
}) {
  const { t, lang } = useT();
  const router = useRouter();
  const toast = useToast();
  const [utr, setUtr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-900">
        <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-semibold">{t("order.utrPending")}</p>
          <p className="text-sm">{t("order.utrSent")}</p>
        </div>
      </div>
    );
  }
  if (!upiId) {
    return <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("order.upiNotConfigured")}</p>;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await submitUtr(orderId, utr);
      if (!res.ok) return setError(errorMessage(lang, res.error, res.detail));
      toast.success(t("order.utrSent"));
      router.refresh();
    });
  };

  return (
    <section className="rounded-lg border-2 border-brand-amber bg-amber-50/50 p-4 sm:p-5">
      <h2 className="text-lg font-bold">{t("order.payNow")}</h2>
      <p className="mt-1 text-sm text-slate-700">{t("order.payText", { amount: formatINR(amount) })}</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-[180px_1fr]">
        <div className="text-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="UPI QR" width={180} height={180} className="mx-auto rounded-lg border bg-white p-2" />
          ) : null}
          <p className="mt-1 text-xs text-slate-500">{t("order.scanQr")}</p>
        </div>
        <div className="space-y-3 text-sm">
          <dl className="grid grid-cols-[90px_1fr] gap-y-1">
            <dt className="text-slate-500">{t("order.upiId")}</dt>
            <dd className="flex items-center gap-2 font-mono font-semibold">
              {upiId}
              <button type="button" aria-label={t("common.copied")} onClick={() => navigator.clipboard?.writeText(upiId).then(() => toast.success(t("common.copied")))} className="text-slate-500 hover:text-brand-ink">
                <Copy size={14} />
              </button>
            </dd>
            <dt className="text-slate-500">{t("order.payee")}</dt>
            <dd>{payee}</dd>
            <dt className="text-slate-500">{t("common.total")}</dt>
            <dd className="font-semibold">{formatINR(amount)}</dd>
          </dl>
          <a href={upiUrl} className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-4 py-2 font-medium text-white md:hidden">
            <Smartphone size={16} /> {t("order.openUpiApp")}
          </a>
          <form onSubmit={submit} className="space-y-2 border-t pt-3">
            {error ? <p role="alert" className="text-red-600">{error}</p> : null}
            <Field label={t("order.utr")} hint={t("order.utrHint")} htmlFor="utr">
              <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value.replace(/[^0-9A-Za-z]/g, ""))} maxLength={22} required minLength={10} inputMode="text" autoComplete="off" className="font-mono" />
            </Field>
            <Button type="submit" disabled={pending || utr.length < 10}>
              {t("order.utrSubmit")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
