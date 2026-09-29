// Which encrypted backup files in Google Drive may be moved to the trash.
// Rules (all configurable): keep everything from the last `keepDays` days, the newest file of every month for the
// last `keepMonths` months, and always the `keepNewest` most recent files. Files whose names we cannot parse
// (older formats, files someone added by hand) are never touched.

const NAME = /^mmbookhousebackup_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})_IST\.zip\.enc$/;
const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

/** Epoch milliseconds encoded in a backup file name (the name carries India time), or null. */
export function parseBackupTime(name) {
  const m = NAME.exec(name ?? "");
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, s) - IST_OFFSET_MS;
}

const monthIndex = (ms) => {
  const d = new Date(ms + IST_OFFSET_MS);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
};

/**
 * @param {{ id: string, name: string }[]} files backups currently in the folder
 * @returns {{ id: string, name: string }[]} the files that fall outside the retention policy
 */
export function selectBackupsToPrune(files, { now = Date.now(), keepDays = 30, keepMonths = 24, keepNewest = 7, protectIds = [] } = {}) {
  const parsed = files
    .map((f) => ({ ...f, t: parseBackupTime(f.name) }))
    .filter((f) => f.t !== null)
    .sort((a, b) => b.t - a.t);

  const keep = new Set(protectIds);
  for (const f of parsed.slice(0, keepNewest)) keep.add(f.id);

  const cutoff = now - keepDays * DAY_MS;
  for (const f of parsed) if (f.t >= cutoff) keep.add(f.id);

  const thisMonth = monthIndex(now);
  const seen = new Set();
  for (const f of parsed) {
    const m = monthIndex(f.t);
    if (seen.has(m)) continue;
    seen.add(m); // parsed is newest-first, so the first file seen for a month is that month's newest
    if (thisMonth - m < keepMonths) keep.add(f.id);
  }

  return parsed.filter((f) => !keep.has(f.id)).map(({ id, name }) => ({ id, name }));
}

/** Reads the policy from the environment, ignoring anything that is not a sensible number. */
export function retentionFromEnv(env = process.env) {
  const num = (v, fallback, min) => (Number.isInteger(Number(v)) && v !== "" && v != null && Number(v) >= min ? Number(v) : fallback);
  return {
    keepDays: num(env.BACKUP_RETENTION_DAYS, 30, 7),
    keepMonths: num(env.BACKUP_RETENTION_MONTHS, 24, 1),
    keepNewest: num(env.BACKUP_KEEP_NEWEST, 7, 3),
  };
}
