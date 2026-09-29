"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";
import { defer, notifyCustomer, notifyOrderPlaced, notifyPaymentSubmitted } from "@/lib/notify";

const placeSchema = z.object({
  addressId: uuid.nullable(),
  paymentMethod: z.enum(["cod", "upi"]),
  fulfillment: z.enum(["delivery", "pickup"]),
  coupon: z.string().trim().max(24).optional(),
  notes: z.string().trim().max(500).optional(),
  buyNow: z.object({ bookId: uuid, qty: z.number().int().min(1).max(99) }).optional(),
});

export type PlaceOrderInput = z.input<typeof placeSchema>;

export async function placeOrder(input: PlaceOrderInput): Promise<ActionResult<{ orderId: string; orderNo: string; total: number; paymentMethod: string }>> {
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const v = parsed.data;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("AUTH_REQUIRED");

  const { data, error } = await supabase.rpc("place_order", {
    p_address_id: v.addressId,
    p_payment_method: v.paymentMethod,
    p_fulfillment: v.fulfillment,
    p_coupon: v.coupon || null,
    p_notes: v.notes || null,
    p_items: v.buyNow ? [{ book_id: v.buyNow.bookId, qty: v.buyNow.qty }] : null,
  });
  if (error) return dbError(error);
  const r = data as { order_id: string; order_no: string; total: number; payment_method: string };
  revalidatePath("/", "layout");
  defer(() => notifyOrderPlaced(r.order_id));
  return { ok: true, data: { orderId: r.order_id, orderNo: r.order_no, total: Number(r.total), paymentMethod: r.payment_method } };
}

export async function submitUtr(orderId: string, utr: string): Promise<ActionResult> {
  const parsed = z.object({ orderId: uuid, utr: z.string().trim().regex(/^[0-9A-Za-z]{10,22}$/, "UTR_INVALID") }).safeParse({ orderId, utr });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_utr", { p_order: parsed.data.orderId, p_utr: parsed.data.utr.toUpperCase() });
  if (error) return dbError(error);
  revalidatePath(`/account/orders/${orderId}`);
  defer(() => notifyPaymentSubmitted(orderId));
  return { ok: true };
}

export async function cancelMyOrder(orderId: string, reason?: string): Promise<ActionResult> {
  if (!uuid.safeParse(orderId).success) return fail("INVALID_INPUT");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_order", { p_order: orderId, p_reason: reason ?? null });
  if (error) return dbError(error);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  defer(() => notifyCustomer(orderId, "cancelled", { reason: reason ?? undefined }));
  return { ok: true };
}

export async function trackOrder(orderNo: string, phone: string): Promise<ActionResult<Record<string, unknown> | null>> {
  const parsed = z.object({ orderNo: z.string().trim().min(6).max(30), phone: z.string().trim().min(8).max(20) }).safeParse({ orderNo, phone });
  if (!parsed.success) return fail("INVALID_INPUT");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("track_order", { p_order_no: parsed.data.orderNo, p_phone: parsed.data.phone });
  if (error) return dbError(error);
  return { ok: true, data: (data as Record<string, unknown> | null) ?? null };
}
