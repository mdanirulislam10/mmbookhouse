import {
  checkRateLimit,
  resetRateLimits,
  auditEnvironmentSecretLeakage,
  validateClientPriceZeroTrust,
  auditDpdpCompliance,
  auditSupabaseRlsPolicies,
} from '../src/lib/security/rateLimiterService';

console.log('🧪 Starting Module 20 Task 5 Test Suite: Zero-Trust API Rate Limiting & Secret Leakage Guard...');

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
    // Test 1: Sliding Window Rate Limiting (Item 18)
    resetRateLimits();
    const testIp = '103.220.10.5';
    const authEndpoint = '/api/auth/login';

    // Fire 10 requests (all should pass)
    let allInitialPassed = true;
    for (let i = 0; i < 10; i++) {
      const res = checkRateLimit(testIp, authEndpoint, 10, 60000);
      if (!res.allowed) allInitialPassed = false;
    }
    assert(allInitialPassed, 'Rate limiter permits exactly 10 requests per minute for sensitive endpoints');

    // 11th request must be blocked
    const blockedRes = checkRateLimit(testIp, authEndpoint, 10, 60000);
    assert(!blockedRes.allowed && blockedRes.remaining === 0, '11th request triggers HTTP 429 Too Many Requests block');
    assert(blockedRes.resetInSeconds > 0, 'Rate limiter provides accurate resetInSeconds countdown');

    // Test 2: Environment Secret Leakage Auditor (Item 12)
    const cleanEnv = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://mmbookhouse.in',
      NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_live_123456',
      SUPABASE_SERVICE_ROLE_KEY: 'secret_supabase_admin_key_strictly_server_only',
      RAZORPAY_KEY_SECRET: 'secret_razorpay_strictly_server_only',
      WHATSAPP_TOKEN: 'secret_whatsapp_strictly_server_only',
    };

    const cleanReport = auditEnvironmentSecretLeakage(cleanEnv);
    assert(!cleanReport.hasLeakedSecrets, 'Clean environment passes with zero sensitive secret leaks');
    assert(cleanReport.safeKeys.length === 3, 'All 3 server-only secrets safely detected without public prefix');

    const leakedEnv = {
      ...cleanEnv,
      NEXT_PUBLIC_RAZORPAY_KEY_SECRET: 'leaked_secret_in_client_bundle',
    };
    const leakReport = auditEnvironmentSecretLeakage(leakedEnv);
    assert(leakReport.hasLeakedSecrets, 'Auditor catches critical NEXT_PUBLIC_RAZORPAY_KEY_SECRET leakage');
    assert(leakReport.violations.length === 1, 'Violating key is specifically flagged');

    // Test 3: Zero-Trust Client Price Recalculator (Item 19)
    const catalog = {
      'book-wbcs-01': 450,
      'book-wbcs-02': 320,
    };

    // Case A: Tampered Price (Client inspected element and changed price to ₹10)
    const tamperedReq = {
      items: [
        { bookId: 'book-wbcs-01', quantity: 1, claimedPrice: 10 }, // Real price: 450
        { bookId: 'book-wbcs-02', quantity: 1, claimedPrice: 320 },
      ],
      couponCode: 'LAUNCH2026',
      claimedShipping: 0,
      claimedTotal: 230, // Tampered total
    };

    const tamperedResult = validateClientPriceZeroTrust(tamperedReq, catalog, { LAUNCH2026: 100 });
    assert(!tamperedResult.isValid, 'Zero-trust validator rejects client-tampered price manipulation');
    assert(
      tamperedResult.serverTotal === 670, // (450 + 320) - 100 discount = 670 (>= 500 so free shipping)
      'Server accurately recalculates correct total from catalog database'
    );
    assert(tamperedResult.discrepancies.length >= 2, 'Discrepancies clearly document individual mismatches');

    // Case B: Authentic Match
    const authenticReq = {
      items: [
        { bookId: 'book-wbcs-01', quantity: 1, claimedPrice: 450 },
        { bookId: 'book-wbcs-02', quantity: 1, claimedPrice: 320 },
      ],
      couponCode: 'LAUNCH2026',
      claimedShipping: 0,
      claimedTotal: 670,
    };
    const authResult = validateClientPriceZeroTrust(authenticReq, catalog, { LAUNCH2026: 100 });
    assert(authResult.isValid, 'Zero-trust validator approves legitimate price calculation');

    // Test 4: DPDP Act 2023 & RBI Card Tokenization Compliance (Item 20)
    const compliantSchema = {
      users: ['id', 'email', 'phone', 'full_name', 'created_at'],
      orders: ['id', 'user_id', 'total_amount', 'status', 'razorpay_payment_id'],
      addresses: ['id', 'user_id', 'street', 'city', 'pin_code'],
    };

    const dpdpReport = auditDpdpCompliance(compliantSchema);
    assert(dpdpReport.isCompliant, 'Database schema complies 100% with DPDP Act 2023 & zero raw card storage');

    const nonCompliantSchema = {
      ...compliantSchema,
      orders: [...compliantSchema.orders, 'card_number', 'cvv'],
    };
    const nonCompliantReport = auditDpdpCompliance(nonCompliantSchema);
    assert(!nonCompliantReport.isCompliant, 'Auditor flags illegal card_number and cvv storage violation');

    // Test 5: Supabase RLS Lockdown Auditor (Item 11)
    const requiredTables = ['orders', 'users', 'cart_items', 'addresses'];
    const activePolicies = {
      orders: ['orders_select_owner', 'orders_insert_owner'],
      users: ['users_select_owner', 'users_update_owner'],
      cart_items: ['cart_select_owner', 'cart_all_owner'],
      addresses: ['addresses_all_owner'],
    };

    const rlsAudit = auditSupabaseRlsPolicies(requiredTables, activePolicies);
    assert(rlsAudit.allSecured, 'All critical tables verified with active Row Level Security (RLS) policies');
    assert(rlsAudit.auditedCount === 4, '4/4 required tables locked down');

  } catch (err: unknown) {
    console.error('Fatal error during Task 5 tests:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Task 5 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
