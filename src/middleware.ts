import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeadersToResponse } from '@/lib/security/securityHeaders';

/**
 * Task 45 & Module 20: Next.js Middleware Protection & Security Hardening
 * Protects authenticated customer routes (/account, /checkout, /orders)
 * and attaches banking-grade HTTP security headers (CSP, HSTS, X-Frame-Options: DENY).
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Inspect session token cookie (Task 24)
  const sessionToken = request.cookies.get('mm_session_token')?.value;

  // 2. Inspect Supabase auth cookies
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  const isAuthenticated = Boolean(sessionToken || hasSupabaseCookie);

  // 3. Define protected route prefixes (exempting public verification callbacks)
  const isProtectedPath =
    (pathname.startsWith('/account') && pathname !== '/account/verify-email') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders');

  // Guard: If accessing protected route without valid session
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    const destination = pathname + search;
    loginUrl.searchParams.set('redirect', destination);
    const redirectResponse = NextResponse.redirect(loginUrl);
    return applySecurityHeadersToResponse(redirectResponse);
  }

  // Guard: If already authenticated and accessing /login, redirect back to destination or /account
  if (pathname === '/login' && isAuthenticated) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const destination =
      redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : '/account';
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
    return applySecurityHeadersToResponse(redirectResponse);
  }

  const nextResponse = NextResponse.next();
  return applySecurityHeadersToResponse(nextResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/* (API routes)
     * 2. /_next/* (Next.js internal static assets & chunks)
     * 3. /_static/* (Inside public directory)
     * 4. /favicon.ico, /manifest.webmanifest, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml).*)',
  ],
};
