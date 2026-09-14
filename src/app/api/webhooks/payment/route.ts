import { NextRequest, NextResponse } from 'next/server';
import { processPaymentWebhook } from '@/lib/services/webhookService';
import { PaymentGatewayId } from '@/types/payment';

/**
 * Module 13: Secure Payment Webhook Endpoint
 * 
 * Complies with:
 * - Item 21: Server-to-server reliable webhook reception.
 * - Item 22: Cryptographic HMAC-SHA256 signature verification.
 * - Item 26: Relational payment ledger updates.
 * - Item 27: Atomic status transition.
 * - Item 45: Zero-trust price anti-tampering verification.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Check Gateway Signatures
    const rzpSignature = req.headers.get('x-razorpay-signature');
    const cfSignature = req.headers.get('x-cashfree-signature');

    let gateway: PaymentGatewayId = 'razorpay';
    let signature = rzpSignature || '';

    if (cfSignature) {
      gateway = 'cashfree';
      signature = cfSignature;
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing gateway HMAC cryptographic signature header' },
        { status: 401 }
      );
    }

    const result = await processPaymentWebhook(rawBody, signature, gateway);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.reason,
          tampered: result.is_price_tampered || false,
        },
        { status: result.is_price_tampered ? 403 : 400 }
      );
    }

    return NextResponse.json(
      {
        received: true,
        order_id: result.order_id,
        payment_id: result.payment_id,
        status: result.status,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error while handling payment webhook' },
      { status: 500 }
    );
  }
}
