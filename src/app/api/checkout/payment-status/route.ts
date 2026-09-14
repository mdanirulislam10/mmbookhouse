import { NextRequest, NextResponse } from 'next/server';
import { queryTranquilPaymentStatus } from '@/lib/services/webhookService';

/**
 * Module 13 - Item 23 & 27: Live Payment Status Polling API
 * Allows client-side checkout overlay to check real-time payment confirmation
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const status = await queryTranquilPaymentStatus(orderId);

    return NextResponse.json(status, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
