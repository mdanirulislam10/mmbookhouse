"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";

const STATUSES = ["confirmed", "processing", "ready", "dispatched", "delivered", "cancelled", "returned"] as const;

function refresh(id?: string) {
  revalidatePath("/admin/orders");
  if (id) revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export async function setOrderStatus(input: { orderId: string; status: (typeof STATUSES)[number]; note?: string; restock?: boolean }): Promise<ActionResult> {
  const parsed = z.object({ orderId: uuid, status: z.enum(STATUSES), note: z.string().trim().max(300).optional(), restock: z.boolean().optional() }).safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("orders");
  if (!staff) return FORBIDDEN;
  const v = parsed.data;
  if ((v.status === "cancelled" || v.status === "returned") && !v.note) return fail("NOTE_REQUIRED");

  const service = createServiceClient();
  const { data: before } = await service.from("orders").select("status").eq("id", v.orderId).maybeSingle();
  const { error } = await service.rpc("admin_set_order_status", {
    p_order: v.orderId,
    p_status: v.status,
    p_note: v.note || null,
    p_actor: staff.userId,
    p_restock: v.restock ?? true,
  });
  if (error) return dbError(error);
  await writeAudit(staff, "order.status", "order", v.orderId, { before: before?.status, after: v.status });
  refresh(v.orderId);
  return { ok: true };
}

export async function reviewPayment(input: { orderId: string; approve: boolean; note?: string }): Promise<ActionResult> {
  const parsed = z.object({ orderId: uuid, approve: z.boolean(), note: z.string().trim().max(300).optional() }).safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("orders");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient().rpc("admin_review_payment", {
    p_order: parsed.data.orderId,
    p_approve: parsed.data.approve,
    p_note: parsed.data.note || null,
    p_actor: staff.userId,
  });
  if (error) return dbError(error);
  await writeAudit(staff, parsed.data.approve ? "payment.approve" : "payment.reject", "order", parsed.data.orderId);
  refresh(parsed.data.orderId);
  return { ok: true };
}

export async function saveShipping(input: { orderId: string; courier_name: string; awb: string; tracking_url: string }): Promise<ActionResult> {
  const parsed = z
    .object({
      orderId: uuid,
      courier_name: z.string().trim().max(60),
      awb: z.string().trim().max(60),
      tracking_url: z.string().trim().max(300).refine((u) => u === "" || /^https?:\/\//i.test(u), "URL_INVALID"),
    })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("orders");
  if (!staff) return FORBIDDEN;
  const v = parsed.data;
  const { error } = await createServiceClient()
    .from("orders")
    .update({ courier_name: v.courier_name || null, awb: v.awb || null, tracking_url: v.tracking_url || null })
    .eq("id", v.orderId);
  if (error) return dbError(error);
  await writeAudit(staff, "order.shipping", "order", v.orderId, { after: { courier: v.courier_name, awb: v.awb } });
  refresh(v.orderId);
  return { ok: true };
}

/** Counter hand-over of a store-pickup order: staff types the customer's 4-digit code. */
export async function verifyPickup(input: { orderId: string; otp: string }): Promise<ActionResult> {
  const parsed = z.object({ orderId: uuid, otp: z.string().trim().regex(/^\d{4}$/, "OTP_INVALID") }).safeParse(input);
  if (!parsed.success) return fail("OTP_INVALID");
  const staff = await authorize("orders");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const { data: order } = await service.from("orders").select("pickup_otp, fulfillment, status").eq("id", parsed.data.orderId).maybeSingle();
  if (!order || order.fulfillment !== "pickup") return fail("ORDER_NOT_FOUND");
  if (order.pickup_otp !== parsed.data.otp) return fail("OTP_MISMATCH");
  const { error } = await service.rpc("admin_set_order_status", {
    p_order: parsed.data.orderId,
    p_status: "delivered",
    p_note: "Collected at counter (code verified)",
    p_actor: staff.userId,
    p_restock: true,
  });
  if (error) return dbError(error);
  await writeAudit(staff, "order.pickup", "order", parsed.data.orderId);
  refresh(parsed.data.orderId);
  return { ok: true };
}

/** Move many orders one step forward (e.g. mark as packing). Returns how many succeeded. */
export async function bulkSetStatus(input: { orderIds: string[]; status: "confirmed" | "processing" | "ready" | "dispatched" }): Promise<ActionResult<{ done: number; failed: number }>> {
  const parsed = z.object({ orderIds: z.array(uuid).min(1).max(100), status: z.enum(["confirmed", "processing", "ready", "dispatched"]) }).safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("orders");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  let done = 0;
  let failed = 0;
  for (const id of parsed.data.orderIds) {
    const { error } = await service.rpc("admin_set_order_status", { p_order: id, p_status: parsed.data.status, p_note: null, p_actor: staff.userId, p_restock: true });
    if (error) failed++;
    else done++;
  }
  await writeAudit(staff, "order.bulk_status", "order", null, { after: { status: parsed.data.status, done, failed } });
  refresh();
  return { ok: true, data: { done, failed } };
}
