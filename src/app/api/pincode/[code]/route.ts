/**
 * Module 11 Task 2: Postal Edge API Route (/api/pincode/[code])
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 2, 3, 41, 42):
 * - Sub-15ms postal data auto-population for City & State
 * - Sub-post offices list for editable dropdown
 * - Edge & Browser Cache-Control (24 hours max-age, 7 days CDN s-maxage)
 */

import { NextRequest, NextResponse } from 'next/server';
import { normalizePincodeDigits, validateIndianPincode } from '@/lib/data/pincodeData';
import { resolvePostalPincodeLocal, lookupPostalPincode } from '@/lib/services/pincodeService';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const rawCode = resolvedParams?.code;

    if (!rawCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'পিনকোড প্রদান করা হয়নি (Pincode is missing)',
        },
        { status: 400 }
      );
    }

    const normalized = normalizePincodeDigits(rawCode).trim();
    const validation = validateIndianPincode(normalized);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'সঠিক ৬-সংখ্যার ভারতীয় পিনকোড দিন (Invalid 6-digit Indian postal pincode)',
        },
        { status: 400 }
      );
    }

    // 1. Instant local/cache resolution (< 5ms)
    let postalData = resolvePostalPincodeLocal(validation.normalizedPincode);

    // 2. If not found in local primary list, use lookup with circle fallback
    if (!postalData) {
      postalData = await lookupPostalPincode(validation.normalizedPincode);
    }

    return NextResponse.json(
      {
        success: true,
        data: postalData,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          'X-Pincode-Engine': 'MM-Book-House-Postal-Edge-v1',
        },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      {
        success: false,
        error: 'পোস্টাল তথ্য সংগ্রহে সমস্যা হয়েছে, অনুগ্রহ করে ম্যানুয়ালি লিখুন',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
