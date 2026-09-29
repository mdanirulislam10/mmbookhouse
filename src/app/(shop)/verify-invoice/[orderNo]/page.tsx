import type { Metadata } from "next";
import { BadgeCheck, ShieldX } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/data/settings";
import { getT } from "@/lib/i18n/server";
import { invoiceNumber, verifyInvoiceSignature } from "@/lib/invoice";
import { first, formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Verify invoice", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerifyInvoicePage({ params, searchParams }: { params: Promise<{ orderNo: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const orderNo = decodeURIComponent((await params).orderNo);
  const sig = first((await searchParams).sig) ?? "";
  const { t, lang } = await getT();
  const valid = sig.length > 10 && verifyInvoiceSignature(orderNo, sig);
  let order = null as { placed_at: string; total: number; status: string } | null;
  if (valid) {
    const { data } = await createServiceClient().from("orders").select("placed_at, total, status").eq("order_no", orderNo).maybeSingle();
    order = data as { placed_at: string; total: number; status: string } | null;
  }
  const store = (await getSettings()).store_profile;
  return (
    <div className="container-page max-w-md py-10">
      <div className="card p-6 text-center">
        {valid && order ? (
          <>
            <BadgeCheck className="mx-auto text-emerald-600" size={48} />
            <h1 className="mt-2 text-xl font-bold">{t("invoice.genuine")}</h1>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">{t("invoice.number")}</dt><dd className="font-mono">{invoiceNumber(orderNo)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t("common.date")}</dt><dd>{formatDate(order.placed_at, lang)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t("common.total")}</dt><dd className="font-semibold">{formatINR(order.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t("invoice.issuedBy")}</dt><dd>{store.name}</dd></div>
            </dl>
          </>
        ) : (
          <>
            <ShieldX className="mx-auto text-red-600" size={48} />
            <h1 className="mt-2 text-xl font-bold">{t("invoice.invalid")}</h1>
            <p className="mt-1 text-sm text-slate-600">{t("invoice.invalidText")}</p>
          </>
        )}
      </div>
    </div>
  );
}
