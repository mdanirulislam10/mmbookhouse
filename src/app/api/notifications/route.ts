import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationPayloadSchema } from '@/lib/validations/notifications';
import { defaultQueueService } from '@/lib/services/notificationQueueService';
import { NotificationStatus, NotificationPayload } from '@/types/notifications';

/**
 * Module 18: Notification Dispatch & Query REST API
 * 
 * Complies with:
 * - Item 31: Decoupled Non-blocking Notification Dispatch
 * - Item 32: Notification Logs Multi-filter Querying
 * - Item 47: Admin Audit Log Retrieval
 */

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validation = sendNotificationPayloadSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'অবৈধ নোটিফিকেশন তথ্য',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const idempotencyKey = request.headers.get('x-idempotency-key') || undefined;
    const enqueueResult = defaultQueueService.enqueueNotification(
      validation.data as NotificationPayload,
      idempotencyKey
    );

    return NextResponse.json(
      {
        success: true,
        job_id: enqueueResult.job_id,
        status: enqueueResult.status,
      },
      { status: 202 } // 202 Accepted (asynchronously processed)
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id') || undefined;
    const user_id = searchParams.get('user_id') || undefined;
    const channel = searchParams.get('channel') || undefined;
    const status = (searchParams.get('status') as NotificationStatus) || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const logs = defaultQueueService.getLogs({
      order_id,
      user_id,
      channel,
      status,
      limit,
    });

    return NextResponse.json({
      success: true,
      total: logs.length,
      logs,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
