import { z } from "zod";

/** Result shape shared by every server action. `error` is an error code the UI translates. */
export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; detail?: string };

export function fail(error: string, detail?: string): { ok: false; error: string; detail?: string } {
  return { ok: false, error, detail };
}

/** Pulls the machine-readable code (and detail) out of a Postgres/PostgREST error. */
export function dbError(err: { message?: string; details?: string | null } | null | undefined): { ok: false; error: string; detail?: string } {
  const code = (err?.message ?? "").trim();
  if (/^[A-Z][A-Z0-9_]+$/.test(code)) return fail(code, err?.details ?? undefined);
  if (code) console.error("[db]", code);
  return fail("GENERIC");
}

export const uuid = z.string().uuid();
