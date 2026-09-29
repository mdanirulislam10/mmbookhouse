import { requireStaff } from "@/lib/data/session";
import { canSeeMoney } from "@/lib/admin/permissions";
import { getFormLookups } from "@/lib/admin/books";
import { getT } from "@/lib/i18n/server";
import { BookForm } from "@/components/admin/BookForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewBookPage() {
  const staff = await requireStaff(["inventory_manager"]);
  const { t } = await getT();
  const { categories, publishers } = await getFormLookups();
  return (
    <div>
      <PageHeader title={t("admin.books.new")} />
      <BookForm categories={categories} publishers={publishers} canSeeCost={canSeeMoney(staff.role)} />
    </div>
  );
}
