"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";

const role = z.enum(["super_admin", "inventory_manager", "dispatch_staff"]);

async function findUserByEmail(email: string): Promise<{ id: string; name: string | null } | null> {
  const service = createServiceClient();
  for (let page = 1; page <= 20; page++) {
    const { data } = await service.auth.admin.listUsers({ page, perPage: 250 });
    const users = data?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return { id: hit.id, name: (hit.user_metadata?.full_name as string | undefined) ?? null };
    if (users.length < 250) break;
  }
  return null;
}

export async function addStaff(input: { email: string; role: z.infer<typeof role> }): Promise<ActionResult> {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email("EMAIL_INVALID"), role }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("staff");
  if (!staff) return FORBIDDEN;
  const user = await findUserByEmail(parsed.data.email);
  if (!user) return fail("USER_NOT_FOUND");
  const { error } = await createServiceClient().from("staff_members").upsert({ user_id: user.id, role: parsed.data.role, display_name: user.name, is_active: true }, { onConflict: "user_id" });
  if (error) return dbError(error);
  await writeAudit(staff, "staff.add", "staff", user.id, { after: parsed.data });
  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function updateStaff(input: { userId: string; role?: z.infer<typeof role>; isActive?: boolean }): Promise<ActionResult> {
  const parsed = z.object({ userId: uuid, role: role.optional(), isActive: z.boolean().optional() }).safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("staff");
  if (!staff) return FORBIDDEN;
  const v = parsed.data;
  const service = createServiceClient();
  if (v.userId === staff.userId && (v.isActive === false || (v.role && v.role !== "super_admin"))) return fail("CANNOT_DEMOTE_SELF");
  const patch: Record<string, unknown> = {};
  if (v.role) patch.role = v.role;
  if (v.isActive !== undefined) patch.is_active = v.isActive;
  const { error } = await service.from("staff_members").update(patch).eq("user_id", v.userId);
  if (error) return dbError(error);
  await writeAudit(staff, "staff.update", "staff", v.userId, { after: patch });
  revalidatePath("/admin/staff");
  return { ok: true };
}
