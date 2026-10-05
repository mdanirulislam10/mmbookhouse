import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/session";
import { getMyPartner } from "@/lib/data/partner";
import { getT } from "@/lib/i18n/server";
import { PartnerShell } from "@/components/partner/PartnerShell";
import { formatDate } from "@/lib/utils";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Partner profile" };
export const dynamic = "force-dynamic";

export default async function PartnerProfilePage() {
  await requireUser("/partner/profile");
  const partner = await getMyPartner();
  if (!partner || (partner.status !== "approved" && partner.status !== "suspended")) redirect("/partner");
  const { t, lang } = await getT();

  return (
    <PartnerShell partner={partner} active="profile">
      <dl className="card grid gap-x-6 gap-y-2 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">{t("partner.name")}</dt>
          <dd className="font-medium">{partner.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t("partner.kind")}</dt>
          <dd className="font-medium">{t(`partner.kind.${partner.kind}`)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">{t("partner.termsLink")}</dt>
          <dd>
            {t("admin.partners.termsAccepted", { v: partner.terms_version, date: formatDate(partner.terms_accepted_at, lang) })} ·{" "}
            <Link href="/partner/terms" className="link">
              {t("partner.termsTitle")}
            </Link>
          </dd>
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2">{t("partner.profile.fixedHint")}</p>
      </dl>
      <ProfileForm
        initial={{
          contact_person: partner.contact_person,
          email: partner.email,
          phone: partner.phone,
          country: partner.country,
          address: partner.address,
          website: partner.website ?? "",
          tax_id: partner.tax_id ?? "",
          catalogue: partner.catalogue,
        }}
      />
    </PartnerShell>
  );
}
