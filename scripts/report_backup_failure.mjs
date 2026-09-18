const jobId = process.env.BACKUP_JOB_ID?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId) || !supabaseUrl || !serviceRoleKey) {
  console.log('No reportable manual backup job was supplied.');
  process.exit(0);
}

const response = await fetch(`${supabaseUrl}/rest/v1/backup_jobs?id=eq.${encodeURIComponent(jobId)}`, {
  method: 'PATCH',
  headers: {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'content-type': 'application/json',
    prefer: 'return=minimal',
  },
  body: JSON.stringify({
    status: 'failed',
    completed_at: new Date().toISOString(),
    error_message: `Backup worker failed before completion. GitHub run: ${process.env.GITHUB_RUN_ID || 'unknown'}`,
  }),
});

if (!response.ok) {
  console.error(`Could not report backup failure (${response.status}).`);
  process.exitCode = 1;
}
