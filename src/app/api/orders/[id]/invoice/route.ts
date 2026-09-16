import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateInvoiceForOrderAsync } from '@/lib/services/invoiceStorageService';
import { generateInvoiceHtml } from '@/lib/services/invoicePdfService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Retrieve or synthesize statutory invoice from Supabase or memory order stores
    const invoice = await getOrCreateInvoiceForOrderAsync(id);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: `Order #${id} not found in database or ledger.` },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');
    const acceptHeader = request.headers.get('accept') || '';

    // If HTML format is requested, or accessed directly in browser navigation, return printable HTML
    if (format === 'html' || acceptHeader.includes('text/html')) {
      const copyType = (searchParams.get('copy') as any) || 'ORIGINAL';
      const html = generateInvoiceHtml(invoice, copyType);

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

    // Return structured JSON
    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error: any) {
    console.error('Invoice API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error while fetching invoice',
      },
      { status: 500 }
    );
  }
}
