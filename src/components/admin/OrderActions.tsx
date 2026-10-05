"use client";

import { useState } from "react";
import { Check, KeyRound, Truck, X } from "lucide-react";
import { reviewPayment, saveShipping, setOrderStatus, verifyPickup } from "@/app/admin/actions/orders";
import { useRun } from "@/components/admin/useRun";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Panel } from "@/components/admin/ui";
import { useT } from "@/lib/i18n/client";
import type { OrderStatus } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "processing"],
  confirmed: ["processing"],
  processing: ["ready", "dispatched"],
  ready: ["dispatched", "delivered"],
  dispatched: ["delivered"],
  delivered: [],
  cancelled: [],
  returned: [],
};
const CAN_CANCEL: OrderStatus[] = ["pending", "confirmed", "processing", "ready"];
const CAN_RETURN: OrderStatus[] = ["dispatched", "delivered"];

export function OrderActions({
  orderId,
  status,
  fulfillment,
  paymentStatus,
  utr,
  courier,
  awb,
  trackingUrl,
}: {
  orderId: string;
  status: OrderStatus;
  fulfillment: "delivery" | "pickup";
  paymentStatus: string;
  utr: string | null;
  courier: string | null;
  awb: string | null;
  trackingUrl: string | null;
}) {
  const { t } = useT();
  const { run, pending } = useRun();
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [otp, setOtp] = useState("");
  const [ship, setShip] = useState({ courier_name: courier ?? "", awb: awb ?? "", tracking_url: trackingUrl ?? "" });
  const [closing, setClosing] = useState<"cancelled" | "returned" | null>(null);

  const steps = NEXT[status].filter((s) => !(s === "delivered" && fulfillment === "pickup" && status === "ready")); // pickup hand-over uses the code
  const terminal = status === "cancelled" || status === "returned";

  return (
    <div className="space-y-4">
      {paymentStatus === "pending_verification" && !terminal ? (
        <Panel title={t("admin.order.verifyPayment")} className="border-amber-300 bg-amber-50/50">
          <p className="text-sm">
            UTR: <span className="rounded bg-white px-2 py-0.5 font-mono font-semibold">{utr ?? "—"}</span>
          </p>
          <p className="mt-1 text-xs text-slate-600">{t("admin.order.verifyHint")}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={pending} onClick={() => run(() => reviewPayment({ orderId, approve: true }), { success: t("admin.order.paymentApproved") })}>
              <Check size={14} /> {t("admin.order.approve")}
            </Button>
            <Button size="sm" variant="danger" disabled={pending} onClick={() => run(() => reviewPayment({ orderId, approve: false, note: t("admin.order.paymentRejectedNote") }), { success: t("admin.order.paymentRejected") })}>
              <X size={14} /> {t("admin.order.reject")}
            </Button>
          </div>
        </Panel>
      ) : null}

      {!terminal ? (
        <Panel title={t("admin.order.moveForward")}>
          {fulfillment === "pickup" && status === "ready" ? (
            <form
              className="mb-3 flex flex-wrap items-end gap-2 rounded-lg bg-amber-50 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => verifyPickup({ orderId, otp }), { success: t("admin.order.handedOver"), onOk: () => setOtp("") });
              }}
            >
              <Field label={t("admin.order.pickupCode")} htmlFor="otp">
                <Input id="otp" inputMode="numeric" maxLength={4} pattern="\d{4}" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="w-28 text-center font-mono text-lg tracking-widest" />
              </Field>
              <Button type="submit" disabled={pending || otp.length !== 4}>
                <KeyRound size={14} /> {t("admin.order.verifyHandover")}
              </Button>
            </form>
          ) : null}
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("admin.order.notePh")} rows={2} maxLength={300} className="mb-2" />
          <div className="flex flex-wrap gap-2">
            {steps.map((s) => (
              <Button key={s} size="sm" disabled={pending} onClick={() => run(() => setOrderStatus({ orderId, status: s as "confirmed", note: note || undefined }), { onOk: () => setNote("") })}>
                {t(`admin.order.to.${s}` as DictKey)}
              </Button>
            ))}
            {CAN_CANCEL.includes(status) ? (
              <Button size="sm" variant="secondary" onClick={() => setClosing("cancelled")}>
                {t("admin.order.cancel")}
              </Button>
            ) : null}
            {CAN_RETURN.includes(status) ? (
              <Button size="sm" variant="secondary" onClick={() => setClosing("returned")}>
                {t("admin.order.markReturned")}
              </Button>
            ) : null}
          </div>

          {closing ? (
            <div className="mt-3 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-800">{closing === "cancelled" ? t("admin.order.cancelTitle") : t("admin.order.returnTitle")}</p>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("admin.order.reasonPh")} maxLength={300} />
              {closing === "returned" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="accent-amber-500" />
                  {t("admin.order.restock")}
                </label>
              ) : null}
              <div className="flex gap-2">
                <Button size="sm" variant="danger" disabled={pending || reason.trim().length < 3} onClick={() => run(() => setOrderStatus({ orderId, status: closing, note: reason, restock: closing === "cancelled" ? true : restock }), { onOk: () => setClosing(null) })}>
                  {t("common.confirm")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setClosing(null)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {fulfillment === "delivery" ? (
        <Panel title={t("admin.order.shipping")}>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveShipping({ orderId, ...ship }));
            }}
          >
            <Field label={t("order.courier")} htmlFor="s-courier">
              <Input id="s-courier" value={ship.courier_name} onChange={(e) => setShip({ ...ship, courier_name: e.target.value })} placeholder="India Post / Delhivery / DTDC" />
            </Field>
            <Field label={t("order.awb")} htmlFor="s-awb">
              <Input id="s-awb" value={ship.awb} onChange={(e) => setShip({ ...ship, awb: e.target.value })} className="font-mono" />
            </Field>
            <Field label={t("admin.order.trackingUrl")} htmlFor="s-url" className="sm:col-span-2">
              <Input id="s-url" type="url" value={ship.tracking_url} onChange={(e) => setShip({ ...ship, tracking_url: e.target.value })} placeholder="https://" />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                <Truck size={14} /> {t("common.save")}
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
