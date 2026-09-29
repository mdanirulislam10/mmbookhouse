"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { SETTINGS_TAG } from "@/lib/data/settings";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";

const txt = (n: number) => z.string().trim().max(n);

const schemas = {
  store_profile: z.object({
    name: txt(80).min(1),
    name_bn: txt(80),
    tagline: txt(120),
    tagline_bn: txt(120),
    address: txt(240),
    address_bn: txt(240).default(""),
    pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "PINCODE_INVALID"),
    phone: txt(20),
    whatsapp: txt(20),
    email: z.string().trim().max(120).refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "EMAIL_INVALID"),
    hours: txt(60),
  }),
  notice_bar: z.object({ enabled: z.boolean(), text: txt(200), text_bn: txt(200), href: txt(300).refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "URL_INVALID") }),
  maintenance: z.object({ enabled: z.boolean(), message: txt(300), message_bn: txt(300) }),
  payment: z.object({
    cod_enabled: z.boolean(),
    cod_max_order: z.number().min(0).max(1_000_000),
    upi_enabled: z.boolean(),
    upi_id: z.string().trim().max(60).refine((v) => v === "" || /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(v), "UPI_INVALID"),
    upi_payee_name: txt(80),
  }),
  checkout: z.object({ pickup_enabled: z.boolean(), pickup_address: txt(240), max_qty_per_item: z.number().int().min(1).max(99) }),
} as const;

export type SettingKey = keyof typeof schemas;

export async function saveSetting(key: SettingKey, value: unknown): Promise<ActionResult> {
  const schema = schemas[key];
  if (!schema) return fail("INVALID_INPUT");
  const parsed = schema.safeParse(value);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("settings");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const { data: before } = await service.from("site_settings").select("value").eq("key", key).maybeSingle();
  const { error } = await service.from("site_settings").upsert({ key, value: parsed.data, is_public: true, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return dbError(error);
  await writeAudit(staff, `settings.${key}`, "setting", key, { before: before?.value, after: parsed.data });
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function saveDeliveryRule(input: {
  id?: string;
  label: string;
  label_bn?: string;
  match_value: string;
  fee: number;
  free_above?: number | null;
  eta_min_days: number;
  eta_max_days: number;
  cod_available: boolean;
  is_active: boolean;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      id: uuid.optional(),
      label: txt(80).min(1, "NAME_REQUIRED"),
      label_bn: txt(80).optional().transform((v) => v || null),
      match_value: z.string().trim().regex(/^[0-9]{0,6}$/, "PINCODE_INVALID"),
      fee: z.number().min(0).max(10000),
      free_above: z.number().min(0).nullable().optional(),
      eta_min_days: z.number().int().min(0).max(60),
      eta_max_days: z.number().int().min(0).max(90),
      cod_available: z.boolean(),
      is_active: z.boolean(),
    })
    .refine((r) => r.eta_max_days >= r.eta_min_days, { message: "ETA_INVALID" })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("settings");
  if (!staff) return FORBIDDEN;
  const { id, ...row } = parsed.data;
  const service = createServiceClient();
  const res = id ? await service.from("delivery_rules").update(row).eq("id", id) : await service.from("delivery_rules").insert(row);
  if (res.error) return res.error.code === "23505" ? fail("RULE_EXISTS") : dbError(res.error);
  await writeAudit(staff, "delivery_rule.save", "delivery_rule", id ?? row.match_value, { after: row });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function deleteDeliveryRule(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const staff = await authorize("settings");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const { count } = await service.from("delivery_rules").select("id", { count: "exact", head: true }).eq("is_active", true);
  if ((count ?? 0) <= 1) return fail("LAST_RULE");
  const { error } = await service.from("delivery_rules").delete().eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, "delivery_rule.delete", "delivery_rule", id);
  revalidatePath("/admin/settings");
  return { ok: true };
}
