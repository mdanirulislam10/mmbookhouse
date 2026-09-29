// Probes the running app (default http://localhost:3000) as each TEST staff role and prints what each admin URL returns.
//   node --env-file=.env.local scripts/role-probe.mjs [baseUrl]
// Needs test staff from `scripts/test-staff.mjs on`. Session cookies are built the same way @supabase/ssr does.
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ref = new URL(url).hostname.split(".")[0];
const users = JSON.parse(fs.readFileSync("tests/.e2e-users.local.json", "utf8"));

async function cookieFor({ email, password }) {
  const db = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const value = "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64url");
  const name = `sb-${ref}-auth-token`;
  const chunks = value.match(/.{1,3180}/g) ?? [];
  return chunks.length === 1 ? `${name}=${value}` : chunks.map((c, i) => `${name}.${i}=${c}`).join("; ");
}

const PAGES = ["/admin", "/admin/orders", "/admin/orders?tab=verify", "/admin/books", "/admin/books/new", "/admin/books/import", "/admin/inventory", "/admin/inventory/pos", "/admin/catalog", "/admin/reviews", "/admin/marketing", "/admin/enquiries", "/admin/customers", "/admin/reports", "/admin/settings", "/admin/notifications", "/admin/staff", "/admin/backups", "/admin/audit"];
const APIS = ["/api/admin/export/orders", "/api/admin/export/gstr1", "/api/admin/export/customers", "/api/admin/export/inventory", "/api/admin/books/search?q=book"];

async function status(cookie, path) {
  const r = await fetch(base + path, { headers: { cookie }, redirect: "manual" });
  if (r.status >= 300 && r.status < 400) return `${r.status} -> ${r.headers.get("location")?.replace(base, "")}`;
  return String(r.status);
}

const extra = process.argv[3] ? JSON.parse(process.argv[3]) : {};
for (const key of ["inventory", "dispatch"]) {
  const cookie = await cookieFor(users[key]);
  console.log(`\n=== ${key} ===`);
  const paths = [...PAGES, ...APIS, ...(extra[key] ?? [])];
  for (const p of paths) console.log(p.padEnd(44), await status(cookie, p));
}
