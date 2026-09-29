import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { EnquiryList, type EnquiryItem } from "@/components/admin/ModerationLists";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  await requireStaff([]);
  const { t } = await getT();
  const { data } = await createServiceClient().from("enquiries").select("*").order("status").order("created_at", { ascending: false }).limit(100);
  return (
    <div>
      <PageHeader title={t("admin.nav.enquiries")} subtitle={t("admin.enquiries.subtitle")} />
      <EnquiryList items={(data ?? []) as EnquiryItem[]} />
    </div>
  );
}
