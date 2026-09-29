import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { compareRowCounts, collectRowCounts, countQuery } from "../scripts/lib/backup-counts.mjs";
import { collectExternalConfig } from "../scripts/lib/backup-external-config.mjs";
import { parseBackupTime, retentionFromEnv, selectBackupsToPrune } from "../scripts/lib/backup-retention.mjs";
import { createDb, newUser, type Db } from "./db/harness";

const DAY = 86_400_000;
// Drive file names carry India time (UTC+5:30).
const name = (iso: string) => `mmbookhousebackup_${iso.replace("T", "_").replaceAll(":", "-")}_IST.zip.enc`;
const NOW = Date.UTC(2026, 8, 29, 12, 0, 0); // 29 Sep 2026

/** One backup per night (18:00 UTC = 23:30 IST) counting back from 28 Sep 2026. */
function daily(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(2026, 8, 28, 18, 0, 0) - i * DAY + 5.5 * 3_600_000);
    const p = (n: number) => String(n).padStart(2, "0");
    return { id: `f${i}`, name: name(`${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`) };
  });
}

describe("backup retention", () => {
  it("reads the time from the file name", () => {
    expect(parseBackupTime("mmbookhousebackup_2026-09-29_23-30-00_IST.zip.enc")).toBe(Date.UTC(2026, 8, 29, 18, 0, 0));
    expect(parseBackupTime("MMM-Enterprise_old.zip.enc")).toBeNull();
    expect(parseBackupTime("notes.txt")).toBeNull();
  });

  it("keeps everything from the last 30 days and never prunes a young archive", () => {
    expect(selectBackupsToPrune(daily(30), { now: NOW })).toEqual([]);
    expect(selectBackupsToPrune(daily(3), { now: NOW })).toEqual([]);
  });

  it("thins older backups to one per month", () => {
    const files = daily(120); // about four months
    const doomed = selectBackupsToPrune(files, { now: NOW });
    const kept = files.filter((f) => !doomed.some((d) => d.id === f.id));
    // the last 30 days are all kept
    for (const f of files.slice(0, 30)) expect(kept).toContainEqual(f);
    // beyond that, at most one file per calendar month survives
    const olderKept = kept.slice(30).map((f) => f.name.slice(18, 25));
    expect(new Set(olderKept).size).toBe(olderKept.length);
    expect(doomed.length).toBeGreaterThan(40);
  });

  it("keeps the newest file of a month as that month's archive", () => {
    const files = [
      { id: "aug-early", name: name("2026-08-02T23:30:00") },
      { id: "aug-late", name: name("2026-08-28T23:30:00") },
      { id: "jul-only", name: name("2026-07-15T23:30:00") },
      ...daily(5),
    ];
    const doomed = selectBackupsToPrune(files, { now: NOW, keepDays: 7, keepNewest: 3 }).map((f) => f.id);
    expect(doomed).toEqual(["aug-early"]);
  });

  it("drops files older than the monthly window, but not the protected one", () => {
    const files = [{ id: "ancient", name: name("2023-01-10T23:30:00") }, { id: "recent", name: name("2026-09-28T23:30:00") }, ...daily(8)];
    expect(selectBackupsToPrune(files, { now: NOW, keepNewest: 3 }).map((f) => f.id)).toEqual(["ancient"]);
    expect(selectBackupsToPrune(files, { now: NOW, keepNewest: 3, protectIds: ["ancient"] })).toEqual([]);
  });

  it("never touches files it cannot parse", () => {
    const files = [{ id: "x", name: "MMM-Enterprise_2020.zip.enc" }, { id: "y", name: "readme.txt" }, ...daily(8)];
    expect(selectBackupsToPrune(files, { now: NOW })).toEqual([]);
  });

  it("ignores nonsense retention settings", () => {
    expect(retentionFromEnv({ BACKUP_RETENTION_DAYS: "abc", BACKUP_RETENTION_MONTHS: "-4", BACKUP_KEEP_NEWEST: "1" })).toEqual({ keepDays: 30, keepMonths: 24, keepNewest: 7 });
    expect(retentionFromEnv({ BACKUP_RETENTION_DAYS: "90", BACKUP_RETENTION_MONTHS: "6", BACKUP_KEEP_NEWEST: "10" })).toEqual({ keepDays: 90, keepMonths: 6, keepNewest: 10 });
  });
});

