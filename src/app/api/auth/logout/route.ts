import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Task 46: Server-Side Complete Session Sign-Out & Cookie Purge Route
 * Erases session cookies with zero-age expiration across all paths.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    // 1. Purge primary session cookie
    cookieStore.set('mm_session_token', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: false,
      sameSite: 'lax',
    });

    // 2. Also expire any Supabase auth cookies found in the request
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      if (c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) {
        cookieStore.set(c.name, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0),
          sameSite: 'lax',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'সফলভাবে সাইন-আউট সম্পন্ন হয়েছে এবং সেশন কুকি মোছা হয়েছে।',
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'সাইন-আউটে সমস্যা হয়েছে',
      },
      { status: 500 }
    );
  }
}
