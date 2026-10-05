/** Partner statement types and totals, shared by the partner panel and the admin panel. */

export interface SalesRow {
  book_id: string;
  title: string;
  slug: string;
  status: string;
  currency: string;
  supply_price: number;
  sold: number;
  pending: number;
  earned: number;
}

export interface PayoutRow {
  id: string;
  amount: number;
  currency: string;
  paid_on: string;
  method: string | null;
  reference: string | null;
  note: string | null;
}

export interface CurrencyTotal {
  currency: string;
  earned: number;
  paid: number;
  balance: number;
}

/** Earned vs paid per currency (partners may be paid in rupees or a foreign currency). */
export function totalsByCurrency(sales: SalesRow[], payouts: PayoutRow[]): CurrencyTotal[] {
  const map = new Map<string, CurrencyTotal>();
  const get = (c: string) => map.get(c) ?? map.set(c, { currency: c, earned: 0, paid: 0, balance: 0 }).get(c)!;
  for (const s of sales) get(s.currency).earned += Number(s.earned);
  for (const p of payouts) get(p.currency).paid += Number(p.amount);
  for (const t of map.values()) t.balance = Math.round((t.earned - t.paid) * 100) / 100;
  return [...map.values()];
}
