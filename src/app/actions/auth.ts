"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { publicEnv, serverEnv } from "@/lib/env";
import { fail, type ActionResult } from "@/lib/actions";
import { safeNext } from "@/lib/utils";
import { emailProvider } from "@/lib/notify/config";
import { sendEmail } from "@/lib/notify/providers";
import { getSettings } from "@/lib/data/settings";
import { checkCode, issueCode, OTP_LENGTH, renderOtpEmail, type OtpPurpose } from "@/lib/auth/email-otp";

const email = z.string().trim().toLowerCase().email("EMAIL_INVALID").max(254);
const password = z.string().min(8, "PASSWORD_WEAK").max(72, "PASSWORD_WEAK");
/** Length of the code Supabase itself sends when our own e-mail sender is not connected. */
const SUPABASE_CODE_LENGTH = 6;

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
  if (c === "user_already_exists" || c === "email_exists" || m.includes("already registered")) return "USER_EXISTS";
  if (c === "weak_password") return "PASSWORD_WEAK";
  if (c === "over_email_send_rate_limit" || c === "over_request_rate_limit" || err.status === 429) return "RATE_LIMITED";
  if (c === "otp_expired" || c === "otp_disabled" || m.includes("token has expired") || m.includes("invalid")) return "CODE_INVALID";
  return "GENERIC";
}

/* ------------------------------------------------------- 4-digit e-mail codes */

/** Owner and active staff accounts must never be reachable with a short code: they keep password / Supabase's own code. */
async function privilegedEmails(): Promise<Set<string>> {
  const out = new Set<string>(serverEnv.ownerEmails.map((e) => e.toLowerCase()));
  try {
    const service = createServiceClient();
    const { data } = await service.from("staff_members").select("user_id").eq("is_active", true);
    await Promise.all(
      (data ?? []).map(async (s) => {
        const { data: u } = await service.auth.admin.getUserById(s.user_id as string);
        if (u.user?.email) out.add(u.user.email.toLowerCase());
      }),
    );
  } catch {
    // If staff cannot be listed, be safe: the caller treats an unreadable list as "everyone privileged" below.
    throw new Error("STAFF_LOOKUP_FAILED");
  }
  return out;
}

/** True when this address is served with our own 4-digit code. */
async function ownCodeFor(address: string): Promise<boolean> {
  if (!emailProvider()) return false;
  try {
    return !(await privilegedEmails()).has(address);
  } catch {
    return false;
  }
}

