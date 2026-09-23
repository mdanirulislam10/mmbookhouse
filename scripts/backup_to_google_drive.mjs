import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { appendFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import { ZipArchive } from 'archiver';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const STATUS_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const name of STATUS_ENV) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

const BACKUP_ENV = [
  'SUPABASE_DB_URL',
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
  'BACKUP_ENCRYPTION_KEY',
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suppliedJobId = process.env.BACKUP_JOB_ID?.trim();
let jobId = suppliedJobId || null;
let temporaryDirectory = null;

async function createOrStartJob() {
  if (jobId) {
    const { error } = await supabase
      .from('backup_jobs')
      .update({ status: 'running', started_at: new Date().toISOString(), error_message: null })
      .eq('id', jobId);
    if (error) throw new Error(`Could not start backup job ${jobId}: ${error.message}`);
    return;
  }

  const { data, error } = await supabase
    .from('backup_jobs')
    .insert({ trigger_type: 'scheduled', status: 'running', started_at: new Date().toISOString() })
    .select('id')
    .single();
  if (error || !data) throw new Error(`Could not create scheduled backup job: ${error?.message || 'unknown error'}`);
  jobId = data.id;
}

async function updateJob(values) {
  if (!jobId) return;
  const { error } = await supabase.from('backup_jobs').update(values).eq('id', jobId);
  if (error) console.error(`Could not update backup job ${jobId}: ${error.message}`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function dumpWithPostgresImage(databaseUrl, outputPath, dumpFlags, label) {
  const parsed = new URL(databaseUrl);
  const args = [
    'run', '--rm', '--entrypoint', 'pg_dump',
    '--env', `PGPASSWORD=${decodeURIComponent(parsed.password)}`,
    '--env', 'PGSSLMODE=require',
    'ghcr.io/supabase/postgres:17.6.1.167',
    ...dumpFlags,
    '--no-owner', '--no-acl', '--no-password',
    '--host', parsed.hostname, '--port', parsed.port || '5432',
    '--username', decodeURIComponent(parsed.username),
    '--dbname', decodeURIComponent(parsed.pathname.slice(1) || 'postgres'),
  ];
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'inherit'], shell: false });
    const output = createWriteStream(outputPath, { flags: 'wx' });
    let exited = false;
    let finished = false;
    const maybeResolve = () => { if (exited && finished) resolve(); };
    child.stdout.pipe(output);
    child.once('error', reject);
    output.once('error', reject);
    output.once('finish', () => { finished = true; maybeResolve(); });
    child.once('close', (code) => {
      if (code !== 0) reject(new Error(`${label} export exited with code ${code}`));
      else { exited = true; maybeResolve(); }
    });
  });
}

async function createZip(outputPath, files, manifest) {
  const output = createWriteStream(outputPath, { flags: 'wx' });
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const completion = new Promise((resolve, reject) => {
    output.once('close', resolve);
    output.once('error', reject);
    archive.once('error', reject);
  });
  archive.pipe(output);
  for (const file of files) archive.file(file.path, { name: file.name });
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
  await archive.finalize();
  await completion;
}

async function listStorageObjects(bucketId, prefix = '') {
  const objects = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucketId).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`Could not list Storage bucket ${bucketId}: ${error.message}`);
    for (const entry of data || []) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) objects.push(name);
      else objects.push(...await listStorageObjects(bucketId, name));
    }
    if (!data || data.length < 1000) break;
  }
  return objects;
}

async function downloadStorageObjects(directory) {
  await mkdir(directory, { recursive: true });
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Could not list Storage buckets: ${error.message}`);
  const manifest = [];
  for (const bucket of buckets || []) {
    for (const name of await listStorageObjects(bucket.id)) {
      const { data, error: downloadError } = await supabase.storage.from(bucket.id).download(name);
      if (downloadError || !data) {
        throw new Error(`Could not download Storage object ${bucket.id}/${name}: ${downloadError?.message || 'empty response'}`);
      }
      const bytes = Buffer.from(await data.arrayBuffer());
      const archiveName = `storage-objects/${String(manifest.length).padStart(6, '0')}.bin`;
      const localPath = join(directory, `${String(manifest.length).padStart(6, '0')}.bin`);
      await writeFile(localPath, bytes, { flag: 'wx' });
      manifest.push({
        bucketId: bucket.id,
        bucketPublic: bucket.public,
        name,
        archiveName,
        size: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
  return manifest;
}

async function encryptArchive(inputPath, outputPath) {
  const key = Buffer.from(process.env.BACKUP_ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const output = createWriteStream(outputPath, { flags: 'wx' });
  output.write(Buffer.from('MMEBACKUP1'));
  output.write(iv);
  await pipeline(createReadStream(inputPath), cipher, output);
  await appendFile(outputPath, cipher.getAuthTag());
}

async function sha256For(path) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

async function getDriveFolder(drive) {
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) return process.env.GOOGLE_DRIVE_FOLDER_ID;

  const escapedName = (process.env.GOOGLE_DRIVE_FOLDER_NAME || 'mmbookhousebackup').replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name)',
    spaces: 'drive',
    pageSize: 10,
  });
  if (existing.data.files?.[0]?.id) return existing.data.files[0].id;

  const created = await drive.files.create({
    requestBody: { name: process.env.GOOGLE_DRIVE_FOLDER_NAME || 'mmbookhousebackup', mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
  });
  if (!created.data.id) throw new Error('Google Drive folder could not be created.');
  return created.data.id;
}

function backupTimestamp() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}_${value.hour}-${value.minute}-${value.second}_IST`;
}

