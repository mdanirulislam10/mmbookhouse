"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

export async function submitReview(input: { bookId: string; rating: number; title?: string; body?: string }): Promise<ActionResult> {
  const parsed = z
    .object({
      bookId: uuid,
      rating: z.number().int().min(1, "RATING_REQUIRED").max(5),
      title: z.string().trim().max(120).optional(),
      body: z.string().trim().max(4000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("AUTH_REQUIRED");

  // One review per book: editing re-submits it for moderation (the guard trigger resets status).
  const { error } = await supabase
    .from("reviews")
    .upsert(
      { book_id: parsed.data.bookId, user_id: userId, rating: parsed.data.rating, title: parsed.data.title || null, body: parsed.data.body || null },
      { onConflict: "book_id,user_id" },
    );
  if (error) return dbError(error);
  return { ok: true };
}

export async function voteReviewHelpful(reviewId: string): Promise<ActionResult> {
  if (!uuid.safeParse(reviewId).success) return fail("INVALID_INPUT");
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("AUTH_REQUIRED");
  const { error } = await supabase.from("review_votes").upsert({ review_id: reviewId, user_id: userId }, { onConflict: "review_id,user_id", ignoreDuplicates: true });
  if (error) return dbError(error);
  return { ok: true };
}

export async function submitQuestion(input: { bookId: string; question: string }): Promise<ActionResult> {
  const parsed = z.object({ bookId: uuid, question: z.string().trim().min(5, "QUESTION_SHORT").max(1000) }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("AUTH_REQUIRED");
  const { error } = await supabase.from("book_questions").insert({ book_id: parsed.data.bookId, user_id: userId, question: parsed.data.question });
  if (error) return dbError(error);
  return { ok: true };
}

/** Public bulk-order enquiry (no login needed; rate limited per IP). */
export async function submitBulkEnquiry(input: { org: string; contact: string; phone: string; email?: string; details: string }): Promise<ActionResult> {
  const parsed = z
    .object({
      org: z.string().trim().min(2).max(120),
      contact: z.string().trim().min(2).max(80),
      phone: z.string().trim().regex(/^[0-9+][0-9 -]{7,14}$/, "PHONE_INVALID"),
      email: z.string().trim().email().max(200).optional().or(z.literal("")),
      details: z.string().trim().min(5).max(3000),
    })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const service = createServiceClient();
  const { data: allowed } = await service.rpc("hit_rate_limit", { p_key: `enquiry:${ip}`, p_max: 5, p_window_seconds: 3600, p_block_seconds: 3600 });
  if (allowed === false) return fail("RATE_LIMITED");
  const { error } = await service.from("enquiries").insert({
    kind: "bulk",
    org: parsed.data.org,
    contact: parsed.data.contact,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    message: parsed.data.details,
  });
  if (error) return dbError(error);
  return { ok: true };
}
