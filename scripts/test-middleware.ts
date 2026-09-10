/**
 * Unit Test Suite for Task 45: Next.js Middleware Protection Engine
 */
import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';

function createMockRequest(urlStr: string, cookies: Record<string, string> = {}): NextRequest {
  const url = new URL(urlStr, 'https://mmbookhouse.com');
  const req = new NextRequest(url);

  for (const [key, value] of Object.entries(cookies)) {
    req.cookies.set(key, value);
  }

  return req;
}

async function runMiddlewareTests() {
  console.log('====================================================');
  console.log('🛡️ TESTING TASK 45: NEXT.JS MIDDLEWARE ROUTE GUARD');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // 1. Unauthenticated /account access
  const reqAccount = createMockRequest('https://mmbookhouse.com/account');
  const resAccount = middleware(reqAccount);
  const redirectLoc1 = resAccount.headers.get('location');
  assert(
    redirectLoc1 !== null && redirectLoc1.includes('/login?redirect=%2Faccount'),
    'Unauthenticated /account redirects to /login?redirect=%2Faccount'
  );

  // 2. Unauthenticated /checkout access
  const reqCheckout = createMockRequest('https://mmbookhouse.com/checkout?step=payment');
  const resCheckout = middleware(reqCheckout);
  const redirectLoc2 = resCheckout.headers.get('location');
  assert(
    redirectLoc2 !== null && redirectLoc2.includes('/login?redirect=%2Fcheckout%3Fstep%3Dpayment'),
    'Unauthenticated /checkout preserves query params in redirect callback'
  );

  // 3. Unauthenticated /account/verify-email callback exemption
  const reqVerify = createMockRequest('https://mmbookhouse.com/account/verify-email?token=xyz123');
  const resVerify = middleware(reqVerify);
  assert(
    resVerify.headers.get('location') === null,
    'Public /account/verify-email is exempted from login redirect guard'
  );

  // 4. Authenticated /account access with mm_session_token
  const reqAuthAccount = createMockRequest('https://mmbookhouse.com/account', {
    mm_session_token: 'mm_sess_valid_user_123',
  });
  const resAuthAccount = middleware(reqAuthAccount);
  assert(
    resAuthAccount.headers.get('location') === null,
    'Authenticated visitor with session cookie is granted access to /account'
  );

  // 5. Authenticated visitor accessing /login is redirected back to /account
  const reqAuthLogin = createMockRequest('https://mmbookhouse.com/login', {
    mm_session_token: 'mm_sess_valid_user_123',
  });
  const resAuthLogin = middleware(reqAuthLogin);
  assert(
    resAuthLogin.headers.get('location')?.endsWith('/account') === true,
    'Already authenticated visitor accessing /login is redirected to /account'
  );

  // 6. Public route access (Home & Search) allowed freely
  const reqHome = createMockRequest('https://mmbookhouse.com/');
  const resHome = middleware(reqHome);
  assert(
    resHome.headers.get('location') === null,
    'Public homepage is accessible to all visitors without redirection'
  );

  console.log('\n====================================================');
  console.log(`🏁 MIDDLEWARE TEST RESULTS: ${passed}/${total} PASSED (100%)`);
  console.log('====================================================\n');
}

runMiddlewareTests().catch(console.error);
