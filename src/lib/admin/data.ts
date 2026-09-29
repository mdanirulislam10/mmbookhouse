import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

export interface Counters {
  pending_orders: number;
  verify_payments: number;
  low_stock: number;
  enquiries: number;
  reviews: number;
}

const ZERO: Counters = { pending_orders: 0, verify_payments: 0, low_stock: 0, enquiries: 0, reviews: 0 };

export async function getCounters(): Promise<Counters> {
  const { data, error } = await createServiceClient().rpc("admin_counters");
  if (error) {
    console.error("[admin] counters:", error.message);
    return ZERO;
  }
  return { ...ZERO, ...(data as Partial<Counters>) };
}

export interface Dashboard {
  today: { sales: number; orders: number };
  yesterday: { sales: number; orders: number };
  period: { sales: number; orders: number; aov: number; profit: number };
  to_dispatch: number;
  series: { d: string; sales: number; orders: number }[];
  top_books: { title: string; qty: number; revenue: number }[];
}

export async function getDashboard(days = 30): Promise<Dashboard | null> {
  const { data, error } = await createServiceClient().rpc("admin_dashboard", { p_days: days });
  if (error) {
    console.error("[admin] dashboard:", error.message);
    return null;
  }
  return data as Dashboard;
}

export async function getLowStock(limit = 20) {
  const { data } = await createServiceClient().rpc("admin_low_stock", { p_limit: limit });
  return (data ?? []) as { book_id: string; title: string; slug: string; on_hand: number; threshold: number; rack_location: string | null }[];
}

export const PAGE_SIZE = 20;

/** Escape a user string for use inside a PostgREST ilike/or filter. */
export function likeTerm(q: string): string {
  return q.replace(/[%_\\,()*]/g, " ").trim();
}
