import {
  processPaymentWebhook,
  registerDraftOrder,
  getOrderStatus,
  getPaymentTransaction,
  getTranquilPaymentStatus,
  resetWebhookLedger,
} from '../src/lib/services/webhookService';
import { getGatewayCredentials } from '../src/lib/services/paymentGatewayAdapter';
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

async function runTests() {
  console.log('🧪 Testing Module 13 - Task 5: Cryptographic Webhook Handler & Atomic Status Sync');

  resetWebhookLedger();

  // 1. Register a draft order (Item 27)
  const orderId = 'MMB-2026-9042';
  registerDraftOrder(orderId, 380);

  const initialOrder = getOrderStatus(orderId);
  assert(initialOrder?.order_status === 'PLACED', 'Initial order status is PLACED');
  assert(initialOrder?.payment_status === 'PENDING', 'Initial payment status is PENDING');

  // Tranquil state before payment (Item 23)
  const pendingTranquil = getTranquilPaymentStatus(orderId);
  assert(pendingTranquil.isConfirmed === false, 'Pending order is not confirmed yet');
  assert(pendingTranquil.statusTextBn.includes('ব্রাউজার রিফ্রেশ করবেন না'), 'Displays tranquil waiting guidance in Bengali');

  // 2. Prepare valid Razorpay Webhook Payload & HMAC-SHA256 Signature (Item 22)
  const creds = getGatewayCredentials('razorpay');
  const validPayload = {
    event: 'payment.captured',
    gateway: 'razorpay',
    order_id: orderId,
    payment_id: 'pay_rzp_mock_success_7788',
    amount: 380, // Correct matching amount
    currency: 'INR',
    status: 'PAID',
    signature: 'placeholder',
    utr: '987654321012',
    timestamp: Date.now(),
  };

  const rawValidBody = JSON.stringify(validPayload);
  const validSig = crypto.createHmac('sha256', creds.keySecret).update(rawValidBody).digest('hex');

  // 3. Process Valid Webhook
  const result = await processPaymentWebhook(rawValidBody, validSig, 'razorpay');
  assert(result.success === true, 'Webhook processing succeeds with valid cryptographic signature');
  assert(result.status === 'PAID', 'Webhook result status is PAID');

  // 4. Verify Atomic Order Status Transition (Item 27)
  const confirmedOrder = getOrderStatus(orderId);
  assert(confirmedOrder?.payment_status === 'PAID', 'Order payment_status transitioned to PAID');
  assert(confirmedOrder?.order_status === 'CONFIRMED', 'Order order_status transitioned to CONFIRMED');
  assert(confirmedOrder?.utr === '987654321012', 'Order stores verified 12-digit banking UTR');

  // 5. Verify Relational `payments` Ledger (Item 26)
  const paymentRecord = getPaymentTransaction('pay_rzp_mock_success_7788');
  assert(paymentRecord !== undefined, 'Payment record saved into relational ledger');
  assert(paymentRecord?.amount === 380, 'Payment ledger records correct amount');
  assert(paymentRecord?.payment_gateway === 'razorpay', 'Payment ledger records gateway');

  // Tranquil state after payment (Item 23)
  const confirmedTranquil = getTranquilPaymentStatus(orderId);
  assert(confirmedTranquil.isConfirmed === true, 'Tranquil state reflects confirmed order');
  assert(confirmedTranquil.utr === '987654321012', 'Tranquil state exposes UTR for receipt');

  // 6. Zero-Client-Trust Price Anti-Tampering Audit (Item 45)
  const tamperedOrderId = 'MMB-2026-9043';
  registerDraftOrder(tamperedOrderId, 850); // Real price is ₹850

  const tamperedPayload = {
    event: 'payment.captured',
    gateway: 'razorpay',
    order_id: tamperedOrderId,
    payment_id: 'pay_rzp_hacked_cheap_001',
    amount: 85, // Hacker tried paying ₹85 instead of ₹850
    currency: 'INR',
    status: 'PAID',
    signature: 'placeholder',
    timestamp: Date.now(),
  };
  const rawTamperedBody = JSON.stringify(tamperedPayload);
  const tamperedSig = crypto.createHmac('sha256', creds.keySecret).update(rawTamperedBody).digest('hex');

  const tamperedResult = await processPaymentWebhook(rawTamperedBody, tamperedSig, 'razorpay');
  assert(tamperedResult.success === false, 'Tampered price webhook is rejected');
  assert(tamperedResult.is_price_tampered === true, 'Flagged as price tampering attempt');
  assert(getOrderStatus(tamperedOrderId)?.payment_status === 'PENDING', 'Order was not confirmed with tampered amount');

  // 7. Forged Cryptographic Signature Rejection (Item 22)
  const forgedResult = await processPaymentWebhook(rawValidBody, 'forged_invalid_signature_hex', 'razorpay');
  assert(forgedResult.success === false, 'Rejects spoofed webhook with invalid signature');

  console.log(`\nResults for Task 5: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