async function mailCode(address: string, purpose: OtpPurpose): Promise<boolean> {
  try {
    const settings = await getSettings();
    await sendEmail({ to: address, ...renderOtpEmail(issueCode(address, purpose), purpose, settings.store_profile.name || "mmbookhouse") });
    return true;
  } catch (e) {
    console.error("[auth] code e-mail failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

/** One counter per address for every purpose, so switching purpose does not buy extra guesses. */
const failKey = (address: string) => `otpfail:${address}`;

/**
 * Five wrong codes within six hours lock the address for six hours (about 20 guesses a day at most, against
 * 10 000 possible codes); a correct code does not use up an attempt.
 */
async function codeAttempt(address: string, purpose: OtpPurpose, given: string): Promise<"ok" | "wrong" | "locked"> {
  const service = createServiceClient();
  const key = failKey(address);
  try {
    const { data } = await service.from("rate_limits").select("blocked_until").eq("key", key).maybeSingle();
    if (data?.blocked_until && new Date(data.blocked_until as string).getTime() > Date.now()) return "locked";
  } catch {
    /* limiter unavailable: fall through to the per-address throttle below */
  }
  if (checkCode(address, purpose, given)) {
    await service.rpc("reset_rate_limit", { p_key: key });
    return "ok";
  }
  // hit_rate_limit blocks on the call that exceeds `max`, so max 4 means the 5th wrong code locks the address.
  return (await throttled(key, 4, 21_600, 21_600)) ? "locked" : "wrong";
}

/**
 * Signs the address in (creating or confirming the account) without any e-mail link.
 * When the code proves ownership of an account that was never confirmed and was not just created by the
 * signup step, its password is replaced first: whoever pre-registered the address must not keep a working password.
 */
async function startSession(address: string, kind: "magiclink" | "recovery", opts: { keepPassword?: boolean } = {}): Promise<boolean> {
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.generateLink({ type: kind, email: address });
  const token = data?.properties?.hashed_token;
  if (error || !token) return false;
  if (kind === "magiclink" && !opts.keepPassword && data.user && !data.user.email_confirmed_at) {
    const { error: rotateError } = await service.auth.admin.updateUserById(data.user.id, { password: randomBytes(24).toString("base64url") });
    if (rotateError) return false;
  }
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: token, type: data.properties.verification_type as "magiclink" });
  return !verifyError;
}

/* ------------------------------------------------------------------- sign in */

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

export async function signUpWithPassword(input: { email: string; password: string; fullName: string; next?: string }): Promise<ActionResult<{ needsConfirmation: boolean; codeLength?: number }>> {
  const parsed = z.object({ email, password, fullName: z.string().trim().min(2, "NAME_REQUIRED").max(80), next: z.string().optional() }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const ip = await clientIp();
  if (await throttled(`signup:${ip}`, 6, 3600, 3600)) return fail("RATE_LIMITED");

  if (await ownCodeFor(parsed.data.email)) {
    if (await throttled(`otp:${ip}:${parsed.data.email}`, 5, 900, 900)) return fail("RATE_LIMITED");
    // Create the account unconfirmed; typing the e-mailed code confirms it and signs the person in.
    const { error } = await createServiceClient().auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: false,
      user_metadata: { full_name: parsed.data.fullName },
    });
    if (error) return fail(mapAuthError(error));
    if (!(await mailCode(parsed.data.email, "signup"))) return fail("EMAIL_SEND_FAILED");
    return { ok: true, data: { needsConfirmation: true, codeLength: OTP_LENGTH } };
  }

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

export async function sendEmailCode(input: { email: string; next?: string }): Promise<ActionResult<{ codeLength: number }>> {
  const parsed = z.object({ email, next: z.string().optional() }).safeParse(input);
  if (!parsed.success) return fail("EMAIL_INVALID");
  const ip = await clientIp();
  if (await throttled(`otp:${ip}:${parsed.data.email}`, 5, 900, 900)) return fail("RATE_LIMITED");
  if (await throttled(`otp-mail:${parsed.data.email}`, 8, 3600, 3600)) return fail("RATE_LIMITED");

  if (await ownCodeFor(parsed.data.email)) {
    if (!(await mailCode(parsed.data.email, "auth"))) return fail("EMAIL_SEND_FAILED");
    return { ok: true, data: { codeLength: OTP_LENGTH } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=${encodeURIComponent(safeNext(parsed.data.next, "/account"))}`,
    },
  });
  if (error) return fail(mapAuthError(error));
  return { ok: true, data: { codeLength: SUPABASE_CODE_LENGTH } };
}

export async function verifyEmailCode(input: { email: string; code: string; purpose?: "auth" | "signup" }): Promise<ActionResult> {
  const parsed = z.object({ email, code: z.string().trim().regex(/^\d{4,8}$/, "CODE_INVALID"), purpose: z.enum(["auth", "signup"]).default("auth") }).safeParse(input);
  if (!parsed.success) return fail("CODE_INVALID");
  const ip = await clientIp();
  if (await throttled(`otpv:${ip}`, 40, 900, 900)) return fail("RATE_LIMITED");

  if (await ownCodeFor(parsed.data.email)) {
    const result = await codeAttempt(parsed.data.email, parsed.data.purpose, parsed.data.code);
    if (result === "locked") return fail("RATE_LIMITED");
    if (result === "wrong") return fail("CODE_INVALID");
    if (!(await startSession(parsed.data.email, "magiclink", { keepPassword: parsed.data.purpose === "signup" }))) return fail("GENERIC");
    revalidatePath("/", "layout");
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: "email" });
  if (error) return fail(mapAuthError(error));
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------------------------------------ password reset */

export async function requestPasswordReset(input: { email: string }): Promise<ActionResult<{ codeLength: number }>> {
  const parsed = z.object({ email }).safeParse(input);
  if (!parsed.success) return fail("EMAIL_INVALID");
  const ip = await clientIp();
  if (await throttled(`reset:${ip}:${parsed.data.email}`, 3, 3600, 3600)) return fail("RATE_LIMITED");

  if (await ownCodeFor(parsed.data.email)) {
    // Sent whether or not an account exists, so the form cannot be used to find out who has one.
    if (!(await mailCode(parsed.data.email, "reset"))) return fail("EMAIL_SEND_FAILED");
    return { ok: true, data: { codeLength: OTP_LENGTH } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.siteUrl}/auth/callback?next=${encodeURIComponent("/account/reset-password")}`,
  });
  if (error && mapAuthError(error) === "RATE_LIMITED") return fail("RATE_LIMITED");
  return { ok: true, data: { codeLength: 0 } }; // same answer whether or not the account exists
}

/** Second step of the code-based reset: the e-mailed code plus the new password. */
export async function resetPasswordWithCode(input: { email: string; code: string; password: string }): Promise<ActionResult> {
  const parsed = z.object({ email, code: z.string().trim().regex(/^\d{4}$/, "CODE_INVALID"), password }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "CODE_INVALID");
  const ip = await clientIp();
  if (await throttled(`otpv:${ip}`, 40, 900, 900)) return fail("RATE_LIMITED");
  if (!(await ownCodeFor(parsed.data.email))) return fail("CODE_INVALID");

  const result = await codeAttempt(parsed.data.email, "reset", parsed.data.code);
  if (result === "locked") return fail("RATE_LIMITED");
  if (result === "wrong") return fail("CODE_INVALID");
  // "recovery" links exist only for real accounts, so an unknown address ends here with the same message.
  if (!(await startSession(parsed.data.email, "recovery"))) return fail("CODE_INVALID");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(mapAuthError(error));
  revalidatePath("/", "layout");
  return { ok: true };
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

/** Sends the signup verification code again (same address, same limits as the first mail). */
export async function resendSignupCode(input: { email: string }): Promise<ActionResult> {
  const parsed = z.object({ email }).safeParse(input);
  if (!parsed.success) return fail("EMAIL_INVALID");
  const ip = await clientIp();
  if (await throttled(`otp:${ip}:${parsed.data.email}`, 5, 900, 900)) return fail("RATE_LIMITED");
  if (await throttled(`otp-mail:${parsed.data.email}`, 8, 3600, 3600)) return fail("RATE_LIMITED");
  if (!(await ownCodeFor(parsed.data.email))) return fail("GENERIC");
  if (!(await mailCode(parsed.data.email, "signup"))) return fail("EMAIL_SEND_FAILED");
  return { ok: true };
}
