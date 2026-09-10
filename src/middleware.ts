import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Task 45: Next.js Middleware Protection Engine
 * Protects authenticated customer routes (/account, /checkout, /orders)
 * and seamlessly redirects unauthenticated visitors to /login with target callback.
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
    return NextResponse.redirect(loginUrl);
  }

  // Guard: If already authenticated and accessing /login, redirect back to destination or /account
  if (pathname === '/login' && isAuthenticated) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const destination =
      redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : '/account';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
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
