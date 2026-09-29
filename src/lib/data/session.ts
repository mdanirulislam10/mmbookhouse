import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import type { StaffRole } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
  fullName: string | null;
  avatarUrl: string | null;
}

/** Current visitor (verified with the Auth server), memoised per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
  return {
    id: u.id,
    email: u.email ?? null,
    emailConfirmed: Boolean(u.email_confirmed_at),
    fullName: meta.full_name ?? meta.name ?? null,
    avatarUrl: meta.avatar_url ?? null,
  };
});

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  lang: "bn" | "en";
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, phone, lang").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? { id: user.id, full_name: user.fullName, phone: null, lang: "bn" };
});

export async function requireUser(next = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export interface StaffSession {
  userId: string;
  email: string | null;
  role: StaffRole;
  name: string | null;
}

/** Staff record of the current user, or null. Read through RLS (own row only). */
export const getStaff = cache(async (): Promise<StaffSession | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_members")
    .select("role, display_name, is_active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data) {
    if (!data.is_active) return null;
    return { userId: user.id, email: user.email, role: data.role as StaffRole, name: data.display_name };
  }

  // First sign-in of an owner listed in ADMIN_OWNER_EMAILS: create their Super Admin record.
  if (user.email && user.emailConfirmed && serverEnv.ownerEmails.includes(user.email.toLowerCase())) {
    const { error } = await createServiceClient()
      .from("staff_members")
      .upsert({ user_id: user.id, role: "super_admin", display_name: user.fullName, is_active: true }, { onConflict: "user_id", ignoreDuplicates: true });
    if (!error) return { userId: user.id, email: user.email, role: "super_admin", name: user.fullName };
    console.error("[staff] owner bootstrap failed:", error.message);
  }
  return null;
});

/** Guard for admin pages. Redirects to the admin login when the visitor is not (allowed) staff. */
export async function requireStaff(allowed?: StaffRole[]): Promise<StaffSession> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (allowed && !allowed.includes(staff.role) && staff.role !== "super_admin") redirect("/admin?denied=1");
  return staff;
}
