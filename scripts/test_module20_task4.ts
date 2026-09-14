import {
  getSecurityHeadersConfig,
  buildContentSecurityPolicy,
  sanitizeUserHtmlInput,
  verifyCsrfToken,
} from '../src/lib/security/securityHeaders';

console.log('🧪 Starting Module 20 Task 4 Test Suite: Security Headers & Middleware Protection...');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  try {
    // Test 1: Content Security Policy (CSP) Generation (Item 13)
    const csp = buildContentSecurityPolicy();
    assert(csp.includes("default-src 'self'"), 'CSP specifies default-src "self"');
    assert(csp.includes('https://checkout.razorpay.com'), 'CSP allows Razorpay payment script and frame execution');
    assert(csp.includes('https://challenges.cloudflare.com'), 'CSP allows Cloudflare Turnstile bot verification');
    assert(csp.includes("object-src 'none'"), 'CSP blocks vulnerable plugin object-src');
    assert(csp.includes("base-uri 'self'"), 'CSP enforces base-uri self restriction');

    // Test 2: Standard Security Headers Configuration
    const headers = getSecurityHeadersConfig();
    assert(headers.xFrameOptions === 'DENY', 'X-Frame-Options is strictly set to DENY (Clickjacking defense)');
    assert(headers.xContentTypeOptions === 'nosniff', 'X-Content-Type-Options is set to nosniff (MIME sniffing defense)');
    assert(
      headers.strictTransportSecurity.includes('max-age=63072000') &&
      headers.strictTransportSecurity.includes('preload'),
      'HSTS is set to 2-year duration (63072000s) with preload flag'
    );
    assert(
      headers.permissionsPolicy.includes('camera=()') &&
      headers.permissionsPolicy.includes('microphone=()'),
      'Permissions-Policy disables unnecessary device hardware access'
    );

    // Test 3: XSS Neutralizer / DOMPurify Pattern (Item 15)
    const maliciousInput = '<p>দারুণ বই!</p><script>alert("Hacked")</script><img src="x" onerror="stealCookies()">';
    const sanitized = sanitizeUserHtmlInput(maliciousInput);

    assert(!sanitized.includes('<script>'), 'XSS sanitizer completely removes <script> tags');
    assert(!sanitized.includes('onerror='), 'XSS sanitizer strips malicious event handlers');
    assert(sanitized.includes('দারুণ বই!'), 'XSS sanitizer preserves legitimate Bengali book reviews');

    const javascriptUriInput = '<a href="javascript:doMalicious()">ক্লিক করুন</a>';
    const sanitizedLink = sanitizeUserHtmlInput(javascriptUriInput);
    assert(!sanitizedLink.includes('javascript:'), 'XSS sanitizer neutralizes javascript: pseudo-protocols');

    // Test 4: CSRF Verification Engine (Item 16)
    const validToken = 'csrf_token_secret_abcdef123456';
    assert(
      verifyCsrfToken(validToken, validToken),
      'CSRF token validator approves matching token pair'
    );
    assert(
      !verifyCsrfToken(validToken, 'mismatched_token_999999'),
      'CSRF token validator rejects mismatched tokens'
    );
    assert(
      !verifyCsrfToken(undefined, validToken),
      'CSRF token validator rejects missing cookie token'
    );

  } catch (err: unknown) {
    console.error('Fatal error during Task 4 tests:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Task 4 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
