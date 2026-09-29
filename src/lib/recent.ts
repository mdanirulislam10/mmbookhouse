/** "Recently viewed" list kept in a plain cookie of book slugs (newest first). No account or database needed. */
export const RECENT_COOKIE = "mm_recent";
export const MAX_RECENT = 12;

const clean = (slug: string) => slug.length > 0 && slug.length <= 150 && !/[\u0000-\u001f]/.test(slug);

export function parseRecent(value: string | undefined | null): string[] {
  if (!value) return [];
  const out: string[] = [];
  for (const part of value.split(",")) {
    let slug: string;
    try {
      slug = decodeURIComponent(part);
    } catch {
      continue;
    }
    if (clean(slug) && !out.includes(slug)) out.push(slug);
    if (out.length >= MAX_RECENT) break;
  }
  return out;
}

/** The list after viewing `slug`: it moves to the front, duplicates drop out, the length is capped. */
export function pushRecent(list: string[], slug: string): string[] {
  return [slug, ...list.filter((s) => s !== slug)].slice(0, MAX_RECENT);
}

export function serializeRecent(list: string[]): string {
  return list.map(encodeURIComponent).join(",");
}
