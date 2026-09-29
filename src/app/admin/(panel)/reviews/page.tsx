import { requireStaff } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { QuestionsQueue, ReviewsQueue, type QuestionItem, type ReviewItem } from "@/components/admin/ModerationLists";
import { PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  await requireStaff(["inventory_manager"]);
  const { t } = await getT();
  const service = createServiceClient();
  const [{ data: reviews }, { data: questions }] = await Promise.all([
    service.from("reviews").select("id, reviewer_name, rating, title, body, verified_purchase, created_at, books(title)").eq("status", "pending").order("created_at").limit(50),
    service.from("book_questions").select("id, asker_name, question, created_at, books(title)").eq("status", "pending").order("created_at").limit(50),
  ]);
  const r = ((reviews ?? []) as any[]).map((x) => ({ ...x, book_title: x.books?.title ?? "" })) as ReviewItem[];
  const q = ((questions ?? []) as any[]).map((x) => ({ ...x, book_title: x.books?.title ?? "" })) as QuestionItem[];
  return (
    <div className="space-y-4">
      <PageHeader title={t("admin.nav.reviews")} subtitle={t("admin.reviews.subtitle")} />
      <Panel title={`${t("reviews.title")} (${r.length})`} padded={false}><ReviewsQueue reviews={r} /></Panel>
      <Panel title={`${t("qa.title")} (${q.length})`} padded={false}><QuestionsQueue items={q} /></Panel>
    </div>
  );
}
