export function parseBackupTime(name: string): number | null;
export function selectBackupsToPrune(
  files: { id: string; name: string }[],
  options?: { now?: number; keepDays?: number; keepMonths?: number; keepNewest?: number; protectIds?: string[] },
): { id: string; name: string }[];
export function retentionFromEnv(env?: Record<string, string | undefined>): { keepDays: number; keepMonths: number; keepNewest: number };
