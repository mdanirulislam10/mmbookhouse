// Row counts of everything that matters, taken from production while the backup is made and compared with the
// restored copy afterwards. Works with any SQL runner that returns rows as arrays of strings.

export const TABLE_LIST_SQL =
  "select table_schema, table_name from information_schema.tables " +
  "where table_type = 'BASE TABLE' and (table_schema = 'public' " +
  "or (table_schema = 'auth' and table_name in ('users', 'identities')) " +
  "or (table_schema = 'storage' and table_name in ('objects', 'buckets'))) " +
  "order by 1, 2";

const ident = (s) => `"${String(s).replaceAll('"', '""')}"`;
const literal = (s) => `'${String(s).replaceAll("'", "''")}'`;

/** One UNION ALL statement returning (name, count) for every listed table. */
export function countQuery(tables) {
  if (!tables.length) return "select 'none'::text, 0::bigint where false";
  return tables
    .map(([schema, name]) => `select ${literal(`${schema}.${name}`)}::text as t, count(*)::bigint as n from ${ident(schema)}.${ident(name)}`)
    .join(" union all ");
}

/** @param {(sql: string) => Promise<string[][]>} run */
export async function collectRowCounts(run) {
  const tables = await run(TABLE_LIST_SQL);
  const rows = await run(countQuery(tables));
  return Object.fromEntries(rows.map(([name, n]) => [name, Number(n)]));
}

/**
 * A restored table must hold a row count between the counts taken just before and just after the dump
 * (rows may be added or removed while the dump runs), and no table may appear or vanish.
 * @param {{ before: Record<string, number>, after: Record<string, number> }} expected
 * @param {Record<string, number>} restored
 */
export function compareRowCounts(expected, restored) {
  const problems = [];
  const names = new Set([...Object.keys(expected.before), ...Object.keys(expected.after)]);
  let rows = 0;
  for (const name of [...names].sort()) {
    const b = expected.before[name];
    const a = expected.after[name];
    const got = restored[name];
    if (got === undefined) {
      problems.push(`${name}: missing after restore`);
      continue;
    }
    const lo = Math.min(b ?? a, a ?? b);
    const hi = Math.max(b ?? a, a ?? b);
    if (got < lo || got > hi) problems.push(`${name}: restored ${got}, production had ${lo === hi ? lo : `${lo}–${hi}`}`);
    rows += got;
  }
  for (const name of Object.keys(restored)) if (!names.has(name)) problems.push(`${name}: present after restore but not in production`);
  return { ok: problems.length === 0, problems, tables: names.size, rows };
}
