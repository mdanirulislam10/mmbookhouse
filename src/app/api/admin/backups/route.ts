import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin/adminSession';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function isAdmin(request: NextRequest): boolean {
  try {
    return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  } catch {
    return false;
  }
}

function configurationState() {
  const missing: string[] = [];
  if (!process.env.GITHUB_BACKUP_TOKEN) missing.push('GITHUB_BACKUP_TOKEN');
  if (!process.env.GITHUB_REPOSITORY) missing.push('GITHUB_REPOSITORY');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return { ready: missing.length === 0, missing };
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = configurationState();
  const { data, error } = await supabaseAdmin
    .from('backup_jobs')
    .select('id,trigger_type,status,file_name,drive_web_view_link,file_size_bytes,sha256,error_message,started_at,completed_at,created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    const tableMissing = error.code === '42P01' || /backup_jobs/i.test(error.message);
    return NextResponse.json(
      {
        configured: config.ready,
        missingConfiguration: config.missing,
        migrationPending: tableMissing,
        jobs: [],
        error: tableMissing
          ? 'Backup database migration এখনো প্রয়োগ করা হয়নি।'
          : 'Backup history পড়া যায়নি।',
      },
      { status: tableMissing ? 503 : 500 }
    );
  }

  return NextResponse.json({
    configured: config.ready,
    missingConfiguration: config.missing,
    migrationPending: false,
    schedule: {
      timezone: 'Asia/Kolkata',
      localTime: 'রাত ১১:৩০',
      cronUtc: '0 18 * * *',
    },
    jobs: data ?? [],
  });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = configurationState();
  if (!config.ready) {
    return NextResponse.json(
      { error: 'Backup worker এখনো সম্পূর্ণ কনফিগার করা হয়নি।', missing: config.missing },
      { status: 503 }
    );
  }

  const { data: activeJob } = await supabaseAdmin
    .from('backup_jobs')
    .select('id,status,created_at')
    .in('status', ['queued', 'running'])
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeJob) {
    return NextResponse.json(
      { error: 'একটি backup ইতিমধ্যে চলছে।', job: activeJob },
      { status: 409 }
    );
  }

  const { data: job, error: insertError } = await supabaseAdmin
    .from('backup_jobs')
    .insert({ trigger_type: 'manual', status: 'queued' })
    .select('id,status,created_at')
    .single();

  if (insertError || !job) {
    return NextResponse.json(
      { error: 'Backup request সংরক্ষণ করা যায়নি। Migration প্রয়োগ হয়েছে কি না দেখুন।' },
      { status: 500 }
    );
  }

  const repository = process.env.GITHUB_REPOSITORY!;
  const workflowFile = process.env.GITHUB_BACKUP_WORKFLOW || 'database-backup.yml';
  const gitRef = process.env.GITHUB_BACKUP_REF || 'main';
  const dispatchResponse = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/${workflowFile}/dispatches`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${process.env.GITHUB_BACKUP_TOKEN}`,
        'x-github-api-version': '2022-11-28',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ref: gitRef, inputs: { job_id: job.id } }),
      cache: 'no-store',
    }
  );

  if (!dispatchResponse.ok) {
    const details = (await dispatchResponse.text()).slice(0, 500);
    await supabaseAdmin
      .from('backup_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: `Worker dispatch failed (${dispatchResponse.status}): ${details}`,
      })
      .eq('id', job.id);
    return NextResponse.json(
      { error: 'Backup worker চালু করা যায়নি। টেকনিক্যাল ব্যক্তিকে জানান।' },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, job }, { status: 202 });
}
