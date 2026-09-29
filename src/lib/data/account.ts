import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/data/session";
import type { Address, OrderEventRow, OrderItemRow, OrderRow } from "@/lib/types";

export async function getAddresses(): Promise<Address[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("id, label, full_name, phone, line1, line2, landmark, city, district, state, pincode, is_default")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as Address[];
}

export async function getMyOrders(limit = 50): Promise<(OrderRow & { items: Pick<OrderItemRow, "title" | "cover_url" | "qty" | "slug">[] })[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(title, cover_url, qty, slug)")
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as any[]).map((o) => ({ ...o, items: o.order_items ?? [] }));
}

export async function getMyOrder(id: string): Promise<{ order: OrderRow; items: OrderItemRow[]; events: OrderEventRow[] } | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!order) return null;
  const [{ data: items }, { data: events }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("order_events").select("id, order_id, status, note, created_at").eq("order_id", id).order("created_at"),
  ]);
  return { order: order as OrderRow, items: (items ?? []) as OrderItemRow[], events: (events ?? []) as OrderEventRow[] };
}
