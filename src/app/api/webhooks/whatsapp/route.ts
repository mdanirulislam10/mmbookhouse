import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { metaWebhookPayloadSchema } from '@/lib/validations/notifications';
import { defaultQueueService } from '@/lib/services/notificationQueueService';
import { defaultPreferenceService } from '@/lib/services/notificationPreferenceService';

/**
 * Module 18: Meta Cloud WhatsApp Business API Webhook Route
 * 
 * Complies with:
 * - Item 33: Delivery Receipts (sent -> delivered -> read -> failed)
 * - Item 35: Meta Webhook Handshake & HMAC-SHA256 Signature Verification
 * - Item 12: Inbound COD 1-Tap Confirmation & Cancellation button processing
 * - Item 26: Inbound STOP / থামুন opt-out keywords
 */

import { inboundButtonResponses } from '@/lib/services/whatsappWebhookStore';

/**
 * Meta Handshake GET Endpoint (Hub Challenge Verification)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'mmbook_meta_token_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json(
    { success: false, error: 'Forbidden: Invalid verification token or hub mode' },
    { status: 403 }
  );
}

/**
 * Meta Inbound Events POST Endpoint (Delivery Receipts & Button Responses)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // Verify HMAC-SHA256 signature if appSecret is configured
    if (appSecret && signature) {
      const expectedSig = `sha256=${crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex')}`;

      if (signature !== expectedSig) {
        return NextResponse.json(
          { success: false, error: 'Invalid HMAC signature' },
          { status: 401 }
        );
      }
    }

    let jsonPayload: unknown;
    try {
      jsonPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const validation = metaWebhookPayloadSchema.safeParse(jsonPayload);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Malformed Meta webhook schema', details: validation.error.format() },
        { status: 400 }
      );
    }

    let processedStatuses = 0;
    let processedMessages = 0;

    for (const entry of validation.data.entry) {
      for (const change of entry.changes) {
        const val = change.value;

        // 1. Process Status Updates (sent -> delivered -> read -> failed)
        if (val.statuses && val.statuses.length > 0) {
          for (const st of val.statuses) {
            defaultQueueService.updateStatusByMessageId(
              st.id,
              st.status,
              new Date(parseInt(st.timestamp, 10) * 1000).toISOString()
            );
            processedStatuses++;
          }
        }

        // 2. Process Inbound Messages (Quick Replies, Buttons, STOP text)
        if (val.messages && val.messages.length > 0) {
          for (const msg of val.messages) {
            processedMessages++;
            const fromPhone = `+${msg.from}`;

            // Check quick-reply button payload
            const buttonPayload = msg.button?.payload || msg.interactive?.button_reply?.id;
            if (buttonPayload) {
              if (buttonPayload.startsWith('CONFIRM_COD_')) {
                const orderId = buttonPayload.replace('CONFIRM_COD_', '');
                inboundButtonResponses.push({
                  from: fromPhone,
                  payload: buttonPayload,
                  action: 'CONFIRM_COD',
                  order_id: orderId,
                  timestamp: new Date().toISOString(),
                });
              } else if (buttonPayload.startsWith('CANCEL_COD_')) {
                const orderId = buttonPayload.replace('CANCEL_COD_', '');
                inboundButtonResponses.push({
                  from: fromPhone,
                  payload: buttonPayload,
                  action: 'CANCEL_COD',
                  order_id: orderId,
                  timestamp: new Date().toISOString(),
                });
              } else {
                inboundButtonResponses.push({
                  from: fromPhone,
                  payload: buttonPayload,
                  action: 'OTHER',
                  timestamp: new Date().toISOString(),
                });
              }
            }

            // Check text opt-out keywords (e.g. STOP, থামুন)
            const textBody = msg.text?.body?.trim().toUpperCase();
            if (textBody === 'STOP' || textBody === 'UNSUBSCRIBE' || textBody === 'থামুন' || textBody === 'বন্ধ') {
              defaultPreferenceService.handleOptOut(fromPhone, textBody);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedStatuses,
      processedMessages,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
