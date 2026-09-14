/**
 * Test Suite: Module 12 - Task 4: Delivery Options, Speed & Dynamic SLA Engine
 * Validates:
 * - Bengali Number and Date Formatter (Item 24)
 * - Serviceability & SLA Calculation for Malda Local vs Remote pincodes (Item 23)
 * - Cutoff Logic (Before 4 PM vs After 4 PM)
 * - Shipping Fee Adjustments & Store Pickup Waiver (Item 22)
 * - Component Export Check
 */

import {
  toBengaliNumber,
  formatBengaliDate,
  getAvailableDeliverySpeeds,
  calculateSpeedAdjustment,
} from '../src/lib/services/deliverySpeedService';

import * as checkoutExports from '../src/components/checkout';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ Passed: ${message}`);
  } else {
    console.error(`  ❌ Failed: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
}

console.log('🧪 Starting Module 12 - Task 4 Tests: Delivery Speed & SLA Engine\n');

// 1. Bengali Date Formatting Tests (Item 24)
console.log('--- 1. Bengali Date Formatter Tests ---');
assert(toBengaliNumber(12) === '১২', 'Converts 12 to ১২');
assert(toBengaliNumber('732101') === '৭৩২১০১', 'Converts pincode 732101 to ৭৩২১০১');

const sampleDate = new Date('2026-03-12T10:00:00Z');
const bnDate = formatBengaliDate(sampleDate);
assert(bnDate.includes('১২'), 'Bengali date includes day number in Bengali script');
assert(bnDate.includes('মার্চ'), 'Bengali date includes Bengali month name');

// 2. Malda Town Local Serviceability & Cutoff
console.log('\n--- 2. Malda Local Speed & Cutoff Tests ---');
const maldaPincode = '732101'; // Malda Town
const morningTime = new Date('2026-03-12T11:00:00'); // 11 AM (Before 4 PM cutoff)

const morningSpeeds = getAvailableDeliverySpeeds(maldaPincode, morningTime);
assert(morningSpeeds.length === 3, 'Returns 3 delivery options');

const expressMorning = morningSpeeds.find((s) => s.id === 'express_sameday');
assert(expressMorning !== undefined, 'Express option present');
assert(expressMorning?.isAvailableForPincode === true, 'Express is available in Malda Town (732101)');
assert(!!expressMorning?.guaranteedDeliveryDateBn.includes('আজ সন্ধ্যা'), 'Before 4 PM promises delivery today');

// Test Evening Cutoff (After 4 PM)
const eveningTime = new Date('2026-03-12T17:30:00'); // 5:30 PM (After 4 PM cutoff)
const eveningSpeeds = getAvailableDeliverySpeeds(maldaPincode, eveningTime);
const expressEvening = eveningSpeeds.find((s) => s.id === 'express_sameday');
assert(!!expressEvening?.guaranteedDeliveryDateBn.includes('আগামীকাল'), 'After 4 PM shifts promise to tomorrow');

// 3. Remote / Non-Malda Pincode Serviceability
console.log('\n--- 3. Remote Pincode Tests ---');
const kolkataPincode = '700001';
const remoteSpeeds = getAvailableDeliverySpeeds(kolkataPincode, morningTime);
const expressRemote = remoteSpeeds.find((s) => s.id === 'express_sameday');
assert(expressRemote?.isAvailableForPincode === false, 'Same-day express is disabled outside Malda Town');

const standardRemote = remoteSpeeds.find((s) => s.id === 'standard');
assert(standardRemote?.isAvailableForPincode === true, 'Standard delivery remains available everywhere');

// 4. Store Pickup Zero-Shipping Waiver
console.log('\n--- 4. Store Pickup & Fee Adjustments ---');
const storePickup = morningSpeeds.find((s) => s.id === 'store_pickup');
assert(storePickup?.isAvailableForPincode === true, 'Store pickup is available');
assert(storePickup?.fee === 0, 'Store pickup additional fee is ₹0');

// Calculate Adjustments with base shipping = ₹45
const standardAdj = calculateSpeedAdjustment('standard', 45);
assert(standardAdj.finalShippingFee === 45, 'Standard maintains base shipping fee of ₹45');
assert(standardAdj.speedFee === 0, 'Standard has ₹0 speed surcharge');

const expressAdj = calculateSpeedAdjustment('express_sameday', 45);
assert(expressAdj.finalShippingFee === 70, 'Express adds ₹25 to base shipping (45 + 25 = 70)');
assert(expressAdj.speedFee === 25, 'Express speed surcharge is ₹25');

const pickupAdj = calculateSpeedAdjustment('store_pickup', 45);
assert(pickupAdj.finalShippingFee === 0, 'Store pickup waives base shipping fee to ₹0 (FREE)');
assert(pickupAdj.isPickup === true, 'isPickup flagged as true');

// 5. Component Export Check
console.log('\n--- 5. Component Export Check ---');
assert(typeof checkoutExports.DeliverySpeedSelector === 'function', 'DeliverySpeedSelector exported as React component');

console.log(`\n========================================`);
console.log(`🎉 Task 4 Complete: ${passedTests}/${totalTests} Tests Passed!`);
console.log(`========================================\n`);
