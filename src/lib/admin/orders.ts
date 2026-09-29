import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, likeTerm } from "@/lib/admin/data";
import type { OrderEventRow, OrderItemRow, OrderRow } from "@/lib/types";

export const ORDER_TABS = ["all", "pending", "verify", "processing", "ready", "dispatched", "delivered", "cancelled", "pos"] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export interface AdminOrderListRow extends OrderRow {
  order_items: { qty: number; title: string }[];
}

export async function listOrders(opts: { tab: OrderTab; q?: string; page: number }): Promise<{ rows: AdminOrderListRow[]; total: number }> {
  const service = createServiceClient();
  let query = service.from("orders").select("*, order_items(qty, title)", { count: "exact" }).order("placed_at", { ascending: false });

  switch (opts.tab) {
    case "pending":
      query = query.eq("status", "pending").eq("channel", "online");
      break;
    case "verify":
      query = query.eq("payment_status", "pending_verification").not("status", "in", "(cancelled,returned)");
      break;
    case "processing":
      query = query.in("status", ["confirmed", "processing"]);
      break;
    case "ready":
      query = query.eq("status", "ready");
      break;
    case "dispatched":
      query = query.eq("status", "dispatched");
      break;
    case "delivered":
      query = query.eq("status", "delivered").eq("channel", "online");
      break;
    case "cancelled":
      query = query.in("status", ["cancelled", "returned"]);
      break;
    case "pos":
      query = query.eq("channel", "pos");
      break;
  }

  const term = opts.q ? likeTerm(opts.q) : "";
  if (term) {
    query = query.or(`order_no.ilike.%${term}%,ship_name.ilike.%${term}%,ship_phone.ilike.%${term}%,awb.ilike.%${term}%,customer_email.ilike.%${term}%`);
  }
  const from = (opts.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) console.error("[admin] listOrders:", error.message);
  return { rows: (data ?? []) as unknown as AdminOrderListRow[], total: count ?? 0 };
}

export async function tabCounts(): Promise<Record<OrderTab, number>> {
  const service = createServiceClient();
  const head = () => service.from("orders").select("id", { count: "exact", head: true });
  const [all, pending, verify, processing, ready, dispatched, delivered, cancelled, pos] = await Promise.all([
    head(),
    head().eq("status", "pending").eq("channel", "online"),
    head().eq("payment_status", "pending_verification").not("status", "in", "(cancelled,returned)"),
    head().in("status", ["confirmed", "processing"]),
    head().eq("status", "ready"),
    head().eq("status", "dispatched"),
    head().eq("status", "delivered").eq("channel", "online"),
    head().in("status", ["cancelled", "returned"]),
    head().eq("channel", "pos"),
  ]);
  return {
    all: all.count ?? 0,
    pending: pending.count ?? 0,
    verify: verify.count ?? 0,
    processing: processing.count ?? 0,
    ready: ready.count ?? 0,
    dispatched: dispatched.count ?? 0,
    delivered: delivered.count ?? 0,
    cancelled: cancelled.count ?? 0,
    pos: pos.count ?? 0,
  };
}

export interface AdminOrderDetail {
  order: OrderRow;
  items: (OrderItemRow & { unit_cost: number | null; rack_location: string | null })[];
  events: (OrderEventRow & { actor_name: string | null })[];
  payments: { id: string; method: string; amount: number; status: string; utr: string | null; created_at: string; verified_at: string | null }[];
}

export async function getOrderDetail(id: string, withCosts: boolean): Promise<AdminOrderDetail | null> {
  const service = createServiceClient();
  const { data: order } = await service.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return null;
  const [{ data: items }, { data: events }, { data: payments }] = await Promise.all([
    service.from("order_items").select("*, order_item_costs(unit_cost)").eq("order_id", id),
    service.from("order_events").select("id, order_id, status, note, created_at, actor_id").eq("order_id", id).order("created_at"),
    service.from("payments").select("id, method, amount, status, utr, created_at, verified_at").eq("order_id", id).order("created_at"),
  ]);
  const bookIds = (items ?? []).map((i: any) => i.book_id).filter(Boolean);
  const racks = new Map<string, string | null>();
  if (bookIds.length) {
    const { data: priv } = await service.from("book_private").select("book_id, rack_location").in("book_id", bookIds);
    for (const p of priv ?? []) racks.set(p.book_id as string, p.rack_location as string | null);
  }
  const actorIds = [...new Set((events ?? []).map((e: any) => e.actor_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: profs } = await service.from("profiles").select("id, full_name").in("id", actorIds);
    for (const p of profs ?? []) names.set(p.id as string, (p.full_name as string) ?? "");
  }
  return {
    order: order as OrderRow,
    items: (items ?? []).map((i: any) => ({
      ...i,
      unit_cost: withCosts ? i.order_item_costs?.unit_cost ?? null : null,
      rack_location: i.book_id ? racks.get(i.book_id) ?? null : null,
    })),
    events: (events ?? []).map((e: any) => ({ ...e, actor_name: e.actor_id ? names.get(e.actor_id) ?? null : null })),
    payments: (payments ?? []) as AdminOrderDetail["payments"],
  };
}
