import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { providerStatus } from "@/lib/notify/config";
import { getChannelSwitches } from "@/lib/notify";
import { NotificationsPanel, type OutboxRow } from "@/components/admin/NotificationsPanel";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requireStaff([]);
  const { t } = await getT();
  const [switches, { data }] = await Promise.all([
    getChannelSwitches(),
    createServiceClient().from("outbox").select("id, channel, recipient, template, status, attempts, last_error, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <div>
      <PageHeader title={t("admin.nav.notifications")} subtitle={t("admin.notify.subtitle")} />
      <NotificationsPanel providers={providerStatus()} switches={switches} rows={(data ?? []) as OutboxRow[]} />
    </div>
  );
}
