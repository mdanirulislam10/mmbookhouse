import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/data/session";
import type { PayoutRow, SalesRow } from "@/lib/partner-accounts";

export interface MyPartner {
  id: string;
  kind: "publisher" | "author" | "supplier";
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  website: string | null;
  tax_id: string | null;
  catalogue: string;
  terms_version: string;
  terms_accepted_at: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  admin_note: string | null;
}

/** The signed-in user's partner record (read through RLS), memoised per request. */
export const getMyPartner = cache(async (): Promise<MyPartner | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const { data } = await (await createClient())
    .from("partners")
    .select("id, kind, name, contact_person, email, phone, country, address, website, tax_id, catalogue, terms_version, terms_accepted_at, status, admin_note")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as MyPartner | null) ?? null;
});

/** The signed-in partner's sales statement and the payments made to them. */
export async function getMyStatement(): Promise<{ sales: SalesRow[]; payouts: PayoutRow[] }> {
  const supabase = await createClient();
  const [{ data: sales }, { data: payouts }] = await Promise.all([
    supabase.rpc("my_partner_sales"),
    supabase.from("partner_payouts").select("id, amount, currency, paid_on, method, reference, note").order("paid_on", { ascending: false }),
  ]);
  return { sales: (sales ?? []) as SalesRow[], payouts: (payouts ?? []) as PayoutRow[] };
}
