"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { persistBook } from "@/lib/admin/save-book";
import { createServiceClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";
import { defer, notifyPartner } from "@/lib/notify";

const note = z.string().trim().max(1000).optional();

function refresh() {
  revalidatePath("/admin/partners");
  revalidatePath("/partner");
  revalidatePath("/partner/books");
}

/** Approve, reject or suspend a partner application. A rejection needs a reason the applicant will see. */
export async function reviewPartner(id: string, status: "approved" | "rejected" | "suspended", adminNote?: string): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, status: z.enum(["approved", "rejected", "suspended"]), note }).safeParse({ id, status, note: adminNote });
  if (!parsed.success) return fail("INVALID_INPUT");
  if (parsed.data.status !== "approved" && !parsed.data.note) return fail("NOTE_REQUIRED");
  const staff = await authorize("partners");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const { data: partner, error } = await service
    .from("partners")
    .update({ status: parsed.data.status, admin_note: parsed.data.note || null, reviewed_by: staff.userId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .select("email, name")
    .maybeSingle();
  if (error) return dbError(error);
  if (!partner) return fail("NOT_FOUND");
  await writeAudit(staff, `partner.${parsed.data.status}`, "partner", parsed.data.id, { after: { status: parsed.data.status, note: parsed.data.note } });
  refresh();

  const lines =
    parsed.data.status === "approved"
      ? [
          `Your partner application for "${partner.name}" has been approved. You can now submit your books.`,
          `"${partner.name}"-এর অংশীদার আবেদন অনুমোদিত হয়েছে। এখন আপনি আপনার বই জমা দিতে পারবেন।`,
        ]
      : [
          `Your partner application for "${partner.name}" was ${parsed.data.status === "rejected" ? "not approved" : "suspended"}. Reason: ${parsed.data.note}`,
          `"${partner.name}"-এর অংশীদার আবেদন ${parsed.data.status === "rejected" ? "অনুমোদিত হয়নি" : "স্থগিত করা হয়েছে"}। কারণ: ${parsed.data.note}`,
        ];
  defer(() => notifyPartner(partner.email as string, parsed.data.status === "approved" ? "Partner application approved / অংশীদার আবেদন অনুমোদিত" : "Partner application update / অংশীদার আবেদনের আপডেট", lines, parsed.data.status === "approved" ? "/partner/books" : "/partner"));
  return { ok: true };
}

/**
 * Approve a submitted book: it becomes a DRAFT book in the catalogue (the shop sets the selling price,
 * categories and stock, then publishes it). Returns the new book id so the admin can open the editor.
 */
export async function approveSubmission(id: string): Promise<ActionResult<{ bookId: string }>> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const staff = await authorize("partners");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const { data: s } = await service.from("partner_submissions").select("*, partners(name, kind, email, status)").eq("id", id).maybeSingle();
  if (!s) return fail("NOT_FOUND");
  if (s.status !== "pending") return fail("STATUS_TRANSITION_INVALID");
  const partner = s.partners as { name: string; kind: string; email: string; status: string };

  const res = await persistBook(service, staff.userId, staff.role, {
    title: s.title,
    title_bn: s.title_bn ?? undefined,
    authors: String(s.authors)
      .split(/[,;]/)
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 10),
    publisher: s.publisher ?? (partner.kind === "publisher" ? partner.name : undefined),
    isbn: s.isbn ?? undefined,
    language: s.language,
    binding: s.binding,
    edition: s.edition ?? undefined,
    pages: s.pages ?? undefined,
    description: s.description ?? undefined,
    cover_url: s.cover_url ?? undefined,
    mrp: Number(s.mrp),
    sale_price: Number(s.mrp),
    // Wholesale cost is only meaningful in rupees.
    cost_price: s.currency === "INR" ? Number(s.supply_price) : undefined,
    supplier_note: `Partner: ${partner.name} (${partner.kind}) · supply ${s.currency} ${s.supply_price}${s.quantity != null ? ` · qty ${s.quantity}` : ""}`.slice(0, 300),
    status: "draft",
    gallery: [],
    preview_pages: [],
  });
  if (!res.ok) return res;

  const { error } = await service.from("partner_submissions").update({ status: "approved", book_id: res.data!.id, reviewed_at: new Date().toISOString(), admin_note: null }).eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, "partner_book.approve", "partner_submission", id, { after: { book_id: res.data!.id } });
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/books");
  refresh();
  defer(() =>
    notifyPartner(partner.email, "Book accepted / বই গৃহীত হয়েছে", [`Your book "${s.title}" has been accepted and will be listed after final checks.`, `আপনার বই "${s.title}" গৃহীত হয়েছে; শেষ যাচাইয়ের পর সাইটে দেখানো হবে।`], "/partner/books"),
  );
  return { ok: true, data: { bookId: res.data!.id } };
}

export async function rejectSubmission(id: string, adminNote: string): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, note: z.string().trim().min(3).max(1000) }).safeParse({ id, note: adminNote });
  if (!parsed.success) return fail("NOTE_REQUIRED");
  const staff = await authorize("partners");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const { data: s, error } = await service
    .from("partner_submissions")
    .update({ status: "rejected", admin_note: parsed.data.note, reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("status", "pending")
    .select("title, partners(email)")
    .maybeSingle();
  if (error) return dbError(error);
  if (!s) return fail("STATUS_TRANSITION_INVALID");
  await writeAudit(staff, "partner_book.reject", "partner_submission", parsed.data.id, { after: { note: parsed.data.note } });
  refresh();
  const email = (s.partners as unknown as { email: string } | null)?.email;
  if (email) {
    defer(() =>
      notifyPartner(email, "Book not accepted / বই গৃহীত হয়নি", [`Your book "${s.title}" was not accepted. Reason: ${parsed.data.note}`, `আপনার বই "${s.title}" গৃহীত হয়নি। কারণ: ${parsed.data.note}`], "/partner/books"),
    );
  }
  return { ok: true };
}
