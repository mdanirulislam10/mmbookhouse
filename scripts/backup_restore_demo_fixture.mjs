import { createHash, randomBytes } from 'node:crypto';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const statePath = '.backup-restore-drill-state.json';
const mode = process.argv[2];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase service credentials are required.');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  const suffix = String(process.env.GITHUB_RUN_ID || Date.now()).replace(/\D/g, '');
  const email = `backup-drill-${suffix}@example.invalid`;
  const password = `Drill-${randomBytes(24).toString('base64url')}!9a`;
  const bucket = `backup-drill-${suffix}`;
  const object = 'evidence/actual-storage-file.txt';
  const bytes = Buffer.from(`MM Book House backup restore evidence ${suffix} ${randomBytes(32).toString('hex')}\n`);
  const sha256 = createHash('sha256').update(bytes).digest('hex');

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { purpose: 'temporary-backup-restore-drill' },
  });
  if (authError || !authData.user) throw new Error(`Could not create demo Auth user: ${authError?.message || 'empty response'}`);

  const state = { userId: authData.user.id, email, password, bucket, object, sha256 };
  await writeFile(statePath, JSON.stringify(state), { flag: 'wx' });
  try {
    const { error: bucketError } = await supabase.storage.createBucket(bucket, { public: false });
    if (bucketError) throw new Error(`Could not create demo Storage bucket: ${bucketError.message}`);
    const { error: uploadError } = await supabase.storage.from(bucket).upload(object, bytes, {
      contentType: 'text/plain',
      upsert: false,
    });
    if (uploadError) throw new Error(`Could not upload demo Storage file: ${uploadError.message}`);
  } catch (error) {
    await supabase.auth.admin.deleteUser(state.userId).catch(() => {});
    throw error;
  }

  if (process.env.GITHUB_ENV) {
    console.log(`::add-mask::${password}`);
    await appendFile(process.env.GITHUB_ENV, [
      `RESTORE_TEST_EMAIL=${email}`,
      `RESTORE_TEST_PASSWORD=${password}`,
      `RESTORE_TEST_STORAGE_BUCKET=${bucket}`,
      `RESTORE_TEST_STORAGE_OBJECT=${object}`,
      `RESTORE_TEST_STORAGE_SHA256=${sha256}`,
      '',
    ].join('\n'));
  }
  console.log(`Temporary demo fixture created: one confirmed Auth user and ${bucket}/${object}.`);
}

async function cleanup() {
  let state;
  try {
    state = JSON.parse(await readFile(statePath, 'utf8'));
  } catch {
    console.log('No demo fixture state found; cleanup skipped.');
    return;
  }
  const failures = [];
  const { error: removeError } = await supabase.storage.from(state.bucket).remove([state.object]);
  if (removeError) failures.push(`file: ${removeError.message}`);
  const { error: bucketError } = await supabase.storage.deleteBucket(state.bucket);
  if (bucketError) failures.push(`bucket: ${bucketError.message}`);
  const { error: userError } = await supabase.auth.admin.deleteUser(state.userId);
  if (userError) failures.push(`user: ${userError.message}`);
  if (failures.length) throw new Error(`Demo cleanup incomplete (${failures.join('; ')}).`);
  console.log('Temporary production demo Auth user, Storage file, and bucket removed.');
}

if (mode === 'seed') await seed();
else if (mode === 'cleanup') await cleanup();
else throw new Error('Usage: node scripts/backup_restore_demo_fixture.mjs <seed|cleanup>');
