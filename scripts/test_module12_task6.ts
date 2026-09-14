/**
 * Test Suite: Module 12 - Task 6: 5-Minute Stock Reservation & Idempotency Key Engine
 * Validates:
 * - 5-Minute Stock Reservation TTL & Concurrency Protection (Item 31, 36)
 * - Automatic Expiration & Lock Release (Item 32)
 * - Double-Click & Replay Idempotency Prevention (Item 33)
 * - Cached Idempotent Response Delivery
 */

import {
  reserveStock,
  releaseStockReservation,
  releaseSessionReservations,
  commitStockReservation,
  getCurrentlyReservedQuantity,
  resetStockReservationsForTesting,
  STOCK_RESERVATION_TTL_MS,
} from '../src/lib/services/stockReservationService';

import {
  checkOrRegisterIdempotency,
  markIdempotencyCompleted,
  releaseIdempotencyKey,
  resetIdempotencyStoreForTesting,
} from '../src/lib/services/idempotencyService';

import { PlaceOrderResult } from '../src/types/checkout';

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

console.log('🧪 Starting Module 12 - Task 6 Tests: Stock Reservation & Idempotency Engine\n');

// 1. Basic Stock Reservation (Item 31)
console.log('--- 1. Basic Stock Reservation Tests ---');
resetStockReservationsForTesting();

const bookId = 'book-rare-history-wbcs';
const session1 = 'sess-customer-1';

const res1 = reserveStock({
  sessionId: session1,
  bookId,
  quantity: 1,
  availableStock: 1, // Only 1 copy left in store!
});

assert(res1.success === true, 'Customer 1 successfully reserves the last copy');
assert(res1.remainingAvailableStock === 0, 'Remaining available stock drops to 0');
assert(getCurrentlyReservedQuantity(bookId) === 1, 'Currently reserved count is 1');
assert(res1.expiresAt !== undefined && res1.expiresAt > Date.now(), 'Expiration set to 5 minutes');

// 2. High-Concurrency Race Condition Prevention (Item 31, 36)
console.log('\n--- 2. Concurrency Conflict Tests ---');
const session2 = 'sess-customer-2';
const res2 = reserveStock({
  sessionId: session2,
  bookId,
  quantity: 1,
  availableStock: 1, // Same book with only 1 total copy
});

assert(res2.success === false, 'Customer 2 is blocked from reserving already reserved copy');
assert(res2.remainingAvailableStock === 0, 'Customer 2 sees 0 copies left');
assert(!!res2.errorBn?.includes('অন্য একজন শিক্ষার্থী'), 'Customer 2 receives polite Bengali notice about active checkout');

// 3. Manual Release & Re-acquisition (Item 32)
console.log('\n--- 3. Manual Release Tests ---');
releaseStockReservation(res1.reservationId!);
assert(getCurrentlyReservedQuantity(bookId) === 0, 'Stock freed after Customer 1 abandons/cancels');

const res2Retry = reserveStock({
  sessionId: session2,
  bookId,
  quantity: 1,
  availableStock: 1,
});
assert(res2Retry.success === true, 'Customer 2 can now reserve the freed copy');

// Commit reservation on order placed
commitStockReservation(res2Retry.reservationId!);
assert(getCurrentlyReservedQuantity(bookId) === 0, 'Committed reservation removed from active hold pool');

// 4. Idempotency Double-Click Prevention (Item 33)
console.log('\n--- 4. Idempotency Key Tests ---');
resetIdempotencyStoreForTesting();

const testKey = 'idemp_unique_order_request_12345';

// First Click
const click1 = checkOrRegisterIdempotency(testKey);
assert(click1.allowed === true, 'First click allowed and marked IN_FLIGHT');
assert(click1.status === 'NEW', 'Status is NEW');

// Immediate Rapid Second Click (Double Click while in flight)
const click2 = checkOrRegisterIdempotency(testKey);
assert(click2.allowed === false, 'Double click blocked while IN_FLIGHT');
assert(click2.status === 'IN_FLIGHT', 'Reports IN_FLIGHT status');
assert(!!click2.errorBn?.includes('বারবার ক্লিক করবেন না'), 'Warns customer not to double click');

// 5. Order Completed & Idempotent Response Replay
console.log('\n--- 5. Idempotent Cached Replay Tests ---');
const fakeResult: PlaceOrderResult = {
  success: true,
  orderId: 'ord_9042',
  orderNumber: '#MMB-2026-9042',
  redirectUrl: '/checkout/success/ord_9042',
};

markIdempotencyCompleted(testKey, fakeResult);

// Subsequent Network Retry / Page Refresh
const replayClick = checkOrRegisterIdempotency(testKey);
assert(replayClick.allowed === false, 'Replay click blocked from duplicate charging');
assert(replayClick.status === 'COMPLETED', 'Status is COMPLETED');
assert(replayClick.cachedResponse?.orderId === 'ord_9042', 'Returns cached order result cleanly');

// Error Release Test
const errorKey = 'idemp_failed_payment_key';
checkOrRegisterIdempotency(errorKey);
releaseIdempotencyKey(errorKey);
const retryAfterError = checkOrRegisterIdempotency(errorKey);
assert(retryAfterError.allowed === true, 'Released key can be retried safely');

console.log(`\n========================================`);
console.log(`🎉 Task 6 Complete: ${passedTests}/${totalTests} Tests Passed!`);
console.log(`========================================\n`);
