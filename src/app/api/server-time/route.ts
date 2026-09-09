import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Task 30: Client-Server Clock Sync & Time-Drift Prevention API
 * Provides high-precision server time in UTC and IST (Indian Standard Time)
 * to ensure flash deal countdown timers never drift or get manipulated by user local device clock.
 */
export async function GET() {
  const now = new Date();
  const serverTimestamp = now.getTime();
  const serverTimeIso = now.toISOString();

  // Formatted IST string (Asia/Kolkata timezone: UTC+5:30)
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const istFormatted = istFormatter.format(now);

  return NextResponse.json(
    {
      serverTimestamp,
      serverTimeIso,
      istFormatted,
      timezone: 'Asia/Kolkata',
      offsetMinutes: 330, // +05:30
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
