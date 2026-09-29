"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";

const MAX_QTY = 10;

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function addToCart(bookId: string, qty = 1): Promise<ActionResult<{ qty: number; capped: boolean }>> {
  const parsed = z.object({ bookId: uuid, qty: z.number().int().min(1).max(MAX_QTY) }).safeParse({ bookId, qty });
  if (!parsed.success) return fail("INVALID_INPUT");
  const { supabase, userId } = await requireUserId();
  if (!userId) return fail("AUTH_REQUIRED");

  const { data: book } = await supabase.from("v_books").select("on_hand").eq("id", parsed.data.bookId).maybeSingle();
  if (!book) return fail("BOOK_UNAVAILABLE");
  if (book.on_hand < 1) return fail("OUT_OF_STOCK");

  const { data: existing } = await supabase
    .from("cart_items")
    .select("qty, saved_for_later")
    .eq("user_id", userId)
    .eq("book_id", parsed.data.bookId)
    .maybeSingle();
  const current = existing && !existing.saved_for_later ? existing.qty : 0;
  const wanted = current + parsed.data.qty;
  const finalQty = Math.min(wanted, book.on_hand, MAX_QTY);

  const { error } = await supabase
    .from("cart_items")
    .upsert({ user_id: userId, book_id: parsed.data.bookId, qty: finalQty, saved_for_later: false }, { onConflict: "user_id,book_id" });
  if (error) return dbError(error);
  refresh();
  return { ok: true, data: { qty: finalQty, capped: finalQty < wanted } };
}

export async function setCartQty(bookId: string, qty: number): Promise<ActionResult<{ qty: number; capped: boolean }>> {
  const parsed = z.object({ bookId: uuid, qty: z.number().int().min(0).max(99) }).safeParse({ bookId, qty });
  if (!parsed.success) return fail("INVALID_INPUT");
  const { supabase, userId } = await requireUserId();
  if (!userId) return fail("AUTH_REQUIRED");

  if (parsed.data.qty === 0) {
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).eq("book_id", parsed.data.bookId);
    if (error) return dbError(error);
    refresh();
    return { ok: true, data: { qty: 0, capped: false } };
  }
  const { data: book } = await supabase.from("v_books").select("on_hand").eq("id", parsed.data.bookId).maybeSingle();
  if (!book) return fail("BOOK_UNAVAILABLE");
  const finalQty = Math.min(parsed.data.qty, Math.max(book.on_hand, 1), MAX_QTY);
  const { error } = await supabase.from("cart_items").update({ qty: finalQty }).eq("user_id", userId).eq("book_id", parsed.data.bookId);
  if (error) return dbError(error);
  refresh();
  return { ok: true, data: { qty: finalQty, capped: finalQty < parsed.data.qty } };
}

export async function removeFromCart(bookId: string): Promise<ActionResult> {
  return (await setCartQty(bookId, 0)) as ActionResult;
}

export async function setSavedForLater(bookId: string, saved: boolean): Promise<ActionResult> {
  const parsed = z.object({ bookId: uuid, saved: z.boolean() }).safeParse({ bookId, saved });
  if (!parsed.success) return fail("INVALID_INPUT");
  const { supabase, userId } = await requireUserId();
  if (!userId) return fail("AUTH_REQUIRED");
  const { error } = await supabase
    .from("cart_items")
    .update({ saved_for_later: parsed.data.saved })
    .eq("user_id", userId)
    .eq("book_id", parsed.data.bookId);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

export async function toggleWishlist(bookId: string): Promise<ActionResult<{ wished: boolean }>> {
  const parsed = uuid.safeParse(bookId);
  if (!parsed.success) return fail("INVALID_INPUT");
  const { supabase, userId } = await requireUserId();
  if (!userId) return fail("AUTH_REQUIRED");

  const { data: existing } = await supabase.from("wishlist_items").select("book_id").eq("user_id", userId).eq("book_id", bookId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("book_id", bookId);
    if (error) return dbError(error);
    revalidatePath("/account/wishlist");
    return { ok: true, data: { wished: false } };
  }
  const { error } = await supabase.from("wishlist_items").insert({ user_id: userId, book_id: bookId });
  if (error) return dbError(error);
  revalidatePath("/account/wishlist");
  return { ok: true, data: { wished: true } };
}

export async function requestStockAlert(bookId: string): Promise<ActionResult> {
  const parsed = uuid.safeParse(bookId);
  if (!parsed.success) return fail("INVALID_INPUT");
  const { supabase, userId } = await requireUserId();
  if (!userId) return fail("AUTH_REQUIRED");
  const { error } = await supabase.from("stock_alerts").upsert({ user_id: userId, book_id: bookId }, { onConflict: "user_id,book_id", ignoreDuplicates: true });
  if (error) return dbError(error);
  return { ok: true };
}

/** Cart-page coupon preview (does not consume the coupon). */
export async function previewCoupon(code: string, subtotal: number): Promise<ActionResult<{ code: string; discount: number }>> {
  const parsed = z.object({ code: z.string().trim().min(3).max(24), subtotal: z.number().min(0) }).safeParse({ code, subtotal });
  if (!parsed.success) return fail("COUPON_INVALID");
  const { supabase, userId } = await requireUserId();
  if (!userId) return fail("AUTH_REQUIRED");
  const { data, error } = await supabase.rpc("validate_coupon", { p_code: parsed.data.code, p_subtotal: parsed.data.subtotal });
  if (error) return dbError(error);
  return { ok: true, data: data as { code: string; discount: number } };
}
