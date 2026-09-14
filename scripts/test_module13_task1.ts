import {
  utrNumberSchema,
  codPolicyValidationSchema,
  createPaymentOrderSchema,
  paymentWebhookPayloadSchema,
  refundRequestSchema,
  verifyHmacSha256Signature,
  isZeroSurchargeApplicable,
} from '../src/lib/validations/payment';
import crypto from 'crypto';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('🧪 Testing Module 13 - Task 1: Core Types & Zod Validations Engine');

// 1. UTR 12-character validation
assert(utrNumberSchema.safeParse('123456789012').success, 'Valid 12-digit UTR passes');
assert(utrNumberSchema.safeParse('AXIS00123456').success, 'Valid 12-character alphanumeric UTR passes');
assert(!utrNumberSchema.safeParse('12345').success, 'Short UTR fails');
assert(!utrNumberSchema.safeParse('1234567890123').success, 'Long 13-char UTR fails');
assert(!utrNumberSchema.safeParse('12345-789012').success, 'UTR with special chars fails');

// 2. COD Policy ₹2,500 Hard Cap & RTO Blacklist
assert(
  codPolicyValidationSchema.safeParse({
    amount: 1500,
    phone: '9733085000',
    rtoCount: 0,
  }).success,
  'Order under ₹2,500 with zero RTO passes COD check'
);

assert(
  codPolicyValidationSchema.safeParse({
    amount: 2500,
    phone: '9733085000',
    rtoCount: 1,
  }).success,
  'Exact ₹2,500 order with 1 RTO passes COD check'
);

const overLimitResult = codPolicyValidationSchema.safeParse({
  amount: 2501,
  phone: '9733085000',
  rtoCount: 0,
});
assert(!overLimitResult.success, 'Order ₹2,501 exceeds ₹2,500 COD cap and fails');

const blacklistedResult = codPolicyValidationSchema.safeParse({
  amount: 800,
  phone: '9733085000',
  rtoCount: 2,
});
assert(!blacklistedResult.success, 'User with 2 RTO returns is blacklisted and fails COD check');

// 3. HMAC-SHA256 Cryptographic Signature Verification (Item 22)
const secret = 'webhook_secret_key_mmbookhouse_2026';
const payload = JSON.stringify({
  event: 'payment.captured',
  order_id: 'MMB-2026-9042',
  amount: 380,
  timestamp: 1773273600,
});
const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

assert(
  verifyHmacSha256Signature(payload, validSignature, secret),
  'Cryptographic HMAC-SHA256 signature verifier accepts authentic gateway webhook'
);

assert(
  !verifyHmacSha256Signature(payload, 'tampered_or_invalid_signature_hex_code_123', secret),
  'Cryptographic HMAC verifier rejects tampered signature'
);

assert(
  !verifyHmacSha256Signature(payload + 'tampered', validSignature, secret),
  'Cryptographic HMAC verifier rejects tampered payload body'
);

// 4. Create Payment Order Schema (Server-side zero-trust)
const validOrderCreation = createPaymentOrderSchema.safeParse({
  orderId: 'MMB-9042',
  amount: 380,
  currency: 'INR',
  gateway: 'razorpay',
  customerPhone: '9733085000',
});
assert(validOrderCreation.success, 'Valid server order creation payload succeeds');

// 5. Payment Webhook Payload Schema
const validWebhookPayload = paymentWebhookPayloadSchema.safeParse({
  event: 'payment.captured',
  gateway: 'razorpay',
  order_id: 'MMB-9042',
  payment_id: 'pay_Nmo12345678',
  amount: 380,
  currency: 'INR',
  status: 'PAID',
  signature: validSignature,
  utr: '123456789012',
  timestamp: Date.now(),
});
assert(validWebhookPayload.success, 'Valid gateway webhook payload schema succeeds');

// 6. Refund Request Schema
const validRefund = refundRequestSchema.safeParse({
  orderId: 'MMB-9042',
  paymentId: 'pay_Nmo12345678',
  amount: 380,
  reason: 'Customer cancelled prior to dispatch',
  refundType: 'FULL',
  initiatedBy: 'CUSTOMER_CANCELLATION',
});
assert(validRefund.success, 'Valid full refund request schema succeeds');

// 7. RuPay & UPI Zero Surcharge (Item 4)
assert(isZeroSurchargeApplicable('upi'), 'UPI is 0% zero surcharge');
assert(isZeroSurchargeApplicable('card', 'RuPay'), 'RuPay Card is 0% zero surcharge');
assert(!isZeroSurchargeApplicable('card', 'Visa'), 'Visa Card is standard processing');

console.log(`\nResults for Task 1: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
