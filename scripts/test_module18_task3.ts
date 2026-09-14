/**
 * Test Suite: Module 18 - Task 3: Providers, Cascade Engine, Retries & Rate Limiting
 * Run: npx tsx scripts/test_module18_task3.ts
 */

import {
  CascadeNotificationEngine,
  MetaWhatsAppProvider,
  TraiDltSmsProvider,
  withRetry,
  rateLimiter,
} from '../src/lib/services/notificationProviderService';
import { NotificationPayload } from '../src/types/notifications';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask3Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 18 - TASK 3: PROVIDERS & CASCADE ENGINE TEST SUITE');
  console.log('========================================================================\n');

  // Reset rate limiter for testing
  rateLimiter.reset();

  const testPayload: NotificationPayload = {
    recipient_name: 'কৌশিক চক্রবর্তী',
    phone_number: '+919832112233',
    trigger: 'order_confirmed',
    template_name: 'mmbook_order_confirmed_bn_v1',
    variables: {
      customer_name: 'কৌশিক চক্রবর্তী',
      order_id: 'ORD-2026-4411',
      total_amount: '950',
    },
  };

  // Test 1: Normal WhatsApp primary delivery
  console.log('--- TEST 1: Primary WhatsApp Business Dispatch ---');
  const engine = new CascadeNotificationEngine();
  const res1 = await engine.dispatchWithCascade(testPayload);

  assert(res1.success, 'Primary WhatsApp dispatch should succeed');
  assert(res1.primary_channel === 'whatsapp', 'Primary channel is WhatsApp');
  assert(res1.actual_channel === 'whatsapp', 'Actual channel is WhatsApp');
  assert(!res1.fallback_triggered, 'Fallback was NOT triggered');
  assert(res1.cost_inr === 0.12, `WhatsApp cost estimate is ₹0.12 (Got: ${res1.cost_inr})`);
  assert(!!res1.message_id?.startsWith('wamid.'), `WhatsApp Message ID generated (${res1.message_id})`);

  // Test 2: WhatsApp Failure -> DLT SMS Fallback Cascade
  console.log('\n--- TEST 2: WhatsApp Failure -> DLT SMS Fallback Cascade ---');
  const waProvider = engine.getWhatsAppProvider();
  waProvider.simulateFailureForPhones.add('+919832112233');

  const res2 = await engine.dispatchWithCascade(testPayload);
  assert(res2.success, 'Dispatch must succeed via SMS fallback');
  assert(res2.primary_channel === 'whatsapp', 'Primary intended channel was WhatsApp');
  assert(res2.actual_channel === 'sms', 'Actual delivered channel is SMS');
  assert(res2.fallback_triggered, 'Fallback flag is true');
  assert(res2.cost_inr === 0.15, `SMS cost estimate is ₹0.15 (Got: ${res2.cost_inr})`);
  assert(!!res2.message_id?.startsWith('sms_'), `SMS Message ID generated (${res2.message_id})`);
  assert(res2.rendered_message.startsWith('MMBOOK:'), 'Delivered text uses TRAI DLT SMS header MMBOOK');

  // Test 3: Total Failure when both WhatsApp and SMS fail
  console.log('\n--- TEST 3: Total Failure Cascade Handling ---');
  const smsProvider = engine.getSmsProvider();
  smsProvider.simulateFailureForPhones.add('+919832112233');

  const res3 = await engine.dispatchWithCascade(testPayload);
  assert(!res3.success, 'Dispatch fails when both WhatsApp and SMS fail');
  assert(res3.fallback_triggered, 'Fallback was attempted');
  assert(!!res3.error?.includes('ব্যর্থতা'), 'Contains descriptive failure error message');

  // Reset simulated failure
  waProvider.simulateFailureForPhones.clear();
  smsProvider.simulateFailureForPhones.clear();

  // Test 4: withRetry function
  console.log('\n--- TEST 4: Exponential Backoff Retry Logic ---');
  let attemptCount = 0;
  const flakeyFn = async () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw new Error('Temporary 503 Service Unavailable');
    }
    return 'SUCCESS_AFTER_RETRY';
  };

  const retryResult = await withRetry(flakeyFn, 3, 50);
  assert(retryResult === 'SUCCESS_AFTER_RETRY', 'withRetry successfully recovered on 3rd attempt');
  assert(attemptCount === 3, 'Took exactly 3 attempts');

  // Test 5: Rate Limiting
  console.log('\n--- TEST 5: Rate Limiting Protection ---');
  const floodPhone = '+919832999888';
  rateLimiter.reset(floodPhone);

  const floodPayload: NotificationPayload = {
    ...testPayload,
    phone_number: floodPhone,
  };

  let successCount = 0;
  let rateLimited = false;

  for (let i = 0; i < 7; i++) {
    const res = await engine.dispatchWithCascade(floodPayload);
    if (res.success) {
      successCount++;
    } else if (res.error?.includes('রেট লিমিট')) {
      rateLimited = true;
    }
  }

  assert(successCount === 5, `Allowed exactly 5 messages before rate limiting (Allowed: ${successCount})`);
  assert(rateLimited, '6th message was successfully blocked by rate limiter');

  console.log('\n🎉 ALL TASK 3 TESTS PASSED SUCCESSFULLY! (100% Cascade Engine Working)');
}

runTask3Tests().catch((err) => {
  console.error('Fatal error running Task 3 test:', err);
  process.exit(1);
});
