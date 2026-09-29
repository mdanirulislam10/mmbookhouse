import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/data/session";
import { getMyOrder } from "@/lib/data/account";
import { getSettings } from "@/lib/data/settings";
import { Invoice } from "@/components/print/Invoice";
import { PrintBar } from "@/components/print/PrintBar";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CustomerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/account/orders/${id}/invoice`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [data, settings] = await Promise.all([getMyOrder(id), getSettings()]);
  if (!data || data.order.status === "cancelled") notFound();
  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <style>{"@page { size: A4; margin: 0 } @media print { .print-bar { display: none } }"}</style>
      <PrintBar count={1} />
      <div className="py-4 print:py-0">
        <Invoice data={{ order: data.order, items: data.items.map((i) => ({ ...i, rack_location: null, hsn_code: "4901" })) }} store={settings.store_profile} />
      </div>
    </div>
  );
}
