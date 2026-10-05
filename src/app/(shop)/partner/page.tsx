import type { Metadata } from "next";
import { BookOpenCheck, Clock, ShieldAlert, XCircle } from "lucide-react";
import { getSessionUser } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/Button";
import { PartnerForm, type PartnerFormValues } from "./PartnerForm";

export const metadata: Metadata = { title: "Become a partner: publishers, authors & suppliers" };
export const dynamic = "force-dynamic";

export default async function PartnerPage() {
  const { t } = await getT();
  const user = await getSessionUser();
  const partner = user
    ? (await (await createClient()).from("partners").select("kind, name, contact_person, email, phone, country, address, website, tax_id, catalogue, status, admin_note").eq("user_id", user.id).maybeSingle()).data
    : null;

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
        <div className="card mt-6 p-5">
          <p>{t("partner.loginFirst")}</p>
          <LinkButton href="/login?next=/partner" className="mt-3">
            {t("partner.loginButton")}
          </LinkButton>
        </div>
      ) : partner?.status === "approved" ? (
        <div className="card mt-6 flex flex-wrap items-center gap-3 p-5 text-emerald-800">
          <BookOpenCheck className="shrink-0" />
          <p className="flex-1">{t("partner.status.approved")}</p>
          <LinkButton href="/partner/books">{t("partner.goBooks")}</LinkButton>
        </div>
      ) : partner?.status === "pending" ? (
        <div className="card mt-6 flex items-center gap-3 p-5 text-amber-800">
          <Clock className="shrink-0" /> {t("partner.status.pending")}
        </div>
      ) : partner?.status === "suspended" ? (
        <div className="card mt-6 p-5 text-red-800">
          <p className="flex items-center gap-2">
            <ShieldAlert className="shrink-0" /> {t("partner.status.suspended")}
          </p>
          {partner.admin_note ? <p className="mt-1 text-sm">{t("partner.reason", { note: partner.admin_note })}</p> : null}
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
