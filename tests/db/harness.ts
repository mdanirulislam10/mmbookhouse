import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

/** Minimal stand-in for the parts of Supabase our SQL relies on. */
const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to service_role;
`;

export function migrationFiles(): string[] {
  const dir = path.join(root, "supabase/migrations");
  return fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(dir, f));
}

export async function createDb(): Promise<PGlite> {
  const db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(SUPABASE_STUB);
  // Run the real reset script first, exactly as the owner will in Supabase.
  await db.exec(fs.readFileSync(path.join(root, "supabase/reset_public_schema.sql"), "utf8"));
  for (const file of migrationFiles()) {
    await db.exec(fs.readFileSync(file, "utf8"));
  }
  return db;
}

export type Db = PGlite;

/** Run `fn` as an end user (RLS applies). */
export async function asUser<T>(db: Db, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${userId ? "authenticated" : "anon"}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role`);
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}

/** Run as the service role (bypasses RLS, no user). */
export async function asService<T>(db: Db, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role service_role`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role`);
  }
}

export async function newUser(db: Db, email: string, name = "Test User"): Promise<string> {
  const r = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data) values ($1, jsonb_build_object('full_name', $2::text)) returning id`,
    [email, name],
  );
  return r.rows[0].id;
}

export async function expectError(p: Promise<unknown>, contains: string): Promise<void> {
  try {
    await p;
  } catch (e) {
    const msg = String((e as Error).message ?? e);
    if (!msg.includes(contains)) throw new Error(`Expected error containing "${contains}", got: ${msg}`);
    return;
  }
  throw new Error(`Expected error containing "${contains}", but call succeeded`);
}
