import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, appendFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
const fullRestore = process.env.RESTORE_SCOPE === 'full';
let tempDirectory;
let containerId;
let networkName;
let authContainerId;

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
    const sqlError = detail.split('\n').find((line) => /(?:ERROR|FATAL):|psql:|invalid command/i.test(line))
      || detail.split('\n').find((line) => line.trim());
    const safeError = sqlError?.replace(/'[^']*'/g, '[value]').slice(0, 250);
    throw new Error(`${stage} failed (${type}; ${error.message}${safeError ? `: ${safeError}` : ''}); production was not touched.`);
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
  const manifest = JSON.parse(await readFile(join(extracted, 'manifest.json'), 'utf8'));
  console.log('Backup decrypted and archive verified');

  const containerName = `mmbookhouse-restore-drill-${randomBytes(4).toString('hex')}`;
  const password = randomBytes(24).toString('hex');
  const managedSchemaPath = join(extracted, 'managed-schema.sql');
  const hasManagedSchema = await access(managedSchemaPath).then(() => true, () => false);
  if (fullRestore) {
    networkName = `${containerName}-net`;
    await command('docker', ['network', 'create', '--internal', networkName]);
  }
  containerId = await command('docker', [
    'run', '--detach', '--rm', '--network', networkName || 'none', '--name', containerName,
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
  // The entrypoint briefly starts a temporary server while applying its init
  // scripts. Give it time to hand over to the final server before restore.
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await command('docker', ['exec', containerId, 'pg_isready', '-U', 'postgres']);
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
  if (fullRestore && !hasManagedSchema) {
    await command('docker', [
      'exec', containerId, 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1',
      '-U', 'supabase_admin', '-d', 'postgres',
      '-c', `ALTER ROLE supabase_auth_admin LOGIN PASSWORD '${password}'`,
    ]);
    try {
      await command('docker', [
        'run', '--rm', '--network', networkName,
        '--env', 'GOTRUE_DB_DRIVER=postgres',
        '--env', 'GOTRUE_SITE_URL=http://localhost',
        '--env', 'API_EXTERNAL_URL=http://localhost',
        '--env', `GOTRUE_JWT_SECRET=${randomBytes(32).toString('hex')}`,
        '--env', `GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin:${password}@${containerName}:5432/postgres`,
        'supabase/gotrue:v2.196.0', 'auth', 'migrate',
      ]);
    } catch (error) {
      const diagnostic = String(error.detail || '').split('\n')
        .find((line) => /(?:error|fatal|failed|invalid|unknown)/i.test(line))
        ?.replaceAll(password, '[isolated password]')
        .replace(/postgres(?:ql)?:\/\/\S+/gi, '[isolated database URL]')
        .slice(0, 300);
      throw new Error(`Isolated Supabase Auth migration failed (${error.message}${diagnostic ? `: ${diagnostic}` : ''}); production was not touched.`);
    }
    console.log('Official Supabase Auth migrations applied in isolated database');
  }
  await psql(join(extracted, 'roles.sql'), 'Roles', 'supabase_admin');
  let deferredManagedTriggersPath;
  if (fullRestore && hasManagedSchema) {
    await command('docker', [
      'exec', containerId, 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1',
      '-U', 'supabase_admin', '-d', 'postgres',
      '-c', 'DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS storage CASCADE;',
    ]);
    const deferredTriggers = [];
    const managedSchema = (await readFile(managedSchemaPath, 'utf8')).replace(
      /CREATE TRIGGER\b[\s\S]*?;\r?\n/g,
      (statement) => { deferredTriggers.push(statement); return ''; },
    );
    const managedTablesPath = join(tempDirectory, 'managed-tables.sql');
    await writeFile(managedTablesPath, managedSchema, { flag: 'wx' });
    deferredManagedTriggersPath = join(tempDirectory, 'managed-triggers.sql');
    await writeFile(deferredManagedTriggersPath, deferredTriggers.join('\n'), { flag: 'wx' });
    await psql(managedTablesPath, 'Managed Auth and Storage schema', 'supabase_admin');
  }
  await psql(join(extracted, 'schema.sql'), 'Schema', 'supabase_admin');
  if (deferredManagedTriggersPath) {
    await psql(deferredManagedTriggersPath, 'Managed Auth and Storage triggers', 'supabase_admin');
  }
  const inventoryBefore = await command('docker', [
    'exec', containerId, 'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres',
    '-c', 'select count(*) from public.inventory',
  ]);
  const inventoryTrigger = await command('docker', [
    'exec', containerId, 'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres',
    '-c', "select tgenabled from pg_trigger where tgname = 'trigger_auto_init_variant_inventory'",
  ]);
  console.log(`Inventory before data: ${inventoryBefore}; auto-init trigger mode: ${inventoryTrigger || 'absent'}`);
  const dataPath = join(tempDirectory, fullRestore ? 'full-data.sql' : 'public-data.sql');
  if (fullRestore) {
    const output = createWriteStream(dataPath, { flags: 'wx' });
    output.write('SET session_replication_role = replica;\n');
    await pipeline(createReadStream(join(extracted, 'data.sql')), output);
  } else {
    await command('python3', [
      'scripts/filter_public_dump_for_drill.py', join(extracted, 'data.sql'), dataPath,
    ]);
  }
  await psql(dataPath, fullRestore ? 'Full database data' : 'Public application data', 'supabase_admin');
  const tableCount = Number(await command('docker', [
    'exec', containerId, 'psql', '-X', '-A', '-t', '-U', 'postgres', '-d', 'postgres',
    '-c', "select count(*) from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'",
  ]));
  if (!Number.isInteger(tableCount) || tableCount < 1) throw new Error('Restore produced no public tables.');
  const bookCount = Number(await command('docker', [
    'exec', containerId, 'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres',
    '-c', 'select count(*) from public.books',
  ]));
  if (!Number.isInteger(bookCount) || bookCount < 1) throw new Error('Restore produced no books.');
  if (fullRestore) {
    const authUsers = await command('docker', [
      'exec', containerId, 'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres',
      '-c', 'select count(*) from auth.users',
    ]);
    const storageObjects = await command('docker', [
      'exec', containerId, 'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres',
      '-c', 'select count(*) from storage.objects',
    ]);
    const archivedStorageObjects = manifest.storageObjects || [];
    for (const object of archivedStorageObjects) {
      const bytes = await readFile(join(extracted, object.archiveName));
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (hash !== object.sha256 || bytes.length !== object.size) {
        throw new Error(`Storage object recovery verification failed for ${object.bucketId}/${object.name}.`);
      }
    }
    const expectedStorageBucket = process.env.RESTORE_TEST_STORAGE_BUCKET;
    const expectedStorageName = process.env.RESTORE_TEST_STORAGE_OBJECT;
    const expectedStorageHash = process.env.RESTORE_TEST_STORAGE_SHA256;
    if (expectedStorageBucket || expectedStorageName || expectedStorageHash) {
      if (!expectedStorageBucket || !expectedStorageName || !expectedStorageHash) {
        throw new Error('Incomplete expected Storage fixture configuration.');
      }
      const recovered = archivedStorageObjects.find((object) =>
        object.bucketId === expectedStorageBucket && object.name === expectedStorageName
      );
      if (!recovered || recovered.sha256 !== expectedStorageHash) {
        throw new Error('Expected demo Storage object was not recovered from the encrypted backup.');
      }
      const bucketSql = expectedStorageBucket.replaceAll("'", "''");
      const nameSql = expectedStorageName.replaceAll("'", "''");
      const metadataRows = Number(await command('docker', [
        'exec', containerId, 'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres',
        '-c', `select count(*) from storage.objects where bucket_id='${bucketSql}' and name='${nameSql}'`,
      ]));
      if (metadataRows !== 1) throw new Error('Expected demo Storage metadata row was not restored.');
      console.log(`STORAGE FILE RECOVERY PASSED: ${recovered.bucketId}/${recovered.name} (${recovered.size} bytes).`);
      console.log(`::notice title=Storage file recovery passed::Recovered ${recovered.size} bytes with matching SHA-256 and metadata.`);
    }
    if (process.env.RESTORE_TEST_EMAIL && process.env.RESTORE_TEST_PASSWORD) {
      await command('docker', [
        'exec', containerId, 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1',
        '-U', 'supabase_admin', '-d', 'postgres',
        '-c', `ALTER ROLE supabase_auth_admin LOGIN PASSWORD '${password}'`,
      ]);
      const jwtSecret = randomBytes(32).toString('hex');
      const authContainerName = `${containerName}-auth`;
      authContainerId = await command('docker', [
        'run', '--detach', '--rm', '--network', networkName, '--name', authContainerName,
        '--publish', '127.0.0.1::9999',
        '--env', 'GOTRUE_DB_DRIVER=postgres',
        '--env', 'GOTRUE_SITE_URL=http://localhost',
        '--env', 'API_EXTERNAL_URL=http://localhost',
        '--env', `GOTRUE_JWT_SECRET=${jwtSecret}`,
        '--env', `GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin:${password}@${containerName}:5432/postgres`,
        'supabase/gotrue:v2.196.0', 'auth',
      ]);
      const portOutput = await command('docker', ['port', authContainerId, '9999/tcp']);
      const authPort = /:(\d+)\s*$/.exec(portOutput)?.[1];
      if (!authPort) throw new Error('Could not resolve isolated Auth service port.');
      let signedIn = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        try {
          const response = await fetch(`http://127.0.0.1:${authPort}/token?grant_type=password`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              email: process.env.RESTORE_TEST_EMAIL,
              password: process.env.RESTORE_TEST_PASSWORD,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error_description || result.msg || `HTTP ${response.status}`);
          if (!result.access_token || result.user?.email !== process.env.RESTORE_TEST_EMAIL) {
            throw new Error('Auth response did not contain the restored demo user.');
          }
          signedIn = true;
          break;
        } catch (error) {
          if (attempt === 29) throw new Error(`RESTORED AUTH SIGN-IN FAILED: ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      if (!signedIn) throw new Error('RESTORED AUTH SIGN-IN FAILED.');
      console.log('RESTORED AUTH SIGN-IN PASSED for the demo user.');
      console.log('::notice title=Restored Auth sign-in passed::The temporary user signed in successfully against the isolated restored database.');
    }
    console.log(`FULL DATABASE RESTORE PASSED: ${tableCount} public tables, ${bookCount} books, ${authUsers} Auth users, ${storageObjects} Storage metadata rows.`);
    console.log(`${archivedStorageObjects.length} Storage object files recovered and checksum-verified.`);
  } else {
    console.log(`PUBLIC APP-DATA RESTORE PASSED: ${tableCount} public tables, ${bookCount} books in isolated PostgreSQL.`);
    console.log('NOT A FULL SUPABASE RESTORE: managed Auth/Storage data requires a matching target schema.');
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  let safeMessage = message;
  for (const secret of [
    process.env.RESTORE_TEST_PASSWORD,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    process.env.BACKUP_ENCRYPTION_KEY,
  ]) {
    if (secret) safeMessage = safeMessage.replaceAll(secret, '[redacted]');
  }
  const annotationMessage = safeMessage.slice(0, 1000)
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A');
  console.error(`::error title=Backup restore drill failed::${annotationMessage}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `## Backup restore drill failed\n\n\`${safeMessage.slice(0, 1000)}\`\n`);
  }
  process.exitCode = 1;
} finally {
  if (authContainerId) await command('docker', ['stop', authContainerId]).catch(() => {});
  if (containerId) await command('docker', ['stop', containerId]).catch(() => {});
  if (networkName) await command('docker', ['network', 'rm', networkName]).catch(() => {});
  if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
}
