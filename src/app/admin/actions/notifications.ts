"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { fail, type ActionResult } from "@/lib/actions";
import { processQueue, sendTest } from "@/lib/notify";

export async function saveChannelSwitches(input: { email: boolean; whatsapp: boolean; sms: boolean }): Promise<ActionResult> {
  const parsed = z.object({ email: z.boolean(), whatsapp: z.boolean(), sms: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("settings");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient()
    .from("site_settings")
    .upsert({ key: "notifications", value: parsed.data, is_public: false, updated_by: staff.userId }, { onConflict: "key" });
  if (error) return fail("GENERIC");
  await writeAudit(staff, "settings.notifications", "setting", "notifications", { after: parsed.data });
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function retryNotifications(): Promise<ActionResult<{ sent: number; failed: number; skipped: number }>> {
  const staff = await authorize("settings");
  if (!staff) return FORBIDDEN;
  const r = await processQueue(50);
  revalidatePath("/admin/notifications");
  return { ok: true, data: r };
}

export async function sendTestNotification(input: { channel: "email" | "whatsapp" | "sms"; to: string }): Promise<ActionResult> {
  const parsed = z.object({ channel: z.enum(["email", "whatsapp", "sms"]), to: z.string().trim().min(5).max(120) }).safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("settings");
  if (!staff) return FORBIDDEN;
  try {
    await sendTest(parsed.data.channel, parsed.data.to);
  } catch (e) {
    const m = String((e as Error).message);
    if (m === "PROVIDER_NOT_CONFIGURED" || m === "PHONE_INVALID") return fail(m);
    console.error("[notify test]", m);
    return fail("SEND_FAILED", m.slice(0, 160));
  }
  await writeAudit(staff, "notify.test", "notification", parsed.data.channel);
  return { ok: true };
}
