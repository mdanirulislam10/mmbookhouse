"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionResult } from "@/lib/actions";
import { defer, notifyOwnerText } from "@/lib/notify";
import { PARTNER_TERMS_VERSION, partnerApplicationSchema, partnerBookSchema, type PartnerApplicationInput, type PartnerBookInput } from "@/lib/validation/partner";

/** Apply (or re-apply after a rejection) as a publisher, author or supplier. */
export async function applyAsPartner(input: PartnerApplicationInput): Promise<ActionResult> {
  const parsed = partnerApplicationSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("AUTH_REQUIRED");
  const { terms: _terms, ...p } = parsed.data;
  const { error } = await supabase.rpc("apply_partner", { p, p_terms_version: PARTNER_TERMS_VERSION });
  if (error) return dbError(error);
  revalidatePath("/partner");
  revalidatePath("/admin/partners");
  defer(() => notifyOwnerText(`New partner application: ${p.name} (${p.kind}, ${p.country})`, "/admin/partners"));
  return { ok: true };
}

/** A partner keeps their contact details up to date (name, type and status are managed by the shop). */
export async function updatePartnerProfile(input: Omit<PartnerApplicationInput, "terms" | "name" | "kind">): Promise<ActionResult> {
  const parsed = partnerApplicationSchema.omit({ terms: true, name: true, kind: true }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_partner_profile", { p: parsed.data });
  if (error) return dbError(error);
  revalidatePath("/partner/profile");
  revalidatePath("/admin/partners");
  return { ok: true };
}

/** An approved partner submits a book for the shop to review. */
export async function submitPartnerBook(input: PartnerBookInput): Promise<ActionResult> {
  const parsed = partnerBookSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("AUTH_REQUIRED");
  const { error } = await supabase.rpc("submit_partner_book", { p: parsed.data });
  if (error) return dbError(error);
  revalidatePath("/partner/books");
  revalidatePath("/admin/partners");
  return { ok: true };
}
