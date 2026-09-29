import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { BookImport } from "@/components/admin/BookImport";
import { PageHeader } from "@/components/admin/ui";

export default async function ImportPage() {
  await requireStaff(["inventory_manager"]);
  const { t } = await getT();
  return (
    <div>
      <PageHeader title={t("admin.books.import")} subtitle={t("admin.import.subtitle")} />
      <BookImport />
    </div>
  );
}