async function main() {
  await createOrStartJob();
  for (const name of BACKUP_ENV) {
    if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
  }
  if (!/^[a-fA-F0-9]{64}$/.test(process.env.BACKUP_ENCRYPTION_KEY)) {
    throw new Error('BACKUP_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes).');
  }
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'mme-backup-'));
  const rolesPath = join(temporaryDirectory, 'roles.sql');
  const schemaPath = join(temporaryDirectory, 'schema.sql');
  const managedSchemaPath = join(temporaryDirectory, 'managed-schema.sql');
  const authMigrationsPath = join(temporaryDirectory, 'auth-migrations.sql');
  const dataPath = join(temporaryDirectory, 'data.sql');
  const storageObjectsPath = join(temporaryDirectory, 'storage-objects');
  const archivePath = join(temporaryDirectory, 'database-backup.zip');
  const timestamp = backupTimestamp();
  const encryptedName = `mmbookhousebackup_${timestamp}.zip.enc`;
  const encryptedPath = join(temporaryDirectory, encryptedName);
  const cli = process.env.SUPABASE_CLI_COMMAND || 'supabase';
  const databaseUrl = process.env.SUPABASE_DB_URL;

  await run(cli, ['db', 'dump', '--db-url', databaseUrl, '-f', rolesPath, '--role-only']);
  await run(cli, ['db', 'dump', '--db-url', databaseUrl, '-f', schemaPath]);
  await dumpWithPostgresImage(databaseUrl, managedSchemaPath,
    ['--schema-only', '--schema=auth', '--schema=storage'], 'Managed schema');
  const managedSchema = await readFile(managedSchemaPath, 'utf8');
  if (!/CREATE TABLE (?:IF NOT EXISTS )?auth\.users\b/i.test(managedSchema)) {
    throw new Error('Managed Auth schema dump is incomplete; refusing to upload an un-restorable backup.');
  }
  await run(cli, [
    'db', 'dump', '--db-url', databaseUrl, '-f', dataPath, '--data-only', '--use-copy',
    '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes',
  ]);
  await dumpWithPostgresImage(databaseUrl, authMigrationsPath,
    ['--data-only', '--table=auth.schema_migrations'], 'Auth migration history');
  const storageObjects = await downloadStorageObjects(storageObjectsPath);

  const archiveFiles = [
    { path: rolesPath, name: 'roles.sql' },
    { path: schemaPath, name: 'schema.sql' },
    { path: managedSchemaPath, name: 'managed-schema.sql' },
    { path: dataPath, name: 'data.sql' },
    { path: authMigrationsPath, name: 'auth-migrations.sql' },
    ...storageObjects.map((object) => ({
      path: join(storageObjectsPath, object.archiveName.split('/').at(-1)),
      name: object.archiveName,
    })),
  ];
  await createZip(archivePath, archiveFiles, {
    project: 'MMM Enterprise',
    createdAt: new Date().toISOString(),
    timezone: 'Asia/Kolkata',
    formatVersion: 4,
    restoreOrder: ['roles.sql', 'managed-schema.sql', 'schema.sql', 'data.sql', 'auth-migrations.sql'],
    storageObjects,
    note: 'Logical PostgreSQL backup with Supabase Storage object bytes.',
  });

  await encryptArchive(archivePath, encryptedPath);
  const checksum = await sha256For(encryptedPath);
  const fileStat = await stat(encryptedPath);

  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET
  );
  oauth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  const drive = google.drive({ version: 'v3', auth: oauth });
  const folderId = await getDriveFolder(drive);
  const uploaded = await drive.files.create({
    requestBody: { name: encryptedName, parents: [folderId], description: `Encrypted Supabase logical backup. SHA-256: ${checksum}` },
    media: { mimeType: 'application/octet-stream', body: createReadStream(encryptedPath) },
    fields: 'id,name,size,webViewLink',
  });
  if (!uploaded.data.id) throw new Error('Google Drive did not return an uploaded file ID.');

  await updateJob({
    status: 'succeeded',
    completed_at: new Date().toISOString(),
    file_name: uploaded.data.name || encryptedName,
    drive_file_id: uploaded.data.id,
    drive_web_view_link: uploaded.data.webViewLink || `https://drive.google.com/file/d/${uploaded.data.id}/view`,
    file_size_bytes: Number(uploaded.data.size || fileStat.size),
    sha256: checksum,
    error_message: null,
  });
  console.log(`Backup completed: ${encryptedName} (${fileStat.size} bytes)`);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  await updateJob({ status: 'failed', completed_at: new Date().toISOString(), error_message: message.slice(0, 2000) });
  process.exitCode = 1;
} finally {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
}
