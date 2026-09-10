import { NextRequest, NextResponse } from 'next/server';
import { checkCourierServiceability } from '@/lib/services/courierService';
import { validateIndianPincode } from '@/lib/data/pincodeData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode') || '732101';
  const orderValue = Number(searchParams.get('orderValue') || '0');
  const isExpress = searchParams.get('express') === 'true';

  const validation = validateIndianPincode(pincode);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error || 'Invalid 6-digit Indian postal pincode',
      },
      { status: 400 }
    );
  }

  const result = await checkCourierServiceability({
    pincode: validation.normalizedPincode,
    orderValue,
    isExpressRequested: isExpress,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pincode = body?.pincode || '732101';
    const orderValue = Number(body?.orderValue || 0);
    const weightGrams = Number(body?.weightGrams || 500);
    const isCod = Boolean(body?.isCod);
    const isExpressRequested = Boolean(body?.isExpressRequested);

    const validation = validateIndianPincode(pincode);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid 6-digit Indian postal pincode',
        },
        { status: 400 }
      );
    }

    const result = await checkCourierServiceability({
      pincode: validation.normalizedPincode,
      orderValue,
      weightGrams,
      isCod,
      isExpressRequested,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Malformed JSON payload' },
      { status: 400 }
    );
  }
}
