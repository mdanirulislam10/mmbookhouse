import QRCode from "qrcode";
import { publicEnv } from "@/lib/env";
import { invoiceNumber, invoiceSignature } from "@/lib/invoice";
import type { PrintOrder } from "@/lib/admin/print";
import type { StoreProfile } from "@/lib/types";
import { formatDate, formatINR } from "@/lib/utils";

/** A4 tax invoice. Printed books are nil-rated (HSN 4901), so GST is shown as 0%. */
export async function Invoice({ data, store }: { data: PrintOrder; store: StoreProfile }) {
  const { order: o, items } = data;
  const verifyUrl = `${publicEnv.siteUrl}/verify-invoice/${encodeURIComponent(o.order_no)}?sig=${invoiceSignature(o.order_no)}`;
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 160 });
  return (
    <section className="invoice-page mx-auto bg-white p-8 text-[13px] text-black" style={{ width: "210mm", minHeight: "297mm" }}>
      <header className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-extrabold">{store.name}</h1>
          <p className="max-w-xs">{store.address} {store.pincode}</p>
          {store.phone ? <p>Phone: {store.phone}</p> : null}
          {store.email ? <p>{store.email}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">TAX INVOICE</p>
          <p className="font-mono">{invoiceNumber(o.order_no)}</p>
          <p>Date: {formatDate(o.placed_at, "en")}</p>
          <p className="text-xs">Order: {o.order_no}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-6 border-b py-4">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Bill to / Ship to</p>
          <p className="font-semibold">{o.ship_name}</p>
          {o.fulfillment === "delivery" ? (
            <p>
              {o.ship_line1}{o.ship_line2 ? `, ${o.ship_line2}` : ""}<br />
              {o.ship_city}{o.ship_district ? `, ${o.ship_district}` : ""}, {o.ship_state} {o.ship_pincode}
            </p>
          ) : (
            <p>Store pickup</p>
          )}
          <p>Phone: {o.ship_phone}</p>
        </div>
        <div className="text-right">
          <p><span className="text-gray-500">Payment:</span> {o.payment_method.toUpperCase()} ({o.payment_status.replace("_", " ")})</p>
          <p><span className="text-gray-500">Place of supply:</span> {o.ship_state ?? "West Bengal"}</p>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            {["#", "Description", "HSN", "Qty", "Rate", "GST", "Amount"].map((h) => (
              <th key={h} className="border border-gray-300 px-2 py-1.5 text-xs font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((i, n) => (
            <tr key={i.id}>
              <td className="border border-gray-300 px-2 py-1.5">{n + 1}</td>
              <td className="border border-gray-300 px-2 py-1.5">{i.title}{i.isbn ? <span className="block text-[11px] text-gray-500">ISBN {i.isbn}</span> : null}</td>
              <td className="border border-gray-300 px-2 py-1.5">{i.hsn_code}</td>
              <td className="border border-gray-300 px-2 py-1.5">{i.qty}</td>
              <td className="border border-gray-300 px-2 py-1.5">{formatINR(i.unit_price)}</td>
              <td className="border border-gray-300 px-2 py-1.5">0%</td>
              <td className="border border-gray-300 px-2 py-1.5 text-right">{formatINR(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div className="text-xs text-gray-600">
          <p className="font-semibold">Declaration</p>
          <p>Printed books (HSN 4901) are nil-rated under GST. Taxable value: ₹0.00, IGST/CGST/SGST: ₹0.00.</p>
          <p className="mt-3">This is a computer generated invoice.</p>
        </div>
        <dl className="w-64 space-y-1">
          <div className="flex justify-between"><dt>Items total</dt><dd>{formatINR(o.subtotal)}</dd></div>
          {o.discount_total > 0 ? <div className="flex justify-between"><dt>Discount{o.coupon_code ? ` (${o.coupon_code})` : ""}</dt><dd>−{formatINR(o.discount_total)}</dd></div> : null}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{formatINR(o.delivery_fee)}</dd></div>
          <div className="flex justify-between border-t-2 border-black pt-1 text-base font-bold"><dt>Grand total</dt><dd>{formatINR(o.total)}</dd></div>
        </dl>
      </div>

      <footer className="mt-10 flex items-end justify-between border-t pt-4 text-xs text-gray-500">
        <div>
          <p>Scan to verify this invoice</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Invoice verification QR" width={80} height={80} className="mt-1" />
        </div>
        <p>Thank you for shopping with {store.name}!</p>
      </footer>
    </section>
  );
}
