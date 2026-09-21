import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { google } from 'googleapis';

const required = [
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
  'BACKUP_ENCRYPTION_KEY',
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing required secret: ${name}`);
}

const folderName = 'mmbookhousebackup';
const image = 'ghcr.io/supabase/postgres:17.6.1.167';
let tempDirectory;
let containerId;

function command(program, args, { inputPath } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { shell: false, stdio: [inputPath ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout = (stdout + chunk.toString()).slice(-8192); });
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-8192); });
    child.once('error', reject);
    if (inputPath) {
      const source = createReadStream(inputPath);
      source.once('error', reject);
      // psql can exit on its first SQL error while the large data dump is still
      // being streamed. Ignore the resulting broken pipe and report psql's
      // original error from the child process instead.
      child.stdin.on('error', (error) => {
        if (error.code !== 'EPIPE') reject(error);
      });
      source.pipe(child.stdin);
      child.once('close', () => source.destroy());
    }
    child.once('close', (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(Object.assign(new Error(`${program} exited with code ${code}`), { detail: `${stderr}\n${stdout}` }));
    });
  });
}

async function psql(filePath, stage, user = 'postgres') {
  try {
    const args = [
      'exec', '-i', containerId, 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1',
      '-U', user, '-d', 'postgres',
    ];
    if (stage === 'Data') args.push('-c', 'SET session_replication_role = replica');
    args.push('-f', '-');
    await command('docker', args, { inputPath: filePath });
    console.log(`${stage} restored`);
  } catch (error) {
    const detail = error.detail || '';
    const type = /extension .* is not available/i.test(detail) ? 'missing database extension'
      : /role .* does not exist/i.test(detail) ? 'missing database role'
      : /permission denied/i.test(detail) ? 'permission mismatch'
      : /foreign key constraint/i.test(detail) ? 'foreign-key order problem'
      : 'SQL restore error';
    const sqlError = detail.split('\n').find((line) => /(?:ERROR|FATAL):|psql:|invalid command/i.test(line));
    const safeError = sqlError?.replace(/'[^']*'/g, '[value]').slice(0, 250);
    throw new Error(`${stage} failed (${type}${safeError ? `: ${safeError}` : ''}); production was not touched.`);
  }
}

try {
  tempDirectory = await mkdtemp(join(tmpdir(), 'mmbookhouse-restore-drill-'));
  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  );
  oauth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  const drive = google.drive({ version: 'v3', auth: oauth });
  const folders = await drive.files.list({
    q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name)', spaces: 'drive', pageSize: 10,
  });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || folders.data.files?.[0]?.id;
  if (!folderId) throw new Error('Backup folder was not found in Google Drive.');
  const files = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,description,createdTime)',
    orderBy: 'createdTime desc', pageSize: 100,
  });
  const selected = files.data.files?.find((file) =>
    file.name?.endsWith('.zip.enc') && (file.name.startsWith('mmbookhousebackup_') || file.name.startsWith('MMM-Enterprise_'))
  );
  if (!selected?.id) throw new Error('No encrypted backup file was found.');
  console.log(`Testing restore of ${selected.name}`);
  const encryptedPath = join(tempDirectory, 'backup.zip.enc');
  const response = await drive.files.get({ fileId: selected.id, alt: 'media' }, { responseType: 'stream' });
  await pipeline(response.data, createWriteStream(encryptedPath, { flags: 'wx' }));
  const expectedHash = /SHA-256:\s*([a-f0-9]{64})/i.exec(selected.description || '')?.[1];
  if (expectedHash) {
    const actualHash = createHash('sha256').update(await readFile(encryptedPath)).digest('hex');
    if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) throw new Error('Backup checksum mismatch.');
    console.log('Encrypted backup checksum verified');
  }
  const zipPath = join(tempDirectory, 'backup.zip');
  await command(process.execPath, ['scripts/decrypt_backup.mjs', encryptedPath, zipPath]);
  const extracted = join(tempDirectory, 'extracted');
  await command('python3', ['scripts/extract_backup_for_drill.py', zipPath, extracted]);
  console.log('Backup decrypted and archive verified');

  const containerName = `mmbookhouse-restore-drill-${randomBytes(4).toString('hex')}`;
  const password = randomBytes(24).toString('hex');
  containerId = await command('docker', [
    'run', '--detach', '--rm', '--network', 'none', '--name', containerName,
    '--env', `POSTGRES_PASSWORD=${password}`, image,
  ]);
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await command('docker', ['exec', containerId, 'pg_isready', '-U', 'postgres']);
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  if (!ready) throw new Error('Isolated PostgreSQL did not start.');
  console.log('Isolated PostgreSQL started (no network exposure)');
  // The image ships Supabase extensions, but a bare container does not run the
  // full self-hosted role bootstrap. The platform roles are intentionally
  // excluded from the Supabase CLI roles dump, so provision them only here.
  const platformRoles = [
    'anon', 'authenticated', 'authenticator', 'service_role', 'dashboard_user',
    'supabase_admin', 'supabase_auth_admin', 'supabase_storage_admin',
    'supabase_realtime_admin', 'supabase_replication_admin',
    'supabase_read_only_user', 'pgbouncer',
  ];
  const roleBootstrap = platformRoles.map((role) =>
    `SELECT 'CREATE ROLE ${role}' WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}')\\gexec`
  ).join('\n');
  const bootstrapPath = join(tempDirectory, 'platform-roles.sql');
  await writeFile(bootstrapPath, roleBootstrap);
  await psql(bootstrapPath, 'Isolated platform roles', 'supabase_admin');
  await psql(join(extracted, 'roles.sql'), 'Roles', 'supabase_admin');
  await psql(join(extracted, 'schema.sql'), 'Schema', 'supabase_admin');
  await psql(join(extracted, 'data.sql'), 'Data', 'supabase_admin');
  const tableCount = Number(await command('docker', [
    'exec', containerId, 'psql', '-X', '-A', '-t', '-U', 'postgres', '-d', 'postgres',
    '-c', "select count(*) from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'",
  ]));
  if (!Number.isInteger(tableCount) || tableCount < 1) throw new Error('Restore produced no public tables.');
  console.log(`RESTORE DRILL PASSED: roles, schema, and data loaded into isolated PostgreSQL (${tableCount} public tables).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (containerId) await command('docker', ['stop', containerId]).catch(() => {});
  if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
}