describe("row count comparison", () => {
  const expected = { before: { "public.books": 10, "public.orders": 4, "auth.users": 3 }, after: { "public.books": 10, "public.orders": 5, "auth.users": 3 } };

  it("accepts exact and in-flight values", () => {
    expect(compareRowCounts(expected, { "public.books": 10, "public.orders": 4, "auth.users": 3 }).ok).toBe(true);
    expect(compareRowCounts(expected, { "public.books": 10, "public.orders": 5, "auth.users": 3 }).ok).toBe(true);
  });

  it("flags lost rows, extra rows and missing or unexpected tables", () => {
    const r = compareRowCounts(expected, { "public.books": 9, "public.orders": 6, "public.ghost": 1 });
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual(expect.arrayContaining([
      expect.stringContaining("public.books: restored 9"),
      expect.stringContaining("public.orders: restored 6"),
      expect.stringContaining("auth.users: missing after restore"),
      expect.stringContaining("public.ghost: present after restore"),
    ]));
  });
});

describe("row counts on the real schema", () => {
  let db: Db;
  beforeAll(async () => {
    db = await createDb();
    await newUser(db, "a@example.com", "A");
    await db.query(`insert into books (slug, title, mrp, sale_price, status) values ('b1','Book 1',100,90,'active'), ('b2','Book 2',100,90,'active')`);
  });
  afterAll(async () => {
    await db.close();
  });

  it("counts every public table plus auth.users", async () => {
    const run = async (sql: string) => (await db.query<unknown[]>(sql, [], { rowMode: "array" })).rows.map((row) => row.map(String));
    const counts = await collectRowCounts(run);
    expect(counts["public.books"]).toBe(2);
    expect(counts["auth.users"]).toBe(1);
    expect(Object.keys(counts).filter((k) => k.startsWith("public.")).length).toBeGreaterThan(30);
    // and the comparison agrees with itself
    expect(compareRowCounts({ before: counts, after: counts }, counts).ok).toBe(true);
  });

  it("quotes identifiers", () => {
    expect(countQuery([["public", 'we"ird']])).toContain('"public"."we""ird"');
  });
});

describe("dashboard settings export", () => {
  const okFetch = (log: string[]) => async (url: string) => {
    log.push(url);
    return new Response(JSON.stringify(url.includes("vercel") ? { envs: [{ key: "A", value: "1", target: ["production"], type: "encrypted" }, { key: "B", target: ["production"], type: "sensitive" }] } : { external_google_enabled: true }), { status: 200 });
  };
  const env = { NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co", SUPABASE_ACCESS_TOKEN: "sbp_x", VERCEL_TOKEN: "v_x", VERCEL_PROJECT_ID: "prj_1" };

  it("says loudly when tokens are missing", async () => {
    const r = await collectExternalConfig({ NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL }, okFetch([]));
    expect(r.summary).toEqual({ supabase: "skipped", vercel: "skipped" });
  });

  it("exports Supabase Auth/Storage/API settings and Vercel variables, flagging unreadable ones", async () => {
    const calls: string[] = [];
    const r = await collectExternalConfig(env, okFetch(calls));
    expect(calls).toEqual(expect.arrayContaining([
      "https://api.supabase.com/v1/projects/abcdefgh/config/auth",
      "https://api.supabase.com/v1/projects/abcdefgh/postgrest",
      "https://api.supabase.com/v1/projects/abcdefgh/config/storage",
    ]));
    expect(r.summary).toEqual({ supabase: "exported", vercel: "partial" });
    const file = r.file as { vercel: { unreadable: string[]; envs: unknown[] } };
    expect(file.vercel.unreadable).toEqual(["B"]);
    expect(file.vercel.envs).toHaveLength(2);
  });

  it("reports failures instead of hiding them", async () => {
    const r = await collectExternalConfig(env, async () => new Response("no", { status: 401 }));
    expect(r.summary).toEqual({ supabase: "failed", vercel: "failed" });
  });
});
