import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/data/settings";
import type { OrderItemRow, OrderRow, StoreProfile } from "@/lib/types";

export interface PrintOrder {
  order: OrderRow;
  items: (OrderItemRow & { rack_location: string | null; hsn_code: string })[];
}

export async function getOrdersForPrint(ids: string[]): Promise<{ orders: PrintOrder[]; store: StoreProfile }> {
  const service = createServiceClient();
  const valid = ids.filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 100);
  const [{ data: orders }, { data: items }, settings] = await Promise.all([
    service.from("orders").select("*").in("id", valid),
    service.from("order_items").select("*").in("order_id", valid),
    getSettings(),
  ]);
  const bookIds = [...new Set((items ?? []).map((i: any) => i.book_id).filter(Boolean))] as string[];
  const racks = new Map<string, string | null>();
  const hsn = new Map<string, string>();
  if (bookIds.length) {
    const [{ data: priv }, { data: books }] = await Promise.all([
      service.from("book_private").select("book_id, rack_location").in("book_id", bookIds),
      service.from("books").select("id, hsn_code").in("id", bookIds),
    ]);
    for (const p of priv ?? []) racks.set(p.book_id as string, p.rack_location as string | null);
    for (const b of books ?? []) hsn.set(b.id as string, b.hsn_code as string);
  }
  const byOrder = new Map<string, PrintOrder["items"]>();
  for (const it of (items ?? []) as any[]) {
    const list = byOrder.get(it.order_id) ?? [];
    list.push({ ...it, rack_location: it.book_id ? racks.get(it.book_id) ?? null : null, hsn_code: it.book_id ? hsn.get(it.book_id) ?? "4901" : "4901" });
    byOrder.set(it.order_id, list);
  }
  // Keep the order the caller asked for.
  const map = new Map((orders ?? []).map((o: any) => [o.id, o as OrderRow]));
  const ordered = valid.map((id) => map.get(id)).filter(Boolean) as OrderRow[];
  return { orders: ordered.map((order) => ({ order, items: byOrder.get(order.id) ?? [] })), store: settings.store_profile };
}
