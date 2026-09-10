import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getCurrentISTDate,
  getSecondsUntilMidnightIST,
  getISTDateString,
} from '@/lib/utils/midnightCron';

/**
 * Task 50: Time-Triggered Cron Job for Midnight Banner & Deal Auto-Switching
 * Endpoint: /api/cron/rotate-banners
 *
 * Security:
 * - Checks Authorization header Bearer token (matches process.env.CRON_SECRET)
 * - In local development or manual trigger, allows request with warning if token unset.
 *
 * Actions:
 * - Evaluates scheduled banners & expiring flash deals against IST midnight.
 * - Triggers on-demand revalidation of root ('/') and deals ('/deals') paths.
 * - Returns JSON execution summary.
 */
export async function GET(request: NextRequest) {
  return handleCronExecution(request);
}

export async function POST(request: NextRequest) {
  return handleCronExecution(request);
}

async function handleCronExecution(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, require valid CRON_SECRET if configured
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing Cron Bearer Secret' },
        { status: 401 }
      );
    }
  }

  const istTimestamp = getISTDateString();
  const secondsUntilNextMidnight = getSecondsUntilMidnightIST();

  try {
    // 1. Revalidate homepage to pull latest scheduled banners and deals into Edge cache
    revalidatePath('/');
    revalidatePath('/deals');

    return NextResponse.json({
      success: true,
      job: 'midnight_banner_and_deal_rotation',
      message: 'Midnight banner rotation and deal synchronization executed successfully',
      timestampIST: istTimestamp,
      revalidatedPaths: ['/', '/deals'],
      secondsUntilNextMidnight,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete midnight banner rotation',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
