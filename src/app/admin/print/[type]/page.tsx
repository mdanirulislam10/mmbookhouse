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

/**
 * Browsers round a sheet that is exactly one page tall up to a second page, so the extra blank sheet appears.
 * On paper every sheet is a hair shorter than the page, the screen-height wrappers are neutralised, and no
 * page break follows the last sheet.
 */
const PRINT_FIX = `@media print {
  .print-bar { display: none }
  html, body, .min-h-screen { min-height: 0 !important; height: auto !important; }
  .invoice-page { min-height: 296mm !important; break-after: page; page-break-after: always; }
  .slip-page { min-height: 209mm !important; }
  .label-page { height: 151.5mm !important; overflow: hidden; }
  .invoice-page:last-child, .slip-page:last-child, .label-page:last-child { break-after: auto !important; page-break-after: auto !important; }
}`;

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
      <style>{`${PAGE_CSS[type]} body { background: white; } ${PRINT_FIX}`}</style>
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
