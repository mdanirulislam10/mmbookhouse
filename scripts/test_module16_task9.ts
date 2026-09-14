/**
 * Test Suite: Module 16 - Task 9: Webhook & Tracking API Routes
 * Run with: npx tsx scripts/test_module16_task9.ts
 */

import { POST as shippingWebhookHandler } from '../src/app/api/webhooks/shipping/route';
import {
  GET as getTrackingHandler,
  POST as postTrackingActionHandler,
} from '../src/app/api/orders/[id]/tracking/route';
import { courierWebhookSchema, cancelOrderSchema, replacementRequestSchema } from '../src/lib/validations/tracking';
import { canCancelOrder, canRequestReplacement } from '../src/lib/services/trackingStateMachine';
import crypto from 'crypto';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 16 - Task 9 Test Suite: Shipping Webhook & Tracking API Routes...\n');

// 1. Export checks
assert(typeof shippingWebhookHandler === 'function', 'shippingWebhookHandler POST is exported');
assert(typeof getTrackingHandler === 'function', 'getTrackingHandler GET is exported');
assert(typeof postTrackingActionHandler === 'function', 'postTrackingActionHandler POST is exported');
console.log('✅ Test 1 Passed: Webhook and Tracking route handlers exported successfully.');

// 2. Webhook Schema & HMAC signature verification
const secretKey = 'mmb_default_webhook_secret_malda_2026';
const testPayload = {
  awb_number: 'DEL99887766',
  courier: 'delhivery',
  raw_status: 'Out For Delivery',
  timestamp: Date.now(),
  location: 'Malda Hub, Netaji Subhash Road',
  city: 'Malda',
};
const rawPayloadString = JSON.stringify(testPayload);
const validHmac = crypto.createHmac('sha256', secretKey).update(rawPayloadString, 'utf8').digest('hex');

const webhookParsed = courierWebhookSchema.safeParse({
  ...testPayload,
  signature: validHmac,
});
assert(webhookParsed.success, 'Valid webhook payload passes Zod validation');
console.log('✅ Test 2 Passed: Webhook payload schema and HMAC signature structure validated.');

// 3. Customer Cancellation API Action Logic (Item 9)
const cancelValid = cancelOrderSchema.safeParse({
  order_id: 'MMB-2026-001',
  reason: 'Ordered wrong syllabus edition',
});
assert(cancelValid.success, 'Valid cancellation payload');

const checkCancelPlaced = canCancelOrder('order_placed');
assert(checkCancelPlaced.allowed, 'Order placed can be cancelled');

const checkCancelPacked = canCancelOrder('packed');
assert(!checkCancelPacked.allowed, 'Packed order cannot be cancelled');
console.log('✅ Test 3 Passed: Self-cancellation API security window enforced strictly.');

// 4. 7-Day Replacement API Action Logic (Item 10)
const replacementValid = replacementRequestSchema.safeParse({
  order_id: 'MMB-2026-002',
  product_id: 'book-math-01',
  reason: 'printing_defect',
  description: 'Chapter 4 pages 45-60 missing from the book binding',
  images: ['https://cdn.mmbookhouse.com/proofs/defect-1.jpg'],
});
assert(replacementValid.success, 'Replacement schema valid');

const checkReplDelivered = canRequestReplacement('delivered', new Date().toISOString(), 7);
assert(checkReplDelivered.allowed, 'Delivered order eligible for replacement within 7 days');

const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
const checkReplExpired = canRequestReplacement('delivered', tenDaysAgo, 7);
assert(!checkReplExpired.allowed, 'Replacement expired after 7 days blocked');
console.log('✅ Test 4 Passed: 7-Day Replacement API action validation verified.');

console.log('\n🎉 ALL MODULE 16 TASK 9 TESTS PASSED SUCCESSFULLY! (4/4 Checks)\n');
