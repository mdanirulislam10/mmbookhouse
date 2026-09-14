import {
  createUnifiedPaymentOrder,
  verifyGatewayPaymentSignature,
  dispatchGatewayRefund,
  getGatewayCredentials,
} from '../src/lib/services/paymentGatewayAdapter';
import {
  getActiveGateway,
  resetGatewayHealth,
  recordGatewayFailure,
  recordGatewaySuccess,
  getGatewayHealthOverview,
} from '../src/lib/services/gatewayHealthService';
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
  console.log('🧪 Testing Module 13 - Task 4: Payment Gateway Adapter & Auto-Failover Engine');

  resetGatewayHealth();

  // 1. Initial State: Primary gateway is Razorpay (Item 1)
  assert(getActiveGateway() === 'razorpay', 'Initial active gateway defaults to Razorpay');

  // 2. Successful order creation on primary gateway
  const order1 = await createUnifiedPaymentOrder({
    orderId: 'MMB-9042',
    amount: 380,
  });
  assert(order1.success === true, 'Successfully creates payment order');
  assert(order1.gateway === 'razorpay', 'Normal traffic routed to primary gateway Razorpay');
  assert(order1.isFailover === false, 'isFailover is false on normal path');
  assert(order1.gatewayOrderId.startsWith('order_rzp_'), 'Generates valid Razorpay order ID prefix');

  // 3. Simulated Primary Failure -> Triggers Automatic Failover to Cashfree (Item 7)
  const orderWithFailover = await createUnifiedPaymentOrder({
    orderId: 'MMB-9043',
    amount: 520,
    notes: { simulate_razorpay_down: 'true' },
  });
  assert(orderWithFailover.success === true, 'Order creation succeeds even when Razorpay is down');
  assert(orderWithFailover.gateway === 'cashfree', 'Traffic automatically failed over to Cashfree');
  assert(orderWithFailover.isFailover === true, 'isFailover flag is true');
  assert(orderWithFailover.gatewayOrderId.startsWith('order_cf_'), 'Generates valid Cashfree order ID prefix');

  // 4. Circuit Breaker Trips on 3 Failures (Item 7)
  resetGatewayHealth();
  recordGatewayFailure('razorpay');
  recordGatewayFailure('razorpay');
  assert(getActiveGateway() === 'razorpay', '2 failures do not trip circuit breaker yet');
  recordGatewayFailure('razorpay'); // 3rd failure trips
  assert(getActiveGateway() === 'cashfree', '3 consecutive failures trip breaker and switch active gateway to Cashfree');

  // Health overview
  const health = getGatewayHealthOverview();
  const razorpayHealth = health.find((h) => h.gateway === 'razorpay');
  const cashfreeHealth = health.find((h) => h.gateway === 'cashfree');
  assert(razorpayHealth?.is_healthy === false, 'Razorpay reported as unhealthy after circuit breaker trip');
  assert(cashfreeHealth?.is_healthy === true, 'Cashfree reported as healthy');

  // 5. Signature Verification (Item 22)
  const creds = getGatewayCredentials('razorpay');
  const gwOrderId = 'order_rzp_test_123';
  const paymentId = 'pay_rzp_test_456';
  const rawBody = `${gwOrderId}|${paymentId}`;
  const validSig = crypto.createHmac('sha256', creds.keySecret).update(rawBody).digest('hex');

  const verifySuccess = verifyGatewayPaymentSignature({
    gateway: 'razorpay',
    gatewayOrderId: gwOrderId,
    paymentId: paymentId,
    signature: validSig,
  });
  assert(verifySuccess === true, 'Cryptographic HMAC signature validates authentic payment confirmation');

  const verifyTampered = verifyGatewayPaymentSignature({
    gateway: 'razorpay',
    gatewayOrderId: gwOrderId,
    paymentId: paymentId,
    signature: 'tampered_fake_signature_abc',
  });
  assert(verifyTampered === false, 'Cryptographic signature rejects forged confirmation');

  // 6. Refund Dispatcher (Item 25, 38)
  const upiRefund = await dispatchGatewayRefund({
    order_id: 'MMB-9042',
    payment_id: paymentId,
    amount: 380,
    reason: 'Out of stock auto refund',
    refund_type: 'FULL',
    initiated_by: 'STOCK_OUT_AUTO',
    destination_upi_or_account: 'student@okhdfcbank',
  });
  assert(upiRefund.status === 'PROCESSED', 'UPI refund is processed');
  assert(upiRefund.expected_settlement_hours === 2, 'UPI refunds estimate fast 2-hour settlement');

  const cardRefund = await dispatchGatewayRefund({
    order_id: 'MMB-9042',
    payment_id: paymentId,
    amount: 380,
    reason: 'Customer cancelled prior to dispatch',
    refund_type: 'FULL',
    initiated_by: 'CUSTOMER_CANCELLATION',
  });
  assert(cardRefund.expected_settlement_hours === 72, 'Card refund estimates 3-5 days banking settlement');

  console.log(`\nResults for Task 4: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
