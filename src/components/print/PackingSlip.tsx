import type { PrintOrder } from "@/lib/admin/print";
import { formatDate } from "@/lib/utils";

/** A5 packing slip: tick-box checklist with shelf locations so the right books go in the parcel. */
export function PackingSlip({ data }: { data: PrintOrder }) {
  const { order: o, items } = data;
  return (
    <section className="slip-page bg-white p-6 text-black" style={{ width: "148mm", minHeight: "210mm", pageBreakAfter: "always", breakAfter: "page" }}>
      <header className="flex items-start justify-between border-b-2 border-black pb-2">
        <div>
          <p className="text-xs uppercase text-gray-600">Packing slip</p>
          <p className="font-mono text-xl font-extrabold">{o.order_no}</p>
          <p className="text-xs">{formatDate(o.placed_at, "en", true)}</p>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold">{o.fulfillment === "pickup" ? "STORE PICKUP" : "DELIVERY"}</p>
          <p>{o.payment_method.toUpperCase()} · {o.payment_status.replace("_", " ")}</p>
        </div>
      </header>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-600">
            <th className="w-8 py-1">✔</th>
            <th>Book</th>
            <th className="w-20">Rack</th>
            <th className="w-10 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-t border-gray-300">
              <td className="py-2"><span className="inline-block h-4 w-4 border-2 border-black" /></td>
              <td className="py-2 pr-2 font-medium">{i.title}{i.isbn ? <span className="block font-mono text-[10px] text-gray-500">{i.isbn}</span> : null}</td>
              <td className="py-2 font-mono">{i.rack_location ?? "—"}</td>
              <td className="py-2 text-right text-base font-bold">{i.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 rounded border border-gray-400 p-2 text-sm">
        <p className="font-semibold">{o.ship_name} · {o.ship_phone}</p>
        {o.fulfillment === "delivery" ? <p>{o.ship_line1}, {o.ship_city} {o.ship_pincode}</p> : null}
        {o.notes ? <p className="mt-1 rounded bg-gray-100 p-1 text-xs">Note: {o.notes}</p> : null}
      </div>
      <p className="mt-6 text-xs text-gray-500">Packed by: ____________ &nbsp; Checked by: ____________</p>
    </section>
  );
}
