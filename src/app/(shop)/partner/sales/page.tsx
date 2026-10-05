import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/session";
import { getMyPartner, getMyStatement } from "@/lib/data/partner";
import { totalsByCurrency } from "@/lib/partner-accounts";
import { getT } from "@/lib/i18n/server";
import { PartnerShell } from "@/components/partner/PartnerShell";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Sales & accounts" };
export const dynamic = "force-dynamic";


export default async function PartnerSalesPage() {
  await requireUser("/partner/sales");
  const partner = await getMyPartner();
  if (!partner || (partner.status !== "approved" && partner.status !== "suspended")) redirect("/partner");
  const { t, lang } = await getT();
  const { sales, payouts } = await getMyStatement();
  const totals = totalsByCurrency(sales, payouts);

  return (
    <PartnerShell partner={partner} active="sales">
      <p className="text-sm text-slate-600">{t("partner.sales.lead")}</p>

      {totals.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {totals.map((c) => (
            <div key={c.currency} className="card space-y-1 p-4 text-sm sm:col-span-3 md:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.currency}</p>
              <p className="flex justify-between"><span>{t("partner.sales.earned")}</span><b>{formatMoney(c.currency, c.earned)}</b></p>
              <p className="flex justify-between"><span>{t("partner.sales.paid")}</span><b>{formatMoney(c.currency, c.paid)}</b></p>
              <p className="flex justify-between border-t pt-1"><span>{t("partner.sales.due")}</span><b className={c.balance > 0 ? "text-emerald-700" : ""}>{formatMoney(c.currency, c.balance)}</b></p>
            </div>
          ))}
        </div>
      ) : null}

      <h2 className="mt-6 text-lg font-semibold">{t("partner.sales.byBook")}</h2>
      {sales.length ? (
        <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">{t("partner.sales.book")}</th>
                <th className="px-3 py-2 text-right">{t("admin.partners.supply")}</th>
                <th className="px-3 py-2 text-right">{t("partner.sales.sold")}</th>
                <th className="px-3 py-2 text-right">{t("partner.sales.pending")}</th>
                <th className="px-3 py-2 text-right">{t("partner.sales.earned")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sales.map((s) => (
                <tr key={s.book_id}>
                  <td className="px-3 py-2">
                    {s.status === "active" ? (
                      <Link href={`/book/${s.slug}`} className="link">
                        {s.title}
                      </Link>
                    ) : (
                      <>
                        {s.title} <span className="text-xs text-slate-500">({t("partner.sales.notListed")})</span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{formatMoney(s.currency, s.supply_price)}</td>
                  <td className="px-3 py-2 text-right font-medium">{s.sold}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{s.pending}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatMoney(s.currency, s.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-600">{t("partner.sales.none")}</p>
      )}

      <h2 className="mt-6 text-lg font-semibold">{t("partner.sales.payouts")}</h2>
      {payouts.length ? (
        <ul className="mt-2 divide-y rounded-lg border bg-white text-sm">
          {payouts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span>
                {formatDate(p.paid_on, lang)}
                {p.method ? ` · ${p.method}` : ""}
                {p.reference ? ` · ${t("partner.sales.ref")} ${p.reference}` : ""}
                {p.note ? <span className="block text-xs text-slate-500">{p.note}</span> : null}
              </span>
              <b>{formatMoney(p.currency, p.amount)}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-600">{t("partner.sales.noPayouts")}</p>
      )}
      <p className="mt-4 text-xs text-slate-500">{t("partner.sales.footnote")}</p>
    </PartnerShell>
  );
}
