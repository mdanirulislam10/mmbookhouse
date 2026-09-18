import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '@/lib/admin/adminSession';

function safeEqualText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function GET(request: NextRequest) {
  const valid = verifyAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  );
  return NextResponse.json({ authenticated: valid });
}

export async function POST(request: NextRequest) {
  const configuredPassword = process.env.ADMIN_PANEL_PASSWORD;
  if (!configuredPassword || configuredPassword.length < 12) {
    return NextResponse.json(
      { error: 'অ্যাডমিন লগইন এখনো কনফিগার করা হয়নি। টেকনিক্যাল ব্যক্তিকে জানান।' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!safeEqualText(password, configuredPassword)) {
    return NextResponse.json({ error: 'পাসওয়ার্ডটি সঠিক নয়।' }, { status: 401 });
  }

  let token: string;
  try {
    token = createAdminSessionToken();
  } catch {
    return NextResponse.json(
      { error: 'অ্যাডমিন সেশন এখনো কনফিগার করা হয়নি।' },
      { status: 503 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...adminSessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
