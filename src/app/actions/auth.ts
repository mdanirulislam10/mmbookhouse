"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { fail, type ActionResult } from "@/lib/actions";
import { safeNext } from "@/lib/utils";

const email = z.string().trim().toLowerCase().email("EMAIL_INVALID").max(254);
const password = z.string().min(8, "PASSWORD_WEAK").max(72, "PASSWORD_WEAK");

async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

/** Best-effort throttle; never blocks sign-in if the limiter itself is unavailable. */
async function throttled(key: string, max: number, windowSec: number, blockSec: number): Promise<boolean> {
  try {
    const { data, error } = await createServiceClient().rpc("hit_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSec, p_block_seconds: blockSec });
    if (error) return false;
    return data === false;
  } catch {
    return false;
  }
}

function mapAuthError(err: { message?: string; status?: number; code?: string }): string {
  const m = (err.message ?? "").toLowerCase();
  const c = err.code ?? "";
  if (c === "email_not_confirmed" || m.includes("email not confirmed")) return "EMAIL_UNCONFIRMED";
  if (c === "invalid_credentials" || m.includes("invalid login")) return "INVALID_CREDENTIALS";
  if (c === "user_already_exists" || m.includes("already registered")) return "USER_EXISTS";
  if (c === "weak_password") return "PASSWORD_WEAK";
  if (c === "over_email_send_rate_limit" || c === "over_request_rate_limit" || err.status === 429) return "RATE_LIMITED";
  if (c === "otp_expired" || c === "otp_disabled" || m.includes("token has expired") || m.includes("invalid")) return "CODE_INVALID";
  return "GENERIC";
}

export async function signInWithPassword(input: { email: string; password: string }): Promise<ActionResult> {
  const parsed = z.object({ email, password: z.string().min(1).max(72) }).safeParse(input);
  if (!parsed.success) return fail("EMAIL_INVALID");
  const ip = await clientIp();
  if (await throttled(`signin:${ip}:${parsed.data.email}`, 8, 900, 900)) return fail("RATE_LIMITED");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail(mapAuthError(error));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signUpWithPassword(input: { email: string; password: string; fullName: string; next?: string }): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = z.object({ email, password, fullName: z.string().trim().min(2, "NAME_REQUIRED").max(80), next: z.string().optional() }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const ip = await clientIp();
  if (await throttled(`signup:${ip}`, 6, 3600, 3600)) return fail("RATE_LIMITED");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=${encodeURIComponent(safeNext(parsed.data.next, "/account"))}`,
    },
  });
  if (error) return fail(mapAuthError(error));
  // Supabase hides "already registered" for confirmed users: identities is empty in that case.
  if (data.user && data.user.identities && data.user.identities.length === 0) return fail("USER_EXISTS");
  revalidatePath("/", "layout");
  return { ok: true, data: { needsConfirmation: !data.session } };
}

export async function sendEmailCode(input: { email: string; next?: string }): Promise<ActionResult> {
  const parsed = z.object({ email, next: z.string().optional() }).safeParse(input);
  if (!parsed.success) return fail("EMAIL_INVALID");
  const ip = await clientIp();
  if (await throttled(`otp:${ip}:${parsed.data.email}`, 5, 900, 900)) return fail("RATE_LIMITED");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=${encodeURIComponent(safeNext(parsed.data.next, "/account"))}`,
    },
  });
  if (error) return fail(mapAuthError(error));
  return { ok: true };
}

export async function verifyEmailCode(input: { email: string; code: string }): Promise<ActionResult> {
  const parsed = z.object({ email, code: z.string().trim().regex(/^\d{6,8}$/, "CODE_INVALID") }).safeParse(input);
  if (!parsed.success) return fail("CODE_INVALID");
  const ip = await clientIp();
  if (await throttled(`otpv:${ip}:${parsed.data.email}`, 8, 900, 900)) return fail("RATE_LIMITED");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: "email" });
  if (error) return fail(mapAuthError(error));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function requestPasswordReset(input: { email: string }): Promise<ActionResult> {
  const parsed = z.object({ email }).safeParse(input);
  if (!parsed.success) return fail("EMAIL_INVALID");
  const ip = await clientIp();
  if (await throttled(`reset:${ip}:${parsed.data.email}`, 3, 3600, 3600)) return fail("RATE_LIMITED");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.siteUrl}/auth/callback?next=${encodeURIComponent("/account/reset-password")}`,
  });
  if (error && mapAuthError(error) === "RATE_LIMITED") return fail("RATE_LIMITED");
  return { ok: true }; // same answer whether or not the account exists
}

export async function updatePassword(input: { password: string }): Promise<ActionResult> {
  const parsed = z.object({ password }).safeParse(input);
  if (!parsed.success) return fail("PASSWORD_WEAK");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("AUTH_REQUIRED");
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(mapAuthError(error));
  return { ok: true };
}
