import { NextResponse } from 'next/server';
import { checkSystemHealth } from '@/lib/services/systemHealthService';

/**
 * Module 20: Real-Time System Health Check Endpoint (Item 39)
 * Strictly exports only the HTTP GET handler as required by Next.js 15 App Router.
 */
export async function GET() {
  try {
    const health = await checkSystemHealth();
    const httpStatus = health.status === 'down' ? 503 : 200;

    return NextResponse.json(health, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Status': health.status,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
