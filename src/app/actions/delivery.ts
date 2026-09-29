"use server";

import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { fail, type ActionResult } from "@/lib/actions";
import type { DeliveryQuote } from "@/lib/types";

/** Delivery fee / ETA / COD availability for a pincode and order value. */
export async function getDeliveryQuote(pincode: string, subtotal: number): Promise<ActionResult<DeliveryQuote | null>> {
  const parsed = z.object({ pincode: z.string().regex(/^[1-9][0-9]{5}$/), subtotal: z.number().min(0).max(1e7) }).safeParse({ pincode, subtotal });
  if (!parsed.success) return fail("PINCODE_INVALID");
  const { data, error } = await createPublicClient().rpc("quote_delivery", { p_pincode: parsed.data.pincode, p_subtotal: parsed.data.subtotal });
  if (error) return fail("GENERIC");
  const row = (data as DeliveryQuote[] | null)?.[0] ?? null;
  return { ok: true, data: row };
}
