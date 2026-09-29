import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/data/settings";
import { createServiceClient } from "@/lib/supabase/admin";
import { SettingsForms, type RuleRow } from "@/components/admin/SettingsForms";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireStaff([]);
  const { t } = await getT();
  const [settings, { data: rules }] = await Promise.all([getSettings(), createServiceClient().from("delivery_rules").select("*").order("match_value", { ascending: false })]);
  return (
    <div>
      <PageHeader title={t("admin.nav.settings")} subtitle={t("admin.settings.subtitle")} />
      <SettingsForms settings={settings} rules={(rules ?? []) as RuleRow[]} />
    </div>
  );
}
