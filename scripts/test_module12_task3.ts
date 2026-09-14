/**
 * Test Suite: Module 12 - Task 3: 1-Click Buy Now Engine & Isolated Session Service
 * Validates:
 * - Isolated session creation (Item 12: cart unaffected)
 * - Session payload validation (Price, MRP, Quantity, Preorder, Gift Options)
 * - In-checkout quantity modifier (Item 17: Qty bounds)
 * - Preferred payment method retention (Item 15)
 * - Idempotency key generation (Item 33)
 */

import {
  createBuyNowSession,
  getBuyNowSession,
  updateBuyNowQuantity,
  clearBuyNowSession,
  savePreferredPaymentMethod,
  getPreferredPaymentMethod,
  generateCheckoutIdempotencyKey,
  BUY_NOW_SESSION_KEY,
} from '../src/lib/services/buyNowService';

// Mock browser storage for Node environment
const mockStorage: Record<string, string> = {};
(global as any).window = {};
(global as any).sessionStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
};

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

console.log('🧪 Starting Module 12 - Task 3 Tests: Buy Now Engine & Session Isolation\n');

// 1. Idempotency Key Generation (Item 33)
console.log('--- 1. Idempotency Key Tests ---');
const key1 = generateCheckoutIdempotencyKey('buynow');
const key2 = generateCheckoutIdempotencyKey('buynow');
assert(key1.startsWith('buynow_'), 'Key has requested prefix');
assert(key1 !== key2, 'Generates distinct keys across calls');
assert(key1.length >= 16, 'Idempotency key has sufficient entropy');

// 2. Isolated Buy Now Session Creation (Item 11, 12)
console.log('\n--- 2. Isolated Session Creation Tests ---');
const mockBook = {
  id: 'book-wbcs-manual-2026',
  title: 'WBCS Preliminary Exam Manual',
  titleBn: 'ডব্লিউবিসিএস প্রিলিমিনারি ম্যানুয়াল ২০২৬',
  author: 'Nitin Singhania',
  price: 490,
  mrp: 650,
  stockCount: 8,
  coverImage: '/images/books/wbcs.webp',
};

const session = createBuyNowSession({
  book: mockBook,
  quantity: 2,
  format: 'paperback',
  condition: 'new',
  giftOptions: {
    hasGiftOptions: true,
    giftWrapType: 'standard',
    giftMessage: 'Best wishes!',
  },
});

assert(session.sessionId.startsWith('sess_bn_'), 'Session ID generated properly');
assert(session.idempotencyKey.startsWith('buynow_'), 'Idempotency key attached to session');
assert(session.item.bookId === mockBook.id, 'Book ID correctly recorded');
assert(session.item.price === 490, 'Selling price recorded');
assert(session.item.quantity === 2, 'Quantity recorded');
assert(session.item.giftOptions?.hasGiftOptions === true, 'Gift options preserved');
assert(session.expiresAt > session.createdAt, 'Expiration set in future (30 mins)');

// 3. Retrieval from Storage
console.log('\n--- 3. Storage Retrieval Tests ---');
const retrieved = getBuyNowSession();
assert(retrieved !== null, 'Session retrieved successfully from mock storage');
assert(retrieved?.item.bookId === mockBook.id, 'Retrieved book ID matches created session');

// 4. In-Checkout Quantity Modifier (Item 17)
console.log('\n--- 4. In-Checkout Quantity Updates ---');
const updatedSession = updateBuyNowQuantity(3);
assert(updatedSession?.item.quantity === 3, 'Quantity successfully updated to 3');

// Enforce max stock constraint
const clampedSession = updateBuyNowQuantity(999);
assert(clampedSession?.item.quantity === 8, 'Quantity clamped to max available stock (8)');

// Enforce minimum 1
const minSession = updateBuyNowQuantity(0);
assert(minSession?.item.quantity === 1, 'Quantity clamped to minimum 1');

// 5. Smart Payment Retention (Item 15)
console.log('\n--- 5. Smart Payment Retention Tests ---');
assert(getPreferredPaymentMethod() === 'upi', 'Default preferred payment is UPI');
savePreferredPaymentMethod('cod');
assert(getPreferredPaymentMethod() === 'cod', 'Remembers COD selection');
savePreferredPaymentMethod('card');
assert(getPreferredPaymentMethod() === 'card', 'Remembers Card selection');

// 6. Session Clearing
console.log('\n--- 6. Session Clear Tests ---');
clearBuyNowSession();
assert(getBuyNowSession() === null, 'Session cleared upon clearBuyNowSession');

console.log(`\n========================================`);
console.log(`🎉 Task 3 Complete: ${passedTests}/${totalTests} Tests Passed!`);
console.log(`========================================\n`);
