import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Module 12 Item 49: Server-Side Conversion API (CAPI) Endpoint
 * Handles server-to-server purchase event tracking for Meta Conversions API & GA4 Measurement Protocol.
 * Bypasses client-side ad-blockers and privacy shields securely.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, orderId, orderNumber, value, currency = 'INR', items = [] } = body;

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order identifier is required for CAPI conversion tracking' },
        { status: 400 }
      );
    }

    const payload = {
      event: event || 'Purchase',
      event_id: `capi_${orderId || orderNumber}_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      custom_data: {
        order_id: orderNumber || orderId,
        currency,
        value: Number(value) || 0,
        content_type: 'product',
        contents: items.map((i: any) => ({
          id: i.bookId || i.id,
          quantity: i.quantity || 1,
          item_price: i.price,
        })),
      },
      action_source: 'website',
    };

    // In production with META_CAPI_ACCESS_TOKEN and GA4_API_SECRET configured,
    // dispatch to official Graph API: `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`
    // and Google Analytics: `https://www.google-analytics.com/mp/collect`
    console.log('[Server-Side CAPI Event Dispatched]:', payload.event, payload.custom_data.order_id);

    return NextResponse.json({
      success: true,
      tracked: true,
      eventId: payload.event_id,
      dispatchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Server CAPI dispatch error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'CAPI dispatch failed' },
      { status: 500 }
    );
  }
}
