# mmbookhouse — backup and disaster-recovery runbook

The site keeps its own encrypted off-site backup on the Supabase Free plan: a GitHub Actions job
(`.github/workflows/database-backup.yml`) runs every night at **18:00 UTC = 23:30 India time**, encrypts the archive and
uploads it to Google Drive. The owner can also start it from **Admin → Backups → Backup now**.

## What one backup file contains (format v5)

| File in the archive | What it holds |
| :-- | :-- |
| `roles.sql`, `schema.sql` | Postgres roles and the whole application schema: tables, RLS policies, functions, triggers |
| `managed-schema.sql` | Structure of Supabase's `auth` and `storage` schemas |
| `data.sql` | **All data**: every application table, `auth.users` (with password hashes), `auth.identities`, `storage.objects` / `storage.buckets` metadata |
| `auth-migrations.sql` | Supabase Auth migration history |
| `storage-objects/*.bin` | The **actual bytes of every file** in every Storage bucket (book covers, previews), each with a SHA-256 in the manifest |
| `source-code.tar.gz` | `git archive` of the repository at the deployed commit (`sourceCommit` in the manifest) |
| `external-config.json` | Dashboard settings that are not in the database: Supabase **Auth** config (providers, Site URL / redirect URLs, SMTP, e-mail templates), **Storage** config, **API** config, and the **Vercel environment variables** |
| `manifest.json` | Time, restore order, file checksums, external-config status, and the **row count of every table** taken just before and just after the dump |

The archive is encrypted with AES-256-GCM on the runner before it leaves GitHub. Only the `.zip.enc` file reaches Drive.

### Not covered — keep these yourself

- **GitHub Actions secrets** cannot be read back from any API. Keep a copy of every secret in a password manager, above all
  `BACKUP_ENCRYPTION_KEY` (**losing it makes every backup unreadable**), `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  the Google Drive OAuth values and the tokens below.
- Vercel variables of type *Sensitive* cannot be read back; their **names** are still listed under `vercel.unreadable`.
- Changes made after the last nightly run (up to 24 hours). Press **Backup now** before risky work.
- Domain / DNS settings and the Google Cloud OAuth app.

## Tokens that make the settings export work

Without these the backup still succeeds, but the run shows a yellow warning (*"… settings not fully in backup"*) and the
manifest says `skipped`. Add them as **GitHub → Settings → Secrets and variables → Actions → Repository secrets**:

| Secret | Where to create it |
| :-- | :-- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens → Generate new token (read access to the project is enough) |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_PROJECT_ID` | Vercel project → Settings → General → Project ID |
| `VERCEL_TEAM_ID` | only if the project belongs to a team (Team Settings → General) |

## Retention

After each successful upload the job moves old archives to the **Drive trash** (recoverable for 30 days):

- everything from the last **30 days** is kept,
- the newest archive of each of the last **24 months** is kept,
- the **7 newest** are always kept, and the file just uploaded is never touched,
- files whose names it does not recognise are never touched.

Override with the GitHub repository *variables* (Settings → Secrets and variables → Actions → Variables) `BACKUP_RETENTION_DAYS` (min 7), `BACKUP_RETENTION_MONTHS` (min 1) and
`BACKUP_KEEP_NEWEST` (min 3). A failure while pruning only logs a warning; it never fails the backup.

## Automatic proof that the backup can be restored

Whenever the backup scripts change (and on demand, **Actions → Verify backup Auth sign-in and Storage file restore**) the
`verify-backup-auth-storage-restore.yml` workflow:

1. creates a temporary Auth user and Storage file in production,
2. takes a real backup and downloads it back from Drive, verifying the checksum and decrypting it,
3. restores it into an isolated Postgres container with no network exposure,
4. signs in as the restored user through a real Supabase Auth (GoTrue) container,
5. checks the recovered Storage file byte-for-byte,
6. checks the archived source code and settings file against their checksums,
7. **compares the row count of every table** (all `public` tables, `auth.users`, `auth.identities`, `storage.objects`,
   `storage.buckets`) with production; a table may differ only by rows added or removed while the dump was running,
8. removes the temporary data.

Green annotations *Restored Auth sign-in passed*, *Storage file recovery passed* and *Row counts match production* mean the
whole chain works. Run it after any change to the database layout.

## Restoring after a disaster

Never restore over the live project; restore into a **new** Supabase project, then repoint the site.

1. Download the newest `mmbookhousebackup_*.zip.enc` from the Drive folder `mmbookhousebackup`.
2. Locally set `BACKUP_ENCRYPTION_KEY`, then `npm run backup:decrypt -- path/to/file.zip.enc` and unzip the result.
3. In a fresh Supabase project, restore in the order listed in `manifest.json` → `restoreOrder`
   (`roles.sql`, `managed-schema.sql`, `schema.sql`, `data.sql`, `auth-migrations.sql`). Run `SET session_replication_role = replica;`
   in the **same psql session** that loads `data.sql`. The automated drill (`scripts/verify_backup_restore.mjs`) shows the exact
   commands. Never drop `auth` / `storage` on a running Supabase project.
4. Upload the files in `storage-objects/` back into their buckets using the names in `manifest.json` → `storageObjects`
   (bucket, name, public flag).
5. Open `external-config.json` and re-apply the Auth settings (providers, Site URL, redirect URLs, SMTP, templates), and
   re-create the Vercel environment variables. Update `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` to the new project's values, then redeploy. Update the GitHub secrets `SUPABASE_DB_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` too, so the nightly backup follows the new project.
6. If GitHub or Vercel are lost as well, `source-code.tar.gz` is the whole application at the backed-up commit.
7. Check row counts against `manifest.json` → `rowCounts`, sign in as an admin and a customer, and place a test order.

## One-time setup checklist

1. Apply `supabase/all_migrations.sql` (`npm run db:migrate`) to the production database.
2. In Vercel set `GITHUB_REPOSITORY=mdanirulislam10/mmbookhouse`, `GITHUB_BACKUP_REF=main`,
   `GITHUB_BACKUP_WORKFLOW=database-backup.yml`, and `GITHUB_BACKUP_TOKEN` (a fine-grained GitHub token limited to this
   repository with **Actions: Read and write**). This powers the **Backup now** button.
3. In Google Cloud enable the Drive API, create desktop OAuth credentials, run `npm run backup:authorize-drive` locally and
   approve the limited `drive.file` scope for the Drive account that owns the backup folder.
4. Add the GitHub Actions secrets `SUPABASE_DB_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`, `BACKUP_ENCRYPTION_KEY` (and
   optionally `GOOGLE_DRIVE_FOLDER_ID`), plus the four optional tokens above.
5. Generate the encryption key once with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and store a
   second copy in a password manager.
6. Run **Backup now** and the verify workflow once and confirm both are green.

## Ownership

Everything must stay under the owner's accounts: the GitHub repository, Vercel project, Supabase project, Google Drive
folder and OAuth app, and the password-manager copy of the secrets. When a developer leaves, remove their access to all of
these and rotate every token they could read. The nightly schedule does not depend on `GITHUB_BACKUP_TOKEN`; if that token
expires only the **Backup now** button stops working.

## Failure handling

- The admin panel lists every job with the worker's real result; failed jobs stay visible with their error text.
- A concurrency lock prevents two backup runs from overlapping.
- Secrets must never be copied into repository files, screenshots or chat.
