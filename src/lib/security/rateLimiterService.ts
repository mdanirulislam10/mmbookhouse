import type {
  RateLimitCheckResult,
  ClientPriceValidationRequest,
  ClientPriceValidationResult,
  SecretLeakAuditReport,
  DpdpComplianceReport,
} from '@/types/pwaSecurity';

/**
 * Module 20: Zero-Trust Security, Rate Limiting & DPDP Compliance Engine (Items 11, 12, 18, 19, 20)
 * 1. Sliding window API rate limiter (10 req/min for auth/payment) (Item 18)
 * 2. Zero-trust server-side price re-calculator (Item 19)
 * 3. Server secret leakage scanner (preventing NEXT_PUBLIC_ exposure) (Item 12)
 * 4. DPDP Act 2023 & RBI zero local card storage compliance (Item 20)
 * 5. Supabase RLS lockdown validator (Item 11)
 */

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Enforces sliding-window rate limiting per IP & Route.
 */
export function checkRateLimit(
  ip: string,
  route: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): RateLimitCheckResult {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Filter out timestamps older than the sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= maxRequests) {
    const oldestTimestamp = entry.timestamps[0];
    const resetInSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      allowed: false,
      currentCount: entry.timestamps.length,
      maxAllowed: maxRequests,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
      reason: 'Too Many Requests - Rate limit exceeded. Try again later.',
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    currentCount: entry.timestamps.length,
    maxAllowed: maxRequests,
    remaining: maxRequests - entry.timestamps.length,
    resetInSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Resets the in-memory rate limiter (for testing).
 */
export function resetRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Scans environment variables to prevent accidental client-side secret leakage (Item 12).
 * Strictly flags any sensitive token with 'NEXT_PUBLIC_' prefix.
 */
export function auditEnvironmentSecretLeakage(
  env: Record<string, string | undefined>
): SecretLeakAuditReport {
  const sensitivePatterns = [
    'SERVICE_ROLE_KEY',
    'KEY_SECRET',
    'WHATSAPP_TOKEN',
    'PRIVATE_KEY',
    'DATABASE_URL',
    'POSTGRES_PASSWORD',
    'JWT_SECRET',
  ];

  const violations: { key: string; issue: string }[] = [];
  const safeKeys: string[] = [];

  for (const key of Object.keys(env)) {
    const isSensitive = sensitivePatterns.some((pattern) => key.toUpperCase().includes(pattern));

    if (isSensitive) {
      if (key.startsWith('NEXT_PUBLIC_')) {
        violations.push({
          key,
          issue: `CRITICAL LEAK: Sensitive secret "${key}" is exposed to client-side bundle with NEXT_PUBLIC_ prefix!`,
        });
      } else {
        safeKeys.push(key);
      }
    }
  }

  return {
    hasLeakedSecrets: violations.length > 0,
    scannedKeysCount: Object.keys(env).length,
    safeKeys,
    violations,
  };
}

/**
 * Zero-Trust Server-Side Price Recalculator (Item 19).
 * Never trusts prices or grand totals sent from client browser/inspect element.
 */
export function validateClientPriceZeroTrust(
  request: ClientPriceValidationRequest,
  catalogPrices: Record<string, number>,
  validCoupons: Record<string, number> = { LAUNCH2026: 100, WBCS10: 50 }
): ClientPriceValidationResult {
  const discrepancies: string[] = [];
  let calculatedItemsTotal = 0;

  // 1. Recalculate each item price strictly from server catalog
  for (const item of request.items) {
    const actualPrice = catalogPrices[item.bookId];
    if (actualPrice === undefined) {
      discrepancies.push(`Unknown or unlisted book ID: ${item.bookId}`);
      continue;
    }

    if (item.claimedPrice !== actualPrice) {
      discrepancies.push(
        `Price mismatch for ${item.bookId}: Client claimed ₹${item.claimedPrice}, server catalog is ₹${actualPrice}`
      );
    }

    calculatedItemsTotal += actualPrice * item.quantity;
  }

  // 2. Validate discount from coupon
  let appliedDiscount = 0;
  if (request.couponCode) {
    const couponValue = validCoupons[request.couponCode.toUpperCase()];
    if (couponValue !== undefined) {
      appliedDiscount = Math.min(couponValue, calculatedItemsTotal);
    } else {
      discrepancies.push(`Invalid or expired coupon code: ${request.couponCode}`);
    }
  }

  // 3. Shipping logic: Free shipping above ₹500, else ₹50
  const actualShipping = calculatedItemsTotal - appliedDiscount >= 500 ? 0 : 50;
  if (request.claimedShipping !== actualShipping) {
    discrepancies.push(
      `Shipping fee mismatch: Client claimed ₹${request.claimedShipping}, calculated is ₹${actualShipping}`
    );
  }

  const recalculatedGrandTotal = calculatedItemsTotal - appliedDiscount + actualShipping;

  if (request.claimedTotal !== recalculatedGrandTotal) {
    discrepancies.push(
      `Grand total mismatch: Client claimed ₹${request.claimedTotal}, server calculated ₹${recalculatedGrandTotal}`
    );
  }

  return {
    isValid: discrepancies.length === 0,
    serverTotal: recalculatedGrandTotal,
    claimedTotal: request.claimedTotal,
    discrepancies,
    recalculatedBreakdown: {
      itemsTotal: calculatedItemsTotal,
      discount: appliedDiscount,
      shipping: actualShipping,
      grandTotal: recalculatedGrandTotal,
    },
  };
}

/**
 * DPDP Act 2023 & RBI Card Tokenization Auditor (Item 20).
 * Guarantees zero local storage of raw card numbers, CVVs, or card expiries in database.
 */
export function auditDpdpCompliance(
  dbTablesAndColumns: Record<string, string[]>
): DpdpComplianceReport {
  const forbiddenColumns = ['card_number', 'card_num', 'cvv', 'cvc', 'card_expiry', 'credit_card'];
  const checks: { rule: string; passed: boolean; details: string }[] = [];

  let forbiddenFound = false;

  for (const [table, columns] of Object.entries(dbTablesAndColumns)) {
    for (const col of columns) {
      if (forbiddenColumns.includes(col.toLowerCase())) {
        forbiddenFound = true;
        checks.push({
          rule: `Zero Raw Card Data Storage (${table}.${col})`,
          passed: false,
          details: `Violation: Forbidden card detail column "${col}" found in table "${table}".`,
        });
      }
    }
  }

  if (!forbiddenFound) {
    checks.push({
      rule: 'Zero Raw Card Data Storage',
      passed: true,
      details: 'No raw card numbers, CVVs, or expiries stored. Compliant with RBI guidelines.',
    });
  }

  // Check tokenization support
  const ordersColumns = dbTablesAndColumns['orders'] || [];
  const hasTokenization = ordersColumns.some((col) =>
    ['payment_token', 'razorpay_payment_id', 'gateway_order_id'].includes(col.toLowerCase())
  );

  checks.push({
    rule: 'Gateway Tokenization Vault Integration',
    passed: hasTokenization,
    details: hasTokenization
      ? 'Payment transactions use secure tokenized gateway IDs exclusively.'
      : 'Missing tokenized payment reference in orders table.',
  });

  return {
    isCompliant: checks.every((c) => c.passed),
    checks,
    lastAuditedAt: new Date().toISOString(),
  };
}

/**
 * Row Level Security (RLS) Lockdown Auditor (Item 11).
 * Verifies that critical customer & order tables have active RLS policies.
 */
export function auditSupabaseRlsPolicies(
  requiredTables: string[],
  activePolicies: Record<string, string[]>
): { allSecured: boolean; auditedCount: number; missingRlsTables: string[] } {
  const missingRlsTables: string[] = [];

  for (const table of requiredTables) {
    const policies = activePolicies[table];
    if (!policies || policies.length === 0) {
      missingRlsTables.push(table);
    }
  }

  return {
    allSecured: missingRlsTables.length === 0,
    auditedCount: requiredTables.length,
    missingRlsTables,
  };
}
