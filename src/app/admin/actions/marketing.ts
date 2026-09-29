"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";

function invalidate() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/marketing");
  revalidatePath("/", "layout");
}

const dateStr = z.string().trim().optional().transform((v) => (v ? new Date(v).toISOString() : null)).refine((v) => v === null || !Number.isNaN(Date.parse(v)), "DATE_INVALID");

export async function saveCoupon(input: {
  id?: string;
  code: string;
  description?: string;
  kind: "percent" | "flat";
  value: number;
  max_discount?: number | null;
  min_order?: number;
  starts_at?: string;
  ends_at?: string;
  usage_limit?: number | null;
  per_user_limit?: number;
  is_active?: boolean;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      id: uuid.optional(),
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,24}$/, "COUPON_CODE_INVALID"),
      description: z.string().trim().max(200).optional().transform((v) => v || null),
      kind: z.enum(["percent", "flat"]),
      value: z.number().positive("VALUE_INVALID"),
      max_discount: z.number().positive().nullable().optional(),
      min_order: z.number().min(0).default(0),
      starts_at: dateStr,
      ends_at: dateStr,
      usage_limit: z.number().int().positive().nullable().optional(),
      per_user_limit: z.number().int().positive().default(1),
      is_active: z.boolean().default(true),
    })
    .refine((c) => c.kind !== "percent" || c.value <= 100, { message: "VALUE_INVALID" })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("marketing");
  if (!staff) return FORBIDDEN;
  const { id, ...row } = parsed.data;
  const service = createServiceClient();
  const res = id ? await service.from("coupons").update(row).eq("id", id) : await service.from("coupons").insert(row);
  if (res.error) return res.error.code === "23505" ? fail("COUPON_CODE_TAKEN") : dbError(res.error);
  await writeAudit(staff, id ? "coupon.update" : "coupon.create", "coupon", id ?? row.code, { after: row });
  invalidate();
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const staff = await authorize("marketing");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const { count } = await service.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", id);
  if ((count ?? 0) > 0) {
    await service.from("coupons").update({ is_active: false }).eq("id", id); // keep history, just switch off
  } else {
    const { error } = await service.from("coupons").delete().eq("id", id);
    if (error) return dbError(error);
  }
  await writeAudit(staff, "coupon.delete", "coupon", id);
  invalidate();
  return { ok: true };
}

export async function saveBanner(input: {
  id?: string;
  title: string;
  title_bn?: string;
  subtitle?: string;
  subtitle_bn?: string;
  image_url?: string;
  link_url?: string;
  cta_label?: string;
  cta_label_bn?: string;
  bg_color?: string;
  sort_order?: number;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
}): Promise<ActionResult> {
  const t = (n: number) => z.string().trim().max(n).optional().transform((v) => v || null);
  const parsed = z
    .object({
      id: uuid.optional(),
      title: z.string().trim().min(1, "TITLE_REQUIRED").max(120),
      title_bn: t(120),
      subtitle: t(200),
      subtitle_bn: t(200),
      image_url: z.string().url().optional().or(z.literal("")).transform((v) => v || null),
      link_url: z.string().trim().max(300).optional().refine((v) => !v || v.startsWith("/") || /^https?:\/\//.test(v), "URL_INVALID").transform((v) => v || null),
      cta_label: t(40),
      cta_label_bn: t(40),
      bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")).transform((v) => v || null),
      sort_order: z.number().int().min(0).max(999).default(0),
      starts_at: dateStr,
      ends_at: dateStr,
      is_active: z.boolean().default(true),
    })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("marketing");
  if (!staff) return FORBIDDEN;
  const { id, ...row } = parsed.data;
  const service = createServiceClient();
  const res = id ? await service.from("banners").update(row).eq("id", id) : await service.from("banners").insert({ ...row, placement: "hero" });
  if (res.error) return dbError(res.error);
  await writeAudit(staff, id ? "banner.update" : "banner.create", "banner", id ?? null, { after: row.title });
  invalidate();
  return { ok: true };
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const staff = await authorize("marketing");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient().from("banners").delete().eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, "banner.delete", "banner", id);
  invalidate();
  return { ok: true };
}

export async function saveFlashDeal(input: { bookId: string; dealPrice: number; endsAt: string; title?: string }): Promise<ActionResult> {
  const parsed = z
    .object({ bookId: uuid, dealPrice: z.number().min(0).max(1_000_000), endsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "DATE_INVALID"), title: z.string().trim().max(80).optional() })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("marketing");
  if (!staff) return FORBIDDEN;
  const ends = new Date(parsed.data.endsAt);
  if (ends.getTime() <= Date.now()) return fail("DATE_PAST");
  const service = createServiceClient();
  const { data: book } = await service.from("books").select("sale_price").eq("id", parsed.data.bookId).maybeSingle();
  if (!book) return fail("BOOK_NOT_FOUND");
  if (parsed.data.dealPrice >= Number(book.sale_price)) return fail("DEAL_NOT_LOWER");
  await service.from("flash_deals").update({ is_active: false }).eq("book_id", parsed.data.bookId).eq("is_active", true);
  const { error } = await service.from("flash_deals").insert({ book_id: parsed.data.bookId, deal_price: parsed.data.dealPrice, ends_at: ends.toISOString(), title: parsed.data.title || null });
  if (error) return dbError(error);
  await writeAudit(staff, "deal.create", "book", parsed.data.bookId, { after: parsed.data });
  invalidate();
  return { ok: true };
}

export async function endFlashDeal(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const staff = await authorize("marketing");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient().from("flash_deals").update({ is_active: false }).eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, "deal.end", "flash_deal", id);
  invalidate();
  return { ok: true };
}
