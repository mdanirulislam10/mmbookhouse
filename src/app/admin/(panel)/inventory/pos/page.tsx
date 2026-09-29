import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { PosScreen } from "@/components/admin/PosScreen";
import { PageHeader } from "@/components/admin/ui";

export default async function PosPage() {
  await requireStaff(["inventory_manager"]);
  const { t } = await getT();
  return (
    <div>
      <PageHeader title={t("admin.pos.title")} subtitle={t("admin.pos.subtitle")} />
      <PosScreen />
    </div>
  );
}
