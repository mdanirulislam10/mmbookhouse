import { NextRequest, NextResponse } from 'next/server';
import { verifyInvoice } from '../../../../../lib/services/invoiceStorageService';

/**
 * Public Statutory Invoice Verification Endpoint (Item 17)
 * Scanned via QR code on invoice header by customers, logistics hubs, or tax auditors.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoice_number: string }> }
) {
  try {
    const { invoice_number } = await params;
    if (!invoice_number) {
      return NextResponse.json(
        { verified: false, error: 'Invoice number parameter is missing.' },
        { status: 400 }
      );
    }

    const verificationResult = verifyInvoice(invoice_number);

    if (!verificationResult.verified) {
      return NextResponse.json(verificationResult, { status: 404 });
    }

    return NextResponse.json(verificationResult, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { verified: false, error: error?.message || 'Internal verification server error.' },
      { status: 500 }
    );
  }
}
