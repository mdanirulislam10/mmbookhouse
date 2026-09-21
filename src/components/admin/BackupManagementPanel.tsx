'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cloud,
  DatabaseBackup,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

type BackupJob = {
  id: string;
  trigger_type: 'manual' | 'scheduled';
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  file_name: string | null;
  drive_web_view_link: string | null;
  file_size_bytes: number | null;
  sha256: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type ApiResult = {
  configured: boolean;
  missingConfiguration?: string[];
  migrationPending?: boolean;
  jobs: BackupJob[];
  error?: string;
};

const dateFormatter = new Intl.DateTimeFormat('bn-BD', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value?: string | null) {
  return value ? dateFormatter.format(new Date(value)) : '—';
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

const statusLabels = {
  queued: 'অপেক্ষমাণ',
  running: 'ব্যাকআপ চলছে',
  succeeded: 'সফল',
  failed: 'ব্যর্থ',
};

export function BackupManagementPanel() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch('/api/admin/backups', { cache: 'no-store' });
      const body = (await response.json()) as ApiResult;
      setResult(body);
      if (!response.ok && !body.error) throw new Error('Backup তথ্য লোড করা যায়নি।');
    } catch (caught) {
      setMessage({ type: 'error', text: caught instanceof Error ? caught.message : 'Backup তথ্য লোড করা যায়নি।' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasActiveJob = useMemo(
    () => result?.jobs.some((job) =>
      (job.status === 'queued' || job.status === 'running') &&
      new Date(job.created_at).getTime() > Date.now() - 60 * 60 * 1000
    ) ?? false,
    [result]
  );

  useEffect(() => {
    if (!hasActiveJob) return;
    const timer = window.setInterval(() => void load(true), 10_000);
    return () => window.clearInterval(timer);
  }, [hasActiveJob, load]);

  async function triggerBackup() {
    setTriggering(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/backups', { method: 'POST' });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Backup শুরু করা যায়নি।');
      setMessage({ type: 'success', text: 'Backup request গ্রহণ করা হয়েছে। কাজটি স্বয়ংক্রিয়ভাবে চলছে।' });
      await load(true);
    } catch (caught) {
      setMessage({ type: 'error', text: caught instanceof Error ? caught.message : 'Backup শুরু করা যায়নি।' });
    } finally {
      setTriggering(false);
    }
  }

  const latestSuccess = result?.jobs.find((job) => job.status === 'succeeded');
  const latestJob = result?.jobs[0];
  const ready = Boolean(result?.configured && !result?.migrationPending);

  return (
    <section className="lg:col-span-2 space-y-4 rounded-xl border border-slate-700 bg-slate-800 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <DatabaseBackup className="h-5 w-5 text-amber-400" />
            স্বয়ংক্রিয় ডাটাবেস ব্যাকআপ
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            প্রতিদিন রাত ১১:৩০-এ encrypted backup Google Drive-এর “mmbookhousebackup” ফোল্ডারে রাখা হবে।
          </p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-bold ${ready ? 'border-emerald-600 bg-emerald-950/50 text-emerald-300' : 'border-amber-600 bg-amber-950/50 text-amber-300'}`}>
          {ready ? '● অটোমেটিক ব্যাকআপ চালু' : '● সেটআপ অসম্পূর্ণ'}
        </div>
      </div>

      {result?.error && (
        <div className="flex gap-2 rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{result.error}</span>
        </div>
      )}

      {message && (
        <div className={`rounded-lg border p-3 text-xs ${message.type === 'success' ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200' : 'border-rose-700 bg-rose-950/40 text-rose-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400"><Clock3 className="h-4 w-4" /> সময়সূচি</div>
          <div className="mt-2 font-bold text-white">প্রতিদিন রাত ১১:৩০</div>
          <div className="text-[11px] text-slate-500">ভারতীয় সময় (IST)</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4" /> সর্বশেষ সফল</div>
          <div className="mt-2 text-sm font-bold text-white">{formatDate(latestSuccess?.completed_at)}</div>
          <div className="text-[11px] text-slate-500">{formatBytes(latestSuccess?.file_size_bytes)}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400"><Cloud className="h-4 w-4" /> গন্তব্য</div>
          <div className="mt-2 font-bold text-white">Google Drive</div>
          <div className="text-[11px] text-slate-500">mmbookhousebackup</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={triggerBackup}
          disabled={!ready || triggering || hasActiveJob}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {triggering || hasActiveJob ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
          {hasActiveJob ? 'ব্যাকআপ চলছে…' : 'এখনই ব্যাকআপ নিন'}
        </button>
        <button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          রিফ্রেশ
        </button>
        {latestSuccess?.drive_web_view_link && (
          <a href={latestSuccess.drive_web_view_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-emerald-700 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-950/40">
            <ExternalLink className="h-4 w-4" /> Google Drive-এ দেখুন
          </a>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-700">
        <div className="border-b border-slate-700 bg-slate-900/70 px-4 py-3 text-xs font-bold text-white">সাম্প্রতিক ব্যাকআপ</div>
        {loading && !result ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে…</div>
        ) : !result?.jobs.length ? (
          <div className="p-8 text-center text-sm text-slate-500">এখনো কোনো backup record নেই।</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {result.jobs.slice(0, 10).map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
                <div className="flex min-w-0 items-center gap-3">
                  {job.status === 'succeeded' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : job.status === 'failed' ? <XCircle className="h-4 w-4 shrink-0 text-rose-400" /> : <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" />}
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-200">{job.file_name || (job.trigger_type === 'manual' ? 'ম্যানুয়াল ব্যাকআপ' : 'নির্ধারিত ব্যাকআপ')}</div>
                    <div className="text-[11px] text-slate-500">{formatDate(job.created_at)} • {job.trigger_type === 'manual' ? 'ম্যানুয়াল' : 'অটোমেটিক'}</div>
                    {job.error_message && <div className="mt-1 max-w-2xl truncate text-[11px] text-rose-300" title={job.error_message}>{job.error_message}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{formatBytes(job.file_size_bytes)}</span>
                  <span className={`rounded-full px-2 py-1 font-bold ${job.status === 'succeeded' ? 'bg-emerald-950 text-emerald-300' : job.status === 'failed' ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'}`}>{statusLabels[job.status]}</span>
                  {job.drive_web_view_link && <a href={job.drive_web_view_link} target="_blank" rel="noreferrer" aria-label="Google Drive-এ খুলুন" className="text-sky-400 hover:text-sky-300"><ExternalLink className="h-4 w-4" /></a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {latestJob?.status === 'failed' && (
        <p className="text-[11px] text-rose-300">সর্বশেষ backup ব্যর্থ হয়েছে। টেকনিক্যাল ব্যক্তিকে জানানো প্রয়োজন। আগের সফল backup নিরাপদ থাকবে।</p>
      )}
    </section>
  );
}
