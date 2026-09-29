// Locks the TEST accounts made by make-test-users.mjs: bans the auth users and deactivates the test owner's staff row.
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const emails = ["test-owner@example.test", "test-customer@example.test"];
const list = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
for (const u of list.data.users.filter((x) => emails.includes(x.email))) {
  const r = await db.auth.admin.updateUserById(u.id, { ban_duration: "876000h" });
  if (r.error) throw r.error;
  const s = await db.from("staff_members").update({ is_active: false }).eq("user_id", u.id);
  if (s.error) throw s.error;
  console.log("disabled", u.email);
}
