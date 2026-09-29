import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { BulkForm } from "./BulkForm";

export const metadata: Metadata = { title: "Bulk & institutional orders" };

export default async function BulkOrderPage() {
  const { t } = await getT();
  return (
    <div className="container-page max-w-2xl py-6">
      <h1 className="text-2xl font-bold">{t("bulk.title")}</h1>
      <p className="mt-1 text-slate-600">{t("bulk.text")}</p>
      <BulkForm />
    </div>
  );
}
