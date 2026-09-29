import QRCode from "qrcode";
import type { PrintOrder } from "@/lib/admin/print";
import type { StoreProfile } from "@/lib/types";
import { formatINR } from "@/lib/utils";

/** 4×6 inch thermal shipping label. */
export async function Label({ data, store }: { data: PrintOrder; store: StoreProfile }) {
  const { order: o, items } = data;
  const qr = await QRCode.toDataURL(o.awb || o.order_no, { margin: 0, width: 200 });
  const cod = o.payment_method === "cod" && o.payment_status !== "paid";
  const units = items.reduce((n, i) => n + i.qty, 0);
  return (
    <section className="label-page relative flex flex-col justify-between bg-white p-3 text-black" style={{ width: "101.6mm", height: "152.4mm", pageBreakAfter: "always", breakAfter: "page" }}>
      <div>
        <div className="flex items-start justify-between border-b-2 border-black pb-2">
          <div>
            <p className="text-[10px] uppercase text-gray-600">From</p>
            <p className="text-sm font-bold leading-tight">{store.name}</p>
            <p className="text-[10px] leading-tight">{store.address} {store.pincode}</p>
            {store.phone ? <p className="text-[10px]">Ph: {store.phone}</p> : null}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" width={64} height={64} />
        </div>
        <div className="mt-3">
          <p className="text-[10px] uppercase text-gray-600">Deliver to</p>
          <p className="text-xl font-extrabold leading-tight">{o.ship_name}</p>
          <p className="mt-1 text-base leading-snug">
            {o.ship_line1}{o.ship_line2 ? `, ${o.ship_line2}` : ""}
            {o.ship_landmark ? <><br />Landmark: {o.ship_landmark}</> : null}
            <br />
            {o.ship_city}{o.ship_district ? `, ${o.ship_district}` : ""}
            <br />
            {o.ship_state}
          </p>
          <p className="mt-1 text-3xl font-black tracking-widest">{o.ship_pincode}</p>
          <p className="mt-1 text-base font-semibold">Phone: {o.ship_phone}</p>
        </div>
      </div>
      <div>
        <div className={`mb-2 rounded border-2 border-black p-2 text-center ${cod ? "bg-black text-white" : ""}`}>
          <p className="text-lg font-extrabold">{cod ? `COD — COLLECT ${formatINR(o.total)}` : "PREPAID — DO NOT COLLECT"}</p>
        </div>
        <div className="flex items-end justify-between border-t border-black pt-2 text-xs">
          <div>
            <p className="font-mono text-sm font-bold">{o.order_no}</p>
            <p>{units} item(s){o.courier_name ? ` · ${o.courier_name}` : ""}</p>
            {o.awb ? <p className="font-mono">AWB: {o.awb}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
