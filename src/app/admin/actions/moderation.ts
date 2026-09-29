"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";

function refresh() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
}

export async function moderateReview(id: string, status: "published" | "rejected"): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, status: z.enum(["published", "rejected"]) }).safeParse({ id, status });
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("reviews");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient().from("reviews").update({ status }).eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, `review.${status}`, "review", id);
  refresh();
  return { ok: true };
}

export async function answerQuestion(input: { id: string; answer: string; publish: boolean }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, answer: z.string().trim().max(2000), publish: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("reviews");
  if (!staff) return FORBIDDEN;
  const v = parsed.data;
  if (v.publish && !v.answer) return fail("ANSWER_REQUIRED");
  const { error } = await createServiceClient()
    .from("book_questions")
    .update({ answer: v.answer || null, answered_at: v.answer ? new Date().toISOString() : null, status: v.publish ? "published" : "rejected" })
    .eq("id", v.id);
  if (error) return dbError(error);
  await writeAudit(staff, v.publish ? "question.publish" : "question.reject", "question", v.id);
  refresh();
  return { ok: true };
}

export async function setEnquiryStatus(id: string, status: "new" | "contacted" | "closed"): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, status: z.enum(["new", "contacted", "closed"]) }).safeParse({ id, status });
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("enquiries");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient().from("enquiries").update({ status, handled_by: staff.userId }).eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, "enquiry.status", "enquiry", id, { after: status });
  refresh();
  return { ok: true };
}
