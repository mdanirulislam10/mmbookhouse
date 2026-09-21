# Supabase disaster-recovery runbook

The database schema can record recovery objectives and restore-drill evidence, but it
cannot enable a hosted Supabase backup/PITR entitlement. An owner must verify these in
the Supabase project dashboard.

1. Enable Point-in-Time Recovery for the production project and confirm the displayed
   retention window meets the value in `disaster_recovery_configs`.
2. Keep migration/seeding credentials in a secret manager or ignored local environment;
   never in repository files.
3. At least quarterly, restore to an isolated project, run migration checks and catalog
   invariants, then record the backup reference, start/end time, checksum result, and
   verifier in `disaster_recovery_verifications`.
4. Test the documented RPO/RTO against the recorded timestamps. Mark the config
   `degraded` or `failed` when either objective is missed.
5. Never test restore by overwriting the production project.

## Free-plan encrypted logical backup automation

The application provides a real off-site logical backup path for the Supabase Free
Plan. The owner uses **Admin > Store Settings > Automatic Database Backup**; the
technical implementation remains hidden from the owner.

### What is backed up

- PostgreSQL roles exported by the Supabase CLI
- Application schema exported by the Supabase CLI
- Managed Auth and Storage schema exported with PostgreSQL `pg_dump` (format v2)
- Application table data exported by the Supabase CLI
- A manifest describing creation time and restore order

The ZIP is encrypted with AES-256-GCM before it leaves the runner. Only the encrypted
`.zip.enc` file is uploaded to Google Drive. Supabase Storage object files are not part
of a database dump and need a separate object-backup process.

### One-time deployment checklist

1. Apply `20260919000027_backup_automation.sql` to the production database.
2. In Vercel, set `ADMIN_PANEL_PASSWORD` and a random `ADMIN_SESSION_SECRET` of at
   least 32 characters.
3. Create a fine-grained GitHub token for the repository with **Actions: Read and
   write** permission. In Vercel set `GITHUB_BACKUP_TOKEN`, `GITHUB_REPOSITORY`,
   `GITHUB_BACKUP_REF=main`, and `GITHUB_BACKUP_WORKFLOW=database-backup.yml`.
4. In Google Cloud, enable the Google Drive API and create OAuth 2 credentials. Run
   `npm run backup:authorize-drive` locally, paste the desktop client's ID and secret
   into the localhost-only form, and approve the limited `drive.file` permission for
   the Drive account that owns the backup folder. The helper copies the refresh token
   to the Windows clipboard without writing OAuth credentials or tokens to disk.
5. Add these GitHub Actions repository secrets:
   `SUPABASE_DB_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`,
   `GOOGLE_DRIVE_REFRESH_TOKEN`, and `BACKUP_ENCRYPTION_KEY`. Optionally set
   `GOOGLE_DRIVE_FOLDER_ID`; otherwise the worker creates/finds `mmbookhousebackup`.
6. Generate the encryption key once with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and keep
   a second copy in a password manager. Losing this key makes every encrypted backup
   permanently unreadable.
7. Deploy Vercel, then sign in at `/admin`, open Store Settings, and run **Backup Now**.
   Confirm the job becomes Successful and the encrypted file appears in Google Drive.
8. The GitHub schedule runs daily at `18:00 UTC`, which is `23:30 Asia/Kolkata`.

### Ownership and developer handover

This automation must remain fully owned by the application owner, not by a temporary
developer:

- `.github/workflows/database-backup.yml` lives in the owner's MM Enterprise
  repository and therefore runs in that repository's GitHub Actions account.
- Every GitHub Actions secret is saved in the owner's repository settings.
- `GITHUB_BACKUP_TOKEN` must be a fine-grained token created from an owner-controlled
  GitHub account and restricted to only the owner's MM Enterprise repository.
- `GITHUB_REPOSITORY` in Vercel must be
  `mdanirulislam10/mmbookhouse`, the confirmed owner repository, never a developer
  fork.
- The Vercel project/team, Google Drive folder, Google OAuth app/refresh token, Supabase
  project, and password-manager copy of `BACKUP_ENCRYPTION_KEY` must all be controlled
  by the application owner.
- The scheduled nightly workflow does not need the Vercel dispatch token. If that token
  expires, the nightly backup continues; only the Admin Panel's **Backup Now** action
  stops until the owner rotates the token.
- During handover, remove the departing developer from GitHub, Vercel, Supabase, and
  Google Cloud/Drive access, then rotate any credentials the developer could read.

### Decrypt and restore drill

1. Download a `.zip.enc` backup from Drive.
2. Set `BACKUP_ENCRYPTION_KEY` in a private local environment.
3. Run `npm run backup:decrypt -- path/to/backup.zip.enc`.
4. Extract the resulting ZIP. For format-v2 backups the restore order is
   `roles.sql`, `managed-schema.sql`, `schema.sql`, then `data.sql`. Restore to
   an empty, disposable PostgreSQL target. The automated drill replaces the
   target's preinstalled `auth` and `storage` schemas with those from the backup
   and applies managed triggers after the application schema. Never drop these
   schemas on a running Supabase project. Execute
   `SET session_replication_role = replica` in the **same psql session** that
   loads `data.sql`, so import triggers do not create duplicate rows.
5. Validate critical row counts and application login/order flows. Never point this
   drill at production.

The manual GitHub Actions workflow `verify-backup-restore.yml` performs a narrower,
network-isolated **public application-data** restore check. It downloads the newest
encrypted Drive backup, checks its SHA-256, decrypts it, and restores roles, schema,
and public-table data to a temporary Supabase PostgreSQL container. Its success does
**not** verify Auth/Storage data, Storage objects, login, or a full project recovery.
The September 21, 2026 drill restored 58 public tables and 1,003 books:
https://github.com/mdanirulislam10/mmbookhouse/actions/runs/35599635467 .
Older format-v1 archives lack the managed schema and can fail a full restore
because the target Auth/Storage versions differ. The format-v2 encrypted backup
`mmbookhousebackup_2026-09-21_23-01-46_IST.zip.enc` passed the separate manual
`verify-backup-full-restore.yml` drill: 58 public tables and 1,003 books were
restored along with Auth/Storage schema and data SQL in isolated PostgreSQL.
The source contained zero Auth users and zero Storage metadata rows, so this
does not prove a populated Auth or Storage restore, actual sign-in, or Storage
object-file recovery. See the verified run:
https://github.com/mdanirulislam10/mmbookhouse/actions/runs/35635184804 .

### Failure handling

- The admin panel polls queued/running jobs and displays the real worker result.
- A failed job remains visible with a diagnostic message; earlier successful files
  are not deleted.
- The workflow uses a concurrency lock, so two backup runners cannot overlap.
- GitHub and Vercel secrets must never be copied into repository files or screenshots.
