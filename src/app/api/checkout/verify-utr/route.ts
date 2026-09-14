import { NextRequest, NextResponse } from 'next/server';
import { submitManualUpiVerification } from '@/lib/services/webhookService';

/**
 * Module 13 - Item 37: 12-Digit Indian Banking UTR / RRN Manual Verification API
 * Enables students who paid via external phone or UPI app to submit their 12-character UTR
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, utr, amount } = body;

    if (!orderId || !utr || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'orderId, utr, and amount are required' },
        { status: 400 }
      );
    }

    const result = await submitManualUpiVerification({
      orderId,
      utr,
      amount,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'UTR verification failed' },
      { status: 400 }
    );
  }
}
