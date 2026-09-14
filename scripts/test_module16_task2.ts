/**
 * Test Suite: Module 16 - Task 2: Finite State Machine & Transition Validator
 * Run with: npx tsx scripts/test_module16_task2.ts
 */

import {
  validateStatusTransition,
  canCancelOrder,
  canRequestReplacement,
  isTerminalState,
  getPrimaryPhaseProgress,
  validateStorePickupOtp,
  generateStorePickupQrPayload,
} from '../src/lib/services/trackingStateMachine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 16 - Task 2 Test Suite: FSM & State Transition Validator...\n');

// 1. Legal standard transitions
const t1 = validateStatusTransition('order_placed', 'packed', 'seller');
assert(t1.valid, 'order_placed -> packed should be legal for seller');

const t2 = validateStatusTransition('packed', 'shipped', 'seller');
assert(t2.valid, 'packed -> shipped should be legal for seller');

const t3 = validateStatusTransition('shipped', 'out_for_delivery', 'courier');
assert(t3.valid, 'shipped -> out_for_delivery should be legal for courier');

const t4 = validateStatusTransition('out_for_delivery', 'delivered', 'courier');
assert(t4.valid, 'out_for_delivery -> delivered should be legal for courier');
console.log('✅ Test 1 Passed: Standard forward lifecycle transitions are valid.');

// 2. Illegal jumps
const tIllegal1 = validateStatusTransition('delivered', 'packed', 'seller');
assert(!tIllegal1.valid, 'delivered -> packed must be rejected');

const tIllegal2 = validateStatusTransition('out_for_delivery', 'order_placed', 'seller');
assert(!tIllegal2.valid, 'out_for_delivery -> order_placed must be rejected');

const tIllegal3 = validateStatusTransition('cancelled_by_user', 'shipped', 'seller');
assert(!tIllegal3.valid, 'cancelled_by_user -> shipped must be rejected');
console.log('✅ Test 2 Passed: Illegal jumps and backwards leaps are strictly rejected.');

// 3. Terminal state checks
assert(isTerminalState('delivered'), 'delivered is terminal');
assert(isTerminalState('cancelled_by_user'), 'cancelled_by_user is terminal');
assert(isTerminalState('cancelled_by_seller'), 'cancelled_by_seller is terminal');
assert(isTerminalState('rto_delivered'), 'rto_delivered is terminal');
assert(isTerminalState('lost_in_transit'), 'lost_in_transit is terminal');
assert(isTerminalState('pickup_completed'), 'pickup_completed is terminal');
assert(!isTerminalState('shipped'), 'shipped is NOT terminal');
assert(!isTerminalState('order_placed'), 'order_placed is NOT terminal');
console.log('✅ Test 3 Passed: Terminal states correctly identified and blocked from further mutation.');

// 4. Customer Self-Cancellation window (Strictly before packed)
const cancelPlaced = canCancelOrder('order_placed');
assert(cancelPlaced.allowed, 'Customer should be allowed to cancel when order_placed');

const cancelPickupConfirmed = canCancelOrder('pickup_confirmed');
assert(cancelPickupConfirmed.allowed, 'Customer should be allowed to cancel when pickup_confirmed');

const cancelPacked = canCancelOrder('packed');
assert(!cancelPacked.allowed, 'Customer must NOT be allowed to cancel when packed');
assert(Boolean(cancelPacked.reason), 'Cancellation block must provide user-friendly reason');

const cancelShipped = canCancelOrder('shipped');
assert(!cancelShipped.allowed, 'Customer must NOT be allowed to cancel when shipped');

const cancelDelivered = canCancelOrder('delivered');
assert(!cancelDelivered.allowed, 'Customer must NOT be allowed to cancel when delivered');
console.log('✅ Test 4 Passed: Customer self-cancellation enforced strictly before packed status.');

// 5. Role permissions
const custCancelPlaced = validateStatusTransition('order_placed', 'cancelled_by_user', 'customer');
assert(custCancelPlaced.valid, 'Customer can cancel in order_placed');

const custCancelPacked = validateStatusTransition('packed', 'cancelled_by_user', 'customer');
assert(!custCancelPacked.valid, 'Customer cannot cancel once order is packed');

const courierIllegal = validateStatusTransition('packed', 'cancelled_by_seller', 'courier');
assert(!courierIllegal.valid, 'Courier cannot set seller cancellation');
console.log('✅ Test 5 Passed: Role-based transition authorization successfully validated.');

// 6. 7-Day Replacement Policy (Item 10)
const notDelivered = canRequestReplacement('shipped');
assert(!notDelivered.allowed, 'Replacement not allowed if not delivered');

const now = new Date();
const deliveredToday = canRequestReplacement('delivered', now.toISOString(), 7);
assert(deliveredToday.allowed, 'Replacement should be allowed for order delivered today');
assert((deliveredToday.daysRemaining ?? 0) >= 6, 'Days remaining should be ~7 days');

const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
const delivered3Days = canRequestReplacement('delivered', threeDaysAgo.toISOString(), 7);
assert(delivered3Days.allowed, 'Replacement allowed within 7 days');
assert(delivered3Days.daysRemaining === 4, 'Should have exactly 4 days remaining');

const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
const delivered10Days = canRequestReplacement('delivered', tenDaysAgo.toISOString(), 7);
assert(!delivered10Days.allowed, 'Replacement must be blocked after 7 days');
assert(delivered10Days.daysRemaining === 0, 'Remaining days must be 0 after expiry');
console.log('✅ Test 6 Passed: 7-Day replacement window logic enforces deadline accurately.');

// 7. Store Pickup workflow & OTP/QR
const pickupP1 = validateStatusTransition('pickup_confirmed', 'pickup_ready', 'seller');
assert(pickupP1.valid, 'Store pickup confirmed -> ready is legal');

const pickupP2 = validateStatusTransition('pickup_ready', 'pickup_completed', 'seller');
assert(pickupP2.valid, 'Store pickup ready -> completed is legal');

const otpCorrect = validateStorePickupOtp('4821', '4821');
assert(otpCorrect.success, 'Correct pickup OTP should pass');

// Accepts Bengali numerals
const otpBengali = validateStorePickupOtp('4821', '৪৮২১');
assert(otpBengali.success, 'Bengali digits in pickup OTP should pass');

const otpWrong = validateStorePickupOtp('4821', '9999');
assert(!otpWrong.success, 'Wrong pickup OTP should fail');

const qr = generateStorePickupQrPayload('MMB-98765', '4821');
assert(qr.includes('MMB_STORE_PICKUP') && qr.includes('MMB-98765') && qr.includes('4821'), 'QR payload formatted correctly');

const stepperProgress = getPrimaryPhaseProgress('out_for_delivery');
assert(stepperProgress.phaseIndex === 3 && stepperProgress.percent === 85, 'Stepper maps progress correctly');
console.log('✅ Test 7 Passed: Store pickup flow, 4-digit counter OTP & QR payload verified.');

console.log('\n🎉 ALL MODULE 16 TASK 2 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
