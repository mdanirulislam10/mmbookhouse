import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionName, contactPerson, phone, category, estimatedCopies, notes } = body;

    if (!institutionName || !contactPerson || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'institutionName, contactPerson, and phone are required.',
        },
        { status: 400 }
      );
    }

    const quoteId = `MM-QUOTE-${Date.now().toString(36).toUpperCase()}`;

    // Log the request for fulfillment/notification
    console.log(`[B2B Bulk Quote Created] ID: ${quoteId}`, {
      institutionName,
      contactPerson,
      phone,
      category,
      estimatedCopies,
      notes,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        quoteId,
        message: 'Bulk quote request received successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid request',
      },
      { status: 500 }
    );
  }
}
