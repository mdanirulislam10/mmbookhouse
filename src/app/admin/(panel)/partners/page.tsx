import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { PartnerApplications, PartnerSubmissions, type PartnerItem, type SubmissionItem } from "@/components/admin/PartnerLists";
import { PageHeader } from "@/components/admin/ui";
import type { PayoutRow, SalesRow } from "@/lib/partner-accounts";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await requireStaff([]);
  const { t } = await getT();
  const service = createServiceClient();
  const [{ data: partners }, { data: subs }] = await Promise.all([
    service.from("partners").select("*").order("status").order("created_at", { ascending: false }).limit(200),
    service.from("partner_submissions").select("*, partners(name)").order("status").order("created_at", { ascending: false }).limit(200),
  ]);
  // Pending first, then the rest newest first.
  const rank = (s: string) => (s === "pending" ? 0 : 1);
  const active = (partners ?? []).filter((p) => p.status === "approved" || p.status === "suspended");
  const [{ data: payouts }, ...sales] = await Promise.all([
    service.from("partner_payouts").select("id, partner_id, amount, currency, paid_on, method, reference, note").order("paid_on", { ascending: false }),
    ...active.map((p) => service.rpc("partner_sales_for", { p_partner: p.id })),
  ]);
  const accounts = new Map(
    active.map((p, i) => [p.id as string, { sales: (sales[i].data ?? []) as SalesRow[], payouts: ((payouts ?? []) as (PayoutRow & { partner_id: string })[]).filter((x) => x.partner_id === p.id) }]),
  );
  const applications = ((partners ?? []) as PartnerItem[])
    .map((p) => ({ ...p, account: accounts.get(p.id) }))
    .sort((a, b) => rank(a.status) - rank(b.status));
  const submissions = ((subs ?? []) as (Omit<SubmissionItem, "partner_name"> & { partners: { name: string } | null })[])
    .map(({ partners: p, ...s }) => ({ ...s, partner_name: p?.name ?? "—" }))
    .sort((a, b) => rank(a.status) - rank(b.status));

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.nav.partners")} subtitle={t("admin.partners.subtitle")} />
      <section>
        <h2 className="mb-2 font-semibold">{t("admin.partners.books")}</h2>
        <PartnerSubmissions items={submissions} />
      </section>
      <section>
        <h2 className="mb-2 font-semibold">{t("admin.partners.applications")}</h2>
        <PartnerApplications items={applications} />
      </section>
    </div>
  );
}
