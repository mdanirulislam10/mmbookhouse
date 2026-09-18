-- Backup automation registry. Backup contents live off-site in Google Drive;
-- this table only stores operational status and file metadata.

CREATE TABLE IF NOT EXISTS public.backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled')),
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name TEXT,
    drive_file_id TEXT,
    drive_web_view_link TEXT,
    file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    sha256 TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_created_at
    ON public.backup_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_active
    ON public.backup_jobs(status)
    WHERE status IN ('queued', 'running');

COMMENT ON TABLE public.backup_jobs IS
    'Operational history for encrypted off-site database backups. No backup secrets or contents are stored here.';

ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

-- Backup records are intentionally service-role only. The admin UI reads them
-- through authenticated server routes and never receives service credentials.
REVOKE ALL ON public.backup_jobs FROM anon, authenticated;
GRANT ALL ON public.backup_jobs TO service_role;
