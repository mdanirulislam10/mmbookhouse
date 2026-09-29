// Creates confirmed TEST accounts (owner + customer) with random passwords, saved to tests/.e2e-users.local.json (gitignored).
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const out = {};
for (const [k, email, name] of [["owner", "test-owner@example.test", "Test Owner"], ["customer", "test-customer@example.test", "Test Customer"]]) {
  const password = randomBytes(9).toString("base64url") + "9!";
  const list = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const ex = list.data.users.find((u) => u.email === email);
  if (ex) await db.auth.admin.updateUserById(ex.id, { password, email_confirm: true });
  else {
    const r = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
    if (r.error) throw r.error;
  }
  out[k] = { email, password };
}
fs.writeFileSync("tests/.e2e-users.local.json", JSON.stringify(out, null, 2));
console.log("test users ready");
