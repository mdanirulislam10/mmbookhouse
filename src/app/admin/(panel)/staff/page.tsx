import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { StaffManager, type StaffRow } from "@/components/admin/StaffManager";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await requireStaff([]);
  const { t } = await getT();
  const service = createServiceClient();
  const { data } = await service.from("staff_members").select("user_id, role, display_name, is_active").order("created_at");
  const rows: StaffRow[] = [];
  for (const s of data ?? []) {
    const { data: u } = await service.auth.admin.getUserById(s.user_id as string);
    rows.push({ user_id: s.user_id as string, role: s.role as StaffRow["role"], display_name: s.display_name as string | null, email: u.user?.email ?? null, is_active: s.is_active as boolean });
  }
  return (
    <div>
      <PageHeader title={t("admin.nav.staff")} subtitle={t("admin.staff.subtitle")} />
      <StaffManager rows={rows} me={me.userId} />
    </div>
  );
}
