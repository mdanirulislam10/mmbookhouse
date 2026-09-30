import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/data/session";
import { canSeeMoney, can } from "@/lib/admin/permissions";
import { getBookForEdit, getFormLookups } from "@/lib/admin/books";
import { getT } from "@/lib/i18n/server";
import { BookForm } from "@/components/admin/BookForm";
import { RelatedEditor } from "@/components/admin/RelatedEditor";
import { PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff(["inventory_manager"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [book, lookups] = await Promise.all([getBookForEdit(id, canSeeMoney(staff.role)), getFormLookups()]);
  if (!book) notFound();
  const { t } = await getT();
  return (
    <div className="space-y-4">
      <PageHeader
        title={book.title}
        subtitle={book.title_bn || undefined}
        actions={
          <>
            <Link href={`/admin/inventory?q=${encodeURIComponent(book.title)}`} className="link text-sm">{t("admin.nav.inventory")}</Link>
            {book.status === "active" ? (
              <Link href={`/book/${book.slug}`} target="_blank" className="link inline-flex items-center gap-1 text-sm">{t("admin.viewOnStore")} <ExternalLink size={13} /></Link>
            ) : null}
          </>
        }
      />
      <BookForm initial={book} categories={lookups.categories} publishers={lookups.publishers} authors={lookups.authors} canSeeCost={canSeeMoney(staff.role)} />
      {can(staff.role, "marketing") ? (
        <Panel title={t("admin.related.title")}>
          <RelatedEditor bookId={book.id} initial={book.related} />
        </Panel>
      ) : null}
    </div>
  );
}
