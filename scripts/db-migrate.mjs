// Applies supabase/all_migrations.sql (or reset_and_migrate.sql with --reset) using SUPABASE_DB_URL.
//   npm run db:migrate            -> migrations only
//   npm run db:migrate -- --reset -> DESTRUCTIVE: wipes the public schema first (asks you to type YES)
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
const reset = process.argv.includes("--reset");
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Set SUPABASE_DB_URL (Supabase -> Project Settings -> Database -> Connection string, session pooler).");
  process.exit(1);
}
if (reset) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("This DELETES every table and row in the public schema. Type YES to continue: ");
  rl.close();
  if (answer.trim() !== "YES") process.exit(1);
}
await import("./db-bundle.mjs");
const sql = fs.readFileSync(path.join(root, reset ? "supabase/reset_and_migrate.sql" : "supabase/all_migrations.sql"), "utf8");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log("Done.");
} finally {
  await client.end();
}
