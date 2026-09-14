import { NextRequest, NextResponse } from 'next/server';
import {
  customerNotificationPreferenceSchema,
  optOutRequestSchema,
} from '@/lib/validations/notifications';
import { defaultPreferenceService } from '@/lib/services/notificationPreferenceService';

/**
 * Module 18: Notification Preferences & Opt-Out REST API
 * 
 * Complies with:
 * - Item 26: Opt-Out & Opt-In API handling
 * - Item 40: Customer Preferences Retrieval & Mutation
 * - Item 46: DPDP Act Privacy Standards
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id প্যারামিটার প্রদান করুন' },
        { status: 400 }
      );
    }

    const prefs = defaultPreferenceService.getPreferences(userId);
    return NextResponse.json({
      success: true,
      preferences: prefs,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const json = await request.json();
    const validation = customerNotificationPreferenceSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'অবৈধ পছন্দসমূহ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { user_id, whatsapp_enabled, sms_enabled, email_enabled, promotions_opt_in } = validation.data;
    const updated = defaultPreferenceService.updatePreferences(user_id, {
      whatsapp_enabled,
      sms_enabled,
      email_enabled,
      promotions_opt_in,
    });

    return NextResponse.json({
      success: true,
      preferences: updated,
      message: 'নোটিফিকেশন পছন্দসমূহ সফলভাবে সংরক্ষিত হয়েছে',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();

    // Check if opt-in action
    if (json.action === 'opt_in' && json.phone_number) {
      const optInRes = defaultPreferenceService.optIn(json.phone_number);
      return NextResponse.json(optInRes);
    }

    // Default: opt-out action
    const validation = optOutRequestSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'অবৈধ আনসাবস্ক্রাইব তথ্য', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { phone_number, keyword, channel } = validation.data;
    const result = defaultPreferenceService.handleOptOut(phone_number, keyword, channel);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
