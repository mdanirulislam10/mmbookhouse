"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";

function refresh() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
}

export async function adjustStock(input: { bookId: string; delta: number; reason: "restock" | "adjust" | "return"; note?: string }): Promise<ActionResult<{ onHand: number }>> {
  const parsed = z
    .object({ bookId: uuid, delta: z.number().int().min(-100000).max(100000).refine((n) => n !== 0, "DELTA_ZERO"), reason: z.enum(["restock", "adjust", "return"]), note: z.string().trim().max(200).optional() })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("inventory");
  if (!staff) return FORBIDDEN;
  const v = parsed.data;
  const { data, error } = await createServiceClient().rpc("admin_adjust_stock", { p_book: v.bookId, p_delta: v.delta, p_reason: v.reason, p_note: v.note || null, p_actor: staff.userId });
  if (error) return dbError(error);
  await writeAudit(staff, "stock.adjust", "book", v.bookId, { after: { delta: v.delta, reason: v.reason, onHand: data } });
  refresh();
  return { ok: true, data: { onHand: data as number } };
}

export async function setStock(input: { bookId: string; onHand: number; note?: string }): Promise<ActionResult<{ onHand: number }>> {
  const parsed = z.object({ bookId: uuid, onHand: z.number().int().min(0).max(1_000_000), note: z.string().trim().max(200).optional() }).safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("inventory");
  if (!staff) return FORBIDDEN;
  const { data, error } = await createServiceClient().rpc("admin_set_stock", { p_book: parsed.data.bookId, p_on_hand: parsed.data.onHand, p_note: parsed.data.note || "Stock count", p_actor: staff.userId });
  if (error) return dbError(error);
  await writeAudit(staff, "stock.set", "book", parsed.data.bookId, { after: parsed.data.onHand });
  refresh();
  return { ok: true, data: { onHand: data as number } };
}

/** Walk-in sale at the shop counter: reduces stock and records a delivered, paid order. */
export async function posSale(input: {
  items: { bookId: string; qty: number; unitPrice?: number }[];
  payment: "cash" | "upi";
  customer?: string;
  phone?: string;
}): Promise<ActionResult<{ orderId: string; orderNo: string; total: number }>> {
  const parsed = z
    .object({
      items: z.array(z.object({ bookId: uuid, qty: z.number().int().min(1).max(999), unitPrice: z.number().min(0).max(1_000_000).optional() })).min(1).max(60),
      payment: z.enum(["cash", "upi"]),
      customer: z.string().trim().max(80).optional(),
      phone: z.string().trim().max(20).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("inventory");
  if (!staff) return FORBIDDEN;
  const v = parsed.data;
  const { data, error } = await createServiceClient().rpc("admin_pos_sale", {
    p_items: v.items.map((i) => ({ book_id: i.bookId, qty: i.qty, unit_price: i.unitPrice ?? null })),
    p_actor: staff.userId,
    p_payment: v.payment,
    p_customer: v.customer || null,
    p_phone: v.phone || null,
  });
  if (error) return dbError(error);
  const r = data as { order_id: string; order_no: string; total: number };
  await writeAudit(staff, "pos.sale", "order", r.order_id, { after: { total: r.total, items: v.items.length } });
  refresh();
  revalidatePath("/admin/orders");
  return { ok: true, data: { orderId: r.order_id, orderNo: r.order_no, total: Number(r.total) } };
}
