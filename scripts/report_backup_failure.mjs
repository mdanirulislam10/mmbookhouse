// Records a backup that failed before the backup script could record it itself (e.g. a setup step failed),
// so the admin panel's Backups page shows the failure. Closes the given manual job, or adds a failed
// scheduled job when there is none.
const jobId = process.env.BACKUP_JOB_ID?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log('Supabase credentials are missing; nothing reported.');
  process.exit(0);
}
if (jobId && !/^[0-9a-f-]{36}$/i.test(jobId)) {
  console.log('The supplied backup job id is not valid; nothing reported.');
  process.exit(0);
}

const now = new Date().toISOString();
const failure = {
  status: 'failed',
  completed_at: now,
  error_message: `Backup worker failed before completion. GitHub run: ${process.env.GITHUB_RUN_ID || 'unknown'}`,
};
const headers = {
  apikey: serviceRoleKey,
  authorization: `Bearer ${serviceRoleKey}`,
  'content-type': 'application/json',
  prefer: 'return=minimal',
};

const response = jobId
  ? await fetch(`${supabaseUrl}/rest/v1/backup_jobs?id=eq.${encodeURIComponent(jobId)}`, { method: 'PATCH', headers, body: JSON.stringify(failure) })
  : await fetch(`${supabaseUrl}/rest/v1/backup_jobs`, { method: 'POST', headers, body: JSON.stringify({ ...failure, trigger_type: 'scheduled', started_at: now }) });

if (!response.ok) {
  console.error(`Could not report backup failure (${response.status}).`);
  process.exitCode = 1;
}
