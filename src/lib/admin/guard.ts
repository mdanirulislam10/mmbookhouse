import "server-only";
import { headers } from "next/headers";
import { getStaff, type StaffSession } from "@/lib/data/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { rolesFor, type Area } from "@/lib/admin/permissions";
import { fail } from "@/lib/actions";

/** For server actions: the signed-in staff member if allowed for `area`, else null. */
export async function authorize(area: Area): Promise<StaffSession | null> {
  const staff = await getStaff();
  if (!staff) return null;
  return rolesFor(area).includes(staff.role) ? staff : null;
}

export const FORBIDDEN = fail("FORBIDDEN");

/** Append an entry to the immutable audit trail. Never throws. */
export async function writeAudit(
  staff: StaffSession,
  action: string,
  entity: string,
  entityId?: string | null,
  change?: { before?: unknown; after?: unknown },
): Promise<void> {
  try {
    const h = await headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
    await createServiceClient().from("audit_logs").insert({
      actor_id: staff.userId,
      actor_role: staff.role,
      action,
      entity,
      entity_id: entityId ?? null,
      before_data: change?.before ?? null,
      after_data: change?.after ?? null,
      ip,
    });
  } catch (e) {
    console.error("[audit] failed:", e);
  }
}
