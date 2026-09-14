/**
 * Module 16: 3PL Shipping Webhook Endpoint
 * M.M Book House Malda - Live Order Tracking
 * 
 * Handles webhook notifications from Delhivery, Shiprocket, and India Post:
 * - Item 14: HMAC-SHA256 signature verification
 * - Item 15: Status normalization into canonical OrderStatus
 * - Item 16: Tracking milestone creation and location capture
 * - Item 43: Webhook idempotency deduplication preventing duplicate event storms
 * - Item 47: Targeted route cache revalidation
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { courierWebhookSchema } from '@/lib/validations/tracking';
import {
  verifyCourierWebhookSignature,
  normalizeCourierStatus,
  webhookIdempotency,
  buildTrackingMilestone,
} from '@/lib/services/logisticsAdapter';
import { validateStatusTransition } from '@/lib/services/trackingStateMachine';
import { OrderStatus } from '@/types/tracking';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get('x-courier-signature') ||
      request.headers.get('x-webhook-signature') ||
      request.headers.get('x-delhivery-signature') ||
      '';

    let payloadJson: Record<string, unknown>;
    try {
      payloadJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // 1. Zod schema validation
    const parsed = courierWebhookSchema.safeParse({
      ...payloadJson,
      signature: signature || (payloadJson.signature as string) || '',
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          issues: parsed.error.issues,
        },
        { status: 422 }
      );
    }

    const { awb_number, courier, raw_status, timestamp, location, signature: validSig } = parsed.data;

    // 2. HMAC-SHA256 signature verification (Item 14)
    const isValidSignature = verifyCourierWebhookSignature(rawBody, validSig);
    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Invalid HMAC signature' },
        { status: 401 }
      );
    }

    // 3. Webhook idempotency deduplication (Item 43)
    const isDuplicate = webhookIdempotency.isDuplicate(awb_number, raw_status, timestamp);
    if (isDuplicate) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'Duplicate webhook event ignored (idempotent)',
      });
    }

    // 4. Status normalization (Item 15)
    const normalized = normalizeCourierStatus(courier, raw_status);

    // 5. Milestone creation (Item 16)
    const milestone = buildTrackingMilestone({
      carrier: courier,
      rawStatus: raw_status,
      location,
      timestamp: String(timestamp),
    });

    // 6. Targeted cache revalidation (Item 47)
    try {
      revalidatePath('/account/orders');
      revalidatePath('/track');
    } catch {
      // Ignore during test/static builds
    }

    return NextResponse.json({
      success: true,
      awb: awb_number,
      courier,
      normalizedStatus: normalized.normalizedStatus,
      statusTitleBn: normalized.statusTitleBn,
      statusTitleEn: normalized.statusTitleEn,
      milestone,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Courier webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
