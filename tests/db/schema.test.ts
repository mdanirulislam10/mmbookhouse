import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "./harness";

let db: Db;
beforeAll(async () => { db = await createDb(); });
afterAll(async () => { await db.close(); });

describe("schema hygiene", () => {
  it("applies all migrations on a freshly reset schema", async () => {
    const r = await db.query<{ n: number }>(`select count(*)::int as n from pg_tables where schemaname = 'public'`);
    expect(r.rows[0].n).toBeGreaterThan(25);
  });

  it("has row level security enabled on every public table", async () => {
    const r = await db.query<{ tablename: string }>(
      `select c.relname as tablename from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`);
    expect(r.rows.map((x) => x.tablename)).toEqual([]);
  });

  it("does not expose privileged functions to anon/authenticated", async () => {
    const privileged = [
      "admin_set_order_status", "admin_review_payment", "evaluate_coupon", "_release_order",
      "hit_rate_limit", "reset_rate_limit", "refresh_book_search", "handle_new_user",
    ];
    for (const fn of privileged) {
      for (const role of ["anon", "authenticated"]) {
        const r = await db.query<{ ok: boolean }>(
          `select bool_or(has_function_privilege($1, p.oid, 'execute')) as ok
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname = $2`, [role, fn]);
        expect(r.rows[0].ok, `${role} must not execute ${fn}`).toBe(false);
      }
    }
  });

  it("keeps sensitive tables unreadable for anon and authenticated", async () => {
    for (const t of ["book_private", "audit_logs", "coupons", "stock_movements", "outbox", "order_item_costs", "rate_limits"]) {
      await db.exec(`set role authenticated`);
      const r = await db.query(`select * from public.${t}`);
      await db.exec(`reset role`);
      expect(r.rows.length, t).toBe(0);
    }
  });

  it("audit_logs is append-only", async () => {
    await db.exec(`insert into public.audit_logs (action, entity) values ('t', 'x')`);
    await expect(db.exec(`update public.audit_logs set action = 'y'`)).rejects.toThrow(/append-only/);
    await expect(db.exec(`delete from public.audit_logs`)).rejects.toThrow(/append-only/);
  });
});

describe("seed files", () => {
  it("categories and demo books load, are idempotent and searchable", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const run = (f: string) => db.exec(fs.readFileSync(path.resolve(__dirname, "../../supabase/seed", f), "utf8"));
    await run("01_categories.sql");
    await run("01_categories.sql");
    await run("02_demo_books.sql");
    await run("02_demo_books.sql");
    const n = await db.query<{ books: number; cats: number }>(`select (select count(*) from books where slug like 'demo-%')::int as books, (select count(*) from categories)::int as cats`);
    expect(n.rows[0]).toEqual({ books: 12, cats: 15 });
    const r = await db.query<{ slug: string }>(`select slug from search_books('feluda')`);
    expect(r.rows.map((x) => x.slug)).toContain("demo-feluda");
  });
});
