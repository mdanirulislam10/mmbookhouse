"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";
import { addressSchema, normalizePhone, type AddressInput } from "@/lib/validation/address";

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

export async function saveAddress(input: AddressInput): Promise<ActionResult<{ id: string }>> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("AUTH_REQUIRED");

  const { id, ...fields } = parsed.data;
  // The first address is always the default.
  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", userId);
  const is_default = fields.is_default || (count ?? 0) === 0;

  if (id) {
    const { error } = await supabase.from("addresses").update({ ...fields, is_default }).eq("id", id).eq("user_id", userId);
    if (error) return dbError(error);
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { ok: true, data: { id } };
  }
  const { data, error } = await supabase.from("addresses").insert({ ...fields, is_default, user_id: userId }).select("id").single();
  if (error) return dbError(error);
  // Keep the profile phone filled so pickup orders always have a contact number.
  await supabase.from("profiles").update({ phone: fields.phone }).eq("id", userId).is("phone", null);
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, data: { id: data.id as string } };
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("AUTH_REQUIRED");
  const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", userId);
  if (error) return dbError(error);
  // If the default was removed, promote the newest remaining address.
  const { data: rest } = await supabase.from("addresses").select("id, is_default").eq("user_id", userId).order("created_at", { ascending: false });
  if (rest?.length && !rest.some((a) => a.is_default)) {
    await supabase.from("addresses").update({ is_default: true }).eq("id", rest[0].id);
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("AUTH_REQUIRED");
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", userId);
  if (error) return dbError(error);
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function updateProfile(input: { full_name: string; phone: string }): Promise<ActionResult> {
  const parsed = z
    .object({
      full_name: z.string().trim().min(2, "NAME_REQUIRED").max(80),
      phone: z.string().trim().transform((v) => (v === "" ? "" : normalizePhone(v))).refine((v) => v === "" || v.length === 10, "PHONE_INVALID"),
    })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("AUTH_REQUIRED");
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq("id", userId);
  if (error) return dbError(error);
  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { ok: true };
}
