export const TABLE_LIST_SQL: string;
export function countQuery(tables: string[][]): string;
export function collectRowCounts(run: (sql: string) => Promise<string[][]>): Promise<Record<string, number>>;
export function compareRowCounts(
  expected: { before: Record<string, number>; after: Record<string, number> },
  restored: Record<string, number>,
): { ok: boolean; problems: string[]; tables: number; rows: number };
