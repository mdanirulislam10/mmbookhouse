import type { Metadata } from "next";
import { Clock, XCircle } from "lucide-react";
import { getSessionUser } from "@/lib/data/session";
import { getMyPartner, getMyStatement, type MyPartner } from "@/lib/data/partner";
import { totalsByCurrency } from "@/lib/partner-accounts";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/Button";
import { PartnerShell } from "@/components/partner/PartnerShell";
import { formatMoney } from "@/lib/utils";
import { PartnerForm, type PartnerFormValues } from "./PartnerForm";

export const metadata: Metadata = { title: "Partners: publishers, authors & suppliers" };
export const dynamic = "force-dynamic";


/** Home of an approved (or suspended) partner. */
async function Overview({ partner }: { partner: MyPartner }) {
  const { t } = await getT();
  const supabase = await createClient();
  const [{ data: subs }, { sales, payouts }] = await Promise.all([supabase.from("partner_submissions").select("status").eq("partner_id", partner.id), getMyStatement()]);
  const count = (s: string) => (subs ?? []).filter((x) => x.status === s).length;
  const sold = sales.reduce((n, r) => n + Number(r.sold), 0);
  const pending = sales.reduce((n, r) => n + Number(r.pending), 0);
  const totals = totalsByCurrency(sales, payouts);

  const stats = [
    { label: t("partner.stats.submitted"), value: String(subs?.length ?? 0) },
    { label: t("partner.stats.accepted"), value: String(count("approved")) },
    { label: t("partner.stats.inReview"), value: String(count("pending")) },
    { label: t("partner.stats.sold"), value: String(sold), hint: pending ? t("partner.stats.inProcess", { n: pending }) : undefined },
  ];

  return (
    <PartnerShell partner={partner} active="overview">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
            {s.hint ? <p className="text-xs text-slate-500">{s.hint}</p> : null}
          </div>
        ))}
      </div>

      <div className="card mt-4 p-4">
        <h2 className="font-semibold">{t("partner.sales.balance")}</h2>
        {totals.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {totals.map((c) => (
              <li key={c.currency} className="flex flex-wrap gap-x-4">
                <span>{t("partner.sales.earned")}: <b>{formatMoney(c.currency, c.earned)}</b></span>
                <span>{t("partner.sales.paid")}: <b>{formatMoney(c.currency, c.paid)}</b></span>
                <span>{t("partner.sales.due")}: <b className={c.balance > 0 ? "text-emerald-700" : ""}>{formatMoney(c.currency, c.balance)}</b></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-600">{t("partner.sales.none")}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {partner.status === "approved" ? <LinkButton href="/partner/books">{t("partner.books.new")}</LinkButton> : null}
        <LinkButton href="/partner/sales" variant="secondary">
          {t("partner.tab.sales")}
        </LinkButton>
      </div>
    </PartnerShell>
  );
}

export default async function PartnerPage() {
  const { t } = await getT();
  const [user, partner] = await Promise.all([getSessionUser(), getMyPartner()]);
  if (partner && (partner.status === "approved" || partner.status === "suspended")) return <Overview partner={partner} />;

  const initial: PartnerFormValues = {
    kind: partner?.kind ?? "publisher",
    name: partner?.name ?? "",
    contact_person: partner?.contact_person ?? user?.fullName ?? "",
    email: partner?.email ?? user?.email ?? "",
    phone: partner?.phone ?? "",
    country: partner?.country ?? "India",
    address: partner?.address ?? "",
    website: partner?.website ?? "",
    tax_id: partner?.tax_id ?? "",
    catalogue: partner?.catalogue ?? "",
  };

  return (
    <div className="container-page max-w-3xl py-6">
      <h1 className="text-2xl font-bold">{t("partner.title")}</h1>
      <p className="mt-2 text-slate-700">{t("partner.lead")}</p>
      <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        {(["partner.how1", "partner.how2", "partner.how3"] as const).map((k, i) => (
          <li key={k} className="card flex gap-2 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">{i + 1}</span>
            {t(k)}
          </li>
        ))}
      </ol>

      {!user ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-semibold">{t("partner.login.existing")}</h2>
            <p className="mt-1 text-sm text-slate-600">{t("partner.login.existingText")}</p>
            <LinkButton href="/partner/login" className="mt-3">
              {t("partner.login.button")}
            </LinkButton>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold">{t("partner.login.new")}</h2>
            <p className="mt-1 text-sm text-slate-600">{t("partner.loginFirst")}</p>
            <LinkButton href="/partner/login?mode=signup" variant="secondary" className="mt-3">
              {t("partner.login.apply")}
            </LinkButton>
          </div>
        </div>
      ) : partner?.status === "pending" ? (
        <div className="card mt-6 flex items-center gap-3 p-5 text-amber-800">
          <Clock className="shrink-0" /> {t("partner.status.pending")}
        </div>
      ) : (
        <>
          {partner?.status === "rejected" ? (
            <div className="card mt-6 p-4 text-red-800">
              <p className="flex items-center gap-2 font-medium">
                <XCircle className="shrink-0" size={18} /> {t("partner.status.rejected")}
              </p>
              {partner.admin_note ? <p className="mt-1 text-sm">{t("partner.reason", { note: partner.admin_note })}</p> : null}
              <p className="mt-1 text-sm">{t("partner.fixAndResubmit")}</p>
            </div>
          ) : null}
          <PartnerForm initial={initial} resubmit={partner?.status === "rejected"} />
        </>
      )}
    </div>
  );
}
