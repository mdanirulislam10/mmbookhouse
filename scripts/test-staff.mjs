// TEST staff accounts for role checks. Usage:
//   node --env-file=.env.local scripts/test-staff.mjs on    creates/enables inventory + dispatch test staff (credentials -> tests/.e2e-users.local.json)
//   node --env-file=.env.local scripts/test-staff.mjs off   bans them and deactivates their staff rows
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import fs from "node:fs";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const mode = process.argv[2];
const ACCOUNTS = [
  { key: "inventory", email: "test-inventory@example.test", name: "Test Inventory", role: "inventory_manager" },
  { key: "dispatch", email: "test-dispatch@example.test", name: "Test Dispatch", role: "dispatch_staff" },
];
const FILE = "tests/.e2e-users.local.json";
if (!["on", "off"].includes(mode)) throw new Error("usage: test-staff.mjs on|off");

const out = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : {};
const list = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
for (const a of ACCOUNTS) {
  let user = list.data.users.find((u) => u.email === a.email);
  if (mode === "on") {
    const password = randomBytes(9).toString("base64url") + "9!";
    if (user) {
      const r = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true, ban_duration: "none" });
      if (r.error) throw r.error;
    } else {
      const r = await db.auth.admin.createUser({ email: a.email, password, email_confirm: true, user_metadata: { full_name: a.name } });
      if (r.error) throw r.error;
      user = r.data.user;
    }
    const s = await db.from("staff_members").upsert({ user_id: user.id, role: a.role, display_name: a.name, is_active: true }, { onConflict: "user_id" });
    if (s.error) throw s.error;
    out[a.key] = { email: a.email, password };
    console.log("enabled", a.email, a.role);
  } else if (user) {
    const r = await db.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
    if (r.error) throw r.error;
    await db.from("staff_members").update({ is_active: false }).eq("user_id", user.id);
    console.log("disabled", a.email);
  }
}
if (mode === "on") fs.writeFileSync(FILE, JSON.stringify(out, null, 2));
