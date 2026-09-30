import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkCode, issueCode, OTP_LENGTH, renderOtpEmail } from "@/lib/auth/email-otp";

const T0 = Date.UTC(2026, 8, 30, 10, 0, 0); // start of a 5-minute slot
const SLOT = 5 * 60_000;

beforeEach(() => {
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-for-tests");
});

describe("4-digit e-mail codes", () => {
  it("issues exactly four digits", () => {
    for (const email of ["a@x.com", "b@x.com", "c@x.com", "বাংলা@x.com"]) expect(issueCode(email, "auth", T0)).toMatch(/^\d{4}$/);
    expect(OTP_LENGTH).toBe(4);
  });

  it("repeats the same code within a slot, so a resend does not invalidate the first mail", () => {
    expect(issueCode("a@x.com", "auth", T0)).toBe(issueCode("a@x.com", "auth", T0 + SLOT - 1));
  });

  it("does not depend on letter case or stray spaces of the address", () => {
    expect(issueCode(" A@X.com ", "auth", T0)).toBe(issueCode("a@x.com", "auth", T0));
  });

  it("accepts the code for 5 to 10 minutes and then rejects it", () => {
    const code = issueCode("a@x.com", "auth", T0);
    expect(checkCode("a@x.com", "auth", code, T0)).toBe(true);
    expect(checkCode("a@x.com", "auth", code, T0 + SLOT + 1000)).toBe(true); // previous slot still valid
    expect(checkCode("a@x.com", "auth", code, T0 + 2 * SLOT)).toBe(false);
    expect(checkCode("a@x.com", "auth", code, T0 + 30 * 60_000)).toBe(false);
  });

  it("is tied to the address and to what it was issued for", () => {
    const emails = Array.from({ length: 300 }, (_, i) => `user${i}@x.com`);
    // A code that works for one address / purpose only rarely (chance 1 in 10 000) works for another.
    const crossAddress = emails.filter((e, i) => checkCode(emails[(i + 1) % emails.length], "auth", issueCode(e, "auth", T0), T0)).length;
    const crossPurpose = emails.filter((e) => checkCode(e, "reset", issueCode(e, "auth", T0), T0)).length;
    const crossSignup = emails.filter((e) => checkCode(e, "signup", issueCode(e, "auth", T0), T0)).length;
    expect(crossAddress).toBeLessThan(4);
    expect(crossPurpose).toBeLessThan(4);
    expect(crossSignup).toBeLessThan(4);
  });

  it("rejects wrong shapes without throwing", () => {
    for (const bad of ["", "123", "12345", "abcd", "12 4", "١٢٣٤"]) expect(checkCode("a@x.com", "auth", bad, T0)).toBe(false);
  });

  it("changes when the server key changes", () => {
    const emails = Array.from({ length: 300 }, (_, i) => `user${i}@x.com`);
    const before = emails.map((e) => issueCode(e, "auth", T0));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "a-different-key");
    const same = emails.filter((e, i) => issueCode(e, "auth", T0) === before[i]).length;
    expect(same).toBeLessThan(4);
  });

  it("is spread evenly enough that guessing gains nothing", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(issueCode(`user${i}@x.com`, "auth", T0));
    expect(seen.size).toBeGreaterThan(1500); // ~1800 expected for 2000 draws from 10 000 values
  });

  it("refuses to run without the server key", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => issueCode("a@x.com", "auth", T0)).toThrow(/SERVICE_ROLE_KEY/);
  });
});

describe("code e-mail", () => {
  it("shows the code in Bengali and English and escapes the shop name", () => {
    const m = renderOtpEmail("4821", "auth", "<b>Shop</b>");
    expect(m.subject).toContain("4821");
    expect(m.text).toContain("4821");
    expect(m.text).toContain("মিনিট");
    expect(m.html).toContain(">4821<");
    expect(m.html).not.toContain("<b>Shop</b>");
    expect(renderOtpEmail("1111", "reset", "S").text).toContain("পাসওয়ার্ড বদলানোর কোড");
  });
});
