import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/data/session";
import { getOrdersForPrint } from "@/lib/admin/print";
import { Invoice } from "@/components/print/Invoice";
import { Label } from "@/components/print/Label";
import { PackingSlip } from "@/components/print/PackingSlip";
import { PrintBar } from "@/components/print/PrintBar";
import { first } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_CSS: Record<string, string> = {
  label: "@page { size: 101.6mm 152.4mm; margin: 0 }",
  slip: "@page { size: A5; margin: 0 }",
  invoice: "@page { size: A4; margin: 0 }",
};

export default async function PrintPage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff(["dispatch_staff", "inventory_manager"]);
  const { type } = await params;
  if (!(type in PAGE_CSS)) notFound();
  // Inventory managers only print counter (POS) receipts, never shipping labels or online orders.
  const counterOnly = staff.role === "inventory_manager";
  if (counterOnly && type !== "invoice") notFound();
  const ids = (first((await searchParams).ids) ?? "").split(",").filter(Boolean);
  if (!ids.length) notFound();
  const { orders: all, store } = await getOrdersForPrint(ids);
  const orders = counterOnly ? all.filter((o) => o.order.channel === "pos") : all;
  if (!orders.length) notFound();

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <style>{`${PAGE_CSS[type]} body { background: white; } @media print { .print-bar { display: none } }`}</style>
      <PrintBar count={orders.length} />
      {/* Sheets have fixed paper sizes; on a phone the preview scrolls sideways instead of being cut off on the left. */}
      <div className="overflow-x-auto">
        <div className="mx-auto flex w-max flex-col gap-4 py-4 print:w-auto print:gap-0 print:py-0">
          {type === "label" ? await Promise.all(orders.map(async (o) => <Label key={o.order.id} data={o} store={store} />)) : null}
          {type === "slip" ? orders.map((o) => <PackingSlip key={o.order.id} data={o} />) : null}
          {type === "invoice" ? await Promise.all(orders.map(async (o) => <Invoice key={o.order.id} data={o} store={store} />)) : null}
        </div>
      </div>
    </div>
  );
}
