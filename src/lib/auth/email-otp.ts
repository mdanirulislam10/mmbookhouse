import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless 4-digit e-mail codes. A code is derived from a server-only key, the address, what it is for and a
 * 5-minute time slot, so nothing is stored and a resend inside the same slot repeats the same code. The current and
 * the previous slot are accepted, so a code lives 5 to 10 minutes.
 *
 * Four digits are only safe together with strict attempt limits (see the server actions: 5 tries, then a long
 * lock) and by never using them for staff / owner accounts.
 */
export const OTP_LENGTH = 4;
export const OTP_VALID_MINUTES = 10;
export type OtpPurpose = "auth" | "signup" | "reset";

const SLOT_MS = 5 * 60_000;

function key(): Buffer {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to issue e-mail codes");
  return createHmac("sha256", "mmbookhouse-email-otp-v1").update(base).digest();
}

function codeFor(email: string, purpose: OtpPurpose, slot: number): string {
  const h = createHmac("sha256", key()).update(`${purpose}|${email.trim().toLowerCase()}|${slot}`).digest();
  return String(h.readUInt32BE(0) % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, "0");
}

export function issueCode(email: string, purpose: OtpPurpose, now = Date.now()): string {
  return codeFor(email, purpose, Math.floor(now / SLOT_MS));
}

export function checkCode(email: string, purpose: OtpPurpose, given: string, now = Date.now()): boolean {
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(given)) return false;
  const slot = Math.floor(now / SLOT_MS);
  let ok = false;
  for (const s of [slot, slot - 1]) {
    const expected = Buffer.from(codeFor(email, purpose, s));
    // Both branches always run so timing does not reveal which slot matched.
    ok = timingSafeEqual(expected, Buffer.from(given)) || ok;
  }
  return ok;
}

export function renderOtpEmail(code: string, purpose: OtpPurpose, storeName: string): { subject: string; text: string; html: string } {
  const bnWhy = purpose === "reset" ? "পাসওয়ার্ড বদলানোর কোড" : "সাইন ইন / অ্যাকাউন্ট যাচাইয়ের কোড";
  const enWhy = purpose === "reset" ? "Password reset code" : "Sign-in / verification code";
  const subject = `${code} — ${storeName} ${enWhy}`;
  const text = [
    `${storeName}`,
    ``,
    `${bnWhy}: ${code}`,
    `কোডটি ${OTP_VALID_MINUTES} মিনিট পর্যন্ত বৈধ। এটি কাউকে জানাবেন না। আপনি চেয়ে না থাকলে এই ইমেইল উপেক্ষা করুন।`,
    ``,
    `${enWhy}: ${code}`,
    `Valid for ${OTP_VALID_MINUTES} minutes. Never share it. If you did not ask for it, ignore this e-mail.`,
  ].join("\n");
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const html = `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:20px;color:#131921">
<h2 style="margin:0 0 12px">${esc(storeName)}</h2>
<p style="margin:0 0 6px">${bnWhy} / ${enWhy}</p>
<p style="font-size:36px;letter-spacing:12px;font-weight:700;margin:12px 0;background:#f3f4f6;text-align:center;padding:14px;border-radius:8px">${code}</p>
<p style="color:#555;font-size:13px;margin:0 0 6px">কোডটি ${OTP_VALID_MINUTES} মিনিট পর্যন্ত বৈধ। এটি কাউকে জানাবেন না। আপনি চেয়ে না থাকলে এই ইমেইল উপেক্ষা করুন।</p>
<p style="color:#555;font-size:13px;margin:0">Valid for ${OTP_VALID_MINUTES} minutes. Never share it. If you did not ask for it, ignore this e-mail.</p>
</div>`;
  return { subject, text, html };
}
