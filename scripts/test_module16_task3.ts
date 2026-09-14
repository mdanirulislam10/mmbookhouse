/**
 * Test Suite: Module 16 - Task 3: 3PL Logistics Adapter & Webhook Normalizer
 * Run with: npx tsx scripts/test_module16_task3.ts
 */

import crypto from 'crypto';
import {
  getCarrierTrackingUrl,
  verifyCourierWebhookSignature,
  normalizeCourierStatus,
  webhookIdempotency,
  buildTrackingMilestone,
} from '../src/lib/services/logisticsAdapter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 16 - Task 3 Test Suite: 3PL Logistics Adapter & Normalizer...\n');

// 1. External tracking URLs
const urlDelhivery = getCarrierTrackingUrl('delhivery', 'DEL12345678');
assert(urlDelhivery === 'https://www.delhivery.com/track/package/DEL12345678', 'Delhivery URL format');

const urlShiprocket = getCarrierTrackingUrl('shiprocket', 'SR987654321');
assert(urlShiprocket === 'https://shiprocket.co/tracking/SR987654321', 'Shiprocket URL format');

const urlIndiaPost = getCarrierTrackingUrl('india_post', 'EW123456789IN');
assert(urlIndiaPost.includes('consignmentNo=EW123456789IN'), 'India Post consignment URL format');

const urlLocal = getCarrierTrackingUrl('local_malda', 'MMB-1002', 'order-1002');
assert(urlLocal === '/account/orders/order-1002', 'Local rider URL points to internal order view');
console.log('✅ Test 1 Passed: Carrier deep-link tracking URLs generated correctly.');

// 2. HMAC-SHA256 Signature Verification (Item 14)
const secret = 'test_secret_malda_key_123';
const rawPayload = JSON.stringify({ awb: 'DEL999', status: 'Delivered', timestamp: 1726000000 });
const validSignature = crypto.createHmac('sha256', secret).update(rawPayload, 'utf8').digest('hex');

assert(verifyCourierWebhookSignature(rawPayload, validSignature, secret), 'Valid signature should verify');
assert(verifyCourierWebhookSignature(rawPayload, `sha256=${validSignature}`, secret), 'Signature with sha256= prefix should verify');
assert(!verifyCourierWebhookSignature(rawPayload, 'invalid_signature_hex_code', secret), 'Invalid signature should fail');
assert(!verifyCourierWebhookSignature('tampered payload', validSignature, secret), 'Tampered payload should fail');
console.log('✅ Test 2 Passed: HMAC-SHA256 signature verification validates authenticity securely.');

// 3. Status normalization: Delhivery
const d1 = normalizeCourierStatus('delhivery', 'Delivered to Consignee');
assert(d1.normalizedStatus === 'delivered', 'Delhivery Delivered mapping');

const d2 = normalizeCourierStatus('delhivery', 'Out for Delivery');
assert(d2.normalizedStatus === 'out_for_delivery', 'Delhivery OFD mapping');

const d3 = normalizeCourierStatus('delhivery', 'Delivery Attempted - Customer Phone Switched Off');
assert(d3.normalizedStatus === 'delivery_attempted', 'Delhivery Attempted mapping');

const d4 = normalizeCourierStatus('delhivery', 'Delayed Due To Severe Weather');
assert(d4.normalizedStatus === 'delayed', 'Delhivery Delay mapping');

const d5 = normalizeCourierStatus('delhivery', 'RTO Initiated');
assert(d5.normalizedStatus === 'rto_initiated', 'Delhivery RTO mapping');

const d6 = normalizeCourierStatus('delhivery', 'Package Lost In Transit');
assert(d6.normalizedStatus === 'lost_in_transit', 'Delhivery Lost mapping');
console.log('✅ Test 3 Passed: Delhivery carrier statuses accurately normalized.');

// 4. Status normalization: Shiprocket
const sr1 = normalizeCourierStatus('shiprocket', 'DELIVERED');
assert(sr1.normalizedStatus === 'delivered', 'Shiprocket DELIVERED mapping');

const sr2 = normalizeCourierStatus('shiprocket', 'OUT FOR DELIVERY');
assert(sr2.normalizedStatus === 'out_for_delivery', 'Shiprocket OFD mapping');

const sr3 = normalizeCourierStatus('shiprocket', 'UNDELIVERED');
assert(sr3.normalizedStatus === 'delivery_attempted', 'Shiprocket UNDELIVERED mapping');

const sr4 = normalizeCourierStatus('shiprocket', 'IN TRANSIT');
assert(sr4.normalizedStatus === 'shipped', 'Shiprocket IN TRANSIT mapping');
console.log('✅ Test 4 Passed: Shiprocket statuses accurately normalized.');

// 5. Status normalization: India Post
const ip1 = normalizeCourierStatus('india_post', 'Item Delivered to Addressee');
assert(ip1.normalizedStatus === 'delivered', 'India Post Item Delivered mapping');

const ip2 = normalizeCourierStatus('india_post', 'Out for Delivery Malda MDG');
assert(ip2.normalizedStatus === 'out_for_delivery', 'India Post Out for Delivery mapping');

const ip3 = normalizeCourierStatus('india_post', 'Delivery Attempted - Door Locked');
assert(ip3.normalizedStatus === 'delivery_attempted', 'India Post Door Locked mapping');
console.log('✅ Test 5 Passed: India Post consignment statuses accurately normalized.');

// 6. Webhook Idempotency Deduplication (Item 43)
webhookIdempotency.clear();
const awb = 'DEL-IDEMPOTENCY-TEST';
const status = 'OUT_FOR_DELIVERY';
const timestamp = '2026-09-11T10:00:00Z';

assert(!webhookIdempotency.isDuplicate(awb, status, timestamp), 'Initial webhook payload must not be marked duplicate');
assert(webhookIdempotency.isDuplicate(awb, status, timestamp), 'Repeated identical webhook payload MUST be detected as duplicate');
assert(!webhookIdempotency.isDuplicate(awb, 'DELIVERED', timestamp), 'Different status must not be duplicate');
console.log('✅ Test 6 Passed: Webhook idempotency cache prevents duplicate replay storms.');

// 7. Tracking Milestone Builder (Item 16)
const milestone = buildTrackingMilestone({
  carrier: 'delhivery',
  rawStatus: 'Out For Delivery',
  location: 'Malda Hub, Netaji Subhash Road',
  timestamp: '2026-09-11T08:30:00Z',
});
assert(milestone.status === 'out_for_delivery', 'Milestone status is out_for_delivery');
assert(milestone.title === 'Out for Delivery', 'Milestone title is generated');
assert(milestone.location === 'Malda Hub, Netaji Subhash Road', 'Milestone location preserved');
assert(Boolean(milestone.titleBn && milestone.descriptionBn), 'Bilingual milestone details present');
console.log('✅ Test 7 Passed: Tracking milestone events and locations parsed cleanly.');

console.log('\n🎉 ALL MODULE 16 TASK 3 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
