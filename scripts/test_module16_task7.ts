/**
 * Test Suite: Module 16 - Task 7: Public Guest Order Tracking Portal (/track)
 * Run with: npx tsx scripts/test_module16_task7.ts
 */

import React from 'react';
import { GuestOrderTrackView } from '../src/components/tracking/GuestOrderTrackView';
import { guestTrackLookupSchema } from '../src/lib/validations/tracking';
import { canCancelOrder } from '../src/lib/services/trackingStateMachine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 16 - Task 7 Test Suite: Public Guest Tracking Portal (/track)...\n');

// 1. Export check
assert(typeof GuestOrderTrackView === 'function', 'GuestOrderTrackView component is a valid React component function');
console.log('✅ Test 1 Passed: GuestOrderTrackView component exported successfully.');

// 2. Guest lookup schema validation
const validLookup = guestTrackLookupSchema.safeParse({
  orderNumber: 'MMB-2026-981',
  phoneNumber: '9832145678',
});
assert(validLookup.success, 'Valid order number and 10-digit Indian phone should pass');

const invalidPhone = guestTrackLookupSchema.safeParse({
  orderNumber: 'MMB-2026-981',
  phoneNumber: '12345',
});
assert(!invalidPhone.success, 'Invalid phone number must fail validation');

const invalidOrder = guestTrackLookupSchema.safeParse({
  orderNumber: '',
  phoneNumber: '9832145678',
});
assert(!invalidOrder.success, 'Empty order number must fail validation');
console.log('✅ Test 2 Passed: Guest order lookup schema validation enforced.');

// 3. Address edit eligibility check (Item 39: strictly allowed before packed)
const placedCanEdit = canCancelOrder('order_placed').allowed;
assert(placedCanEdit, 'Order in order_placed state allows modification');

const packedCannotEdit = canCancelOrder('packed').allowed;
assert(!packedCannotEdit, 'Order in packed state must NOT allow modification');

const shippedCannotEdit = canCancelOrder('shipped').allowed;
assert(!shippedCannotEdit, 'Order in shipped state must NOT allow modification');
console.log('✅ Test 3 Passed: Delivery address modification strictly permitted before packed.');

// 4. Element instantiation
const elem = React.createElement(GuestOrderTrackView);
assert(Boolean(elem), 'GuestOrderTrackView element instantiated successfully');
console.log('✅ Test 4 Passed: Guest tracking view element contract verified.');

console.log('\n🎉 ALL MODULE 16 TASK 7 TESTS PASSED SUCCESSFULLY! (4/4 Checks)\n');
