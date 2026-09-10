/**
 * MM Book House - Module 10 Task 42 Verification Script
 * Tests:
 * 1. Guest ID generation & validation (generateGuestId, isValidGuestId)
 * 2. Strong schema validation for cart data & items
 * 3. Storage expiration policy (30-day TTL)
 * 4. Corrupt payload recovery (corrupt JSON, malformed schema, partial salvage)
 * 5. Storage quota handling (QuotaExceededError recovery & in-memory fallback)
 * 6. Integration with useCartStore (ensureGuestId, resilient adapter)
 */

// Mock browser globals for Node.js environment
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}

const memStore = new Map<string, string>();
const mockStorage = {
  getItem: (k: string) => memStore.get(k) || null,
  setItem: (k: string, v: string) => memStore.set(k, v),
  removeItem: (k: string) => memStore.delete(k),
  clear: () => memStore.clear(),
  key: (i: number) => Array.from(memStore.keys())[i] || null,
  get length() {
    return memStore.size;
  },
};

(globalThis as any).localStorage = mockStorage;
if (typeof (globalThis as any).window !== 'undefined') {
  (globalThis as any).window.localStorage = mockStorage;
}

import {
  guestCartService,
  GUEST_CART_TTL_MS,
  StoredGuestCartPayload,
} from '../src/lib/cart/guestCartService';
import { useCartStore } from '../src/hooks/useCartStore';
import { CartItem } from '../src/types/cart';

console.log('================================================================');
console.log('🏛️ M.M Book House Malda - Module 10 Task 42 Verification');
console.log('Testing: Guest User Structured Storage & Schema (guestCartService)');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log('  ✓ PASS: ' + message);
    passed++;
  } else {
    console.error('  ✗ FAIL: ' + message);
    failed++;
  }
}

async function runTests() {
  // Clear mock storage
  mockStorage.clear();

  // ==========================================
  // Test Suite 1: Guest ID Generator & Validator
  // ==========================================
  console.log('🔹 [Test Suite 1] Guest ID Generation & Validation');
  const guestId1 = guestCartService.generateGuestId();
  const guestId2 = guestCartService.generateGuestId();

  assert(guestId1.startsWith('guest_'), 'Generated ID has "guest_" prefix');
  assert(guestId1 !== guestId2, 'Subsequent generated guest IDs are unique');
  assert(guestCartService.isValidGuestId(guestId1), 'Freshly generated guest ID passes validation');
  assert(guestCartService.isValidGuestId(guestId2), 'Second generated guest ID passes validation');

  // Negative validation tests
  assert(!guestCartService.isValidGuestId(null), 'Rejects null');
  assert(!guestCartService.isValidGuestId(undefined), 'Rejects undefined');
  assert(!guestCartService.isValidGuestId(12345), 'Rejects number');
  assert(!guestCartService.isValidGuestId('user_12345'), 'Rejects wrong prefix');
  assert(!guestCartService.isValidGuestId('guest_'), 'Rejects prefix only');
  assert(!guestCartService.isValidGuestId('guest_abc'), 'Rejects incomplete format');
  assert(!guestCartService.isValidGuestId('guest_xyz!@#_12345678'), 'Rejects non-base36 timestamp');
  assert(!guestCartService.isValidGuestId('guest_0_12345678'), 'Rejects timestamp <= 0');

  // Far future timestamp (e.g. year 2099)
  const farFutureTs = (Date.now() + 1000 * 86400000).toString(36);
  assert(!guestCartService.isValidGuestId(`guest_${farFutureTs}_abcdef123456`), 'Rejects far future timestamp');

  // Timestamp before year 2020 (e.g. timestamp 1000)
  const oldTs = (1000).toString(36);
  assert(!guestCartService.isValidGuestId(`guest_${oldTs}_abcdef123456`), 'Rejects timestamp before year 2020');

  // ==========================================
  // Test Suite 2: Strong Schema Validation
  // ==========================================
  console.log('\n🔹 [Test Suite 2] Strong Schema Validation for Cart Data');
  const validItem: StoredGuestCartPayload['items'][number] = {
    id: 'cart-item-1',
    bookId: 'book-wbcs-manual-2026',
    title: 'WBCS Preliminary Manual 2026',
    titleBn: 'ডাব্লুবিসিএস প্রিলিমিনারি ম্যানুয়াল ২০২৬',
    author: 'ড. অশোক কুমার ঘোষ',
    price: 650,
    mrp: 850,
    quantity: 2,
    maxQuantity: 10,
    inStock: true,
    isSelected: true,
  };

  const validPayload: StoredGuestCartPayload = {
    version: 1,
    guestId: guestId1,
    items: [validItem],
    savedItems: [],
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 5000,
  };

  const parsedValid = guestCartService.validateGuestCartPayload(validPayload);
  assert(parsedValid !== null, 'Valid payload passes schema validation');
  assert(parsedValid?.items.length === 1, 'Validated payload preserves items array');
  assert(parsedValid?.items[0].price === 650, 'Validated payload preserves item attributes');

  // Schema rejections
  const negativePricePayload = {
    ...validPayload,
    items: [{ ...validItem, price: -50 }],
  };
  assert(guestCartService.validateGuestCartPayload(negativePricePayload) === null, 'Rejects negative price');

  const zeroQuantityPayload = {
    ...validPayload,
    items: [{ ...validItem, quantity: 0 }],
  };
  assert(guestCartService.validateGuestCartPayload(zeroQuantityPayload) === null, 'Rejects quantity < 1');

  const excessiveQuantityPayload = {
    ...validPayload,
    items: [{ ...validItem, quantity: 500 }],
  };
  assert(guestCartService.validateGuestCartPayload(excessiveQuantityPayload) === null, 'Rejects quantity exceeding 100');

  const missingTitlePayload = {
    ...validPayload,
    items: [{ ...validItem, title: '' }],
  };
  assert(guestCartService.validateGuestCartPayload(missingTitlePayload) === null, 'Rejects missing title');

  // ==========================================
  // Test Suite 3: 30-Day TTL Expiration Policy
  // ==========================================
  console.log('\n🔹 [Test Suite 3] 30-Day Storage Expiration Policy');
  const freshCart = {
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days old
  };
  assert(guestCartService.isGuestCartExpired(freshCart) === false, '5-day old cart is NOT expired');

  const nearLimitCart = {
    updatedAt: Date.now() - 29 * 24 * 60 * 60 * 1000, // 29 days old
  };
  assert(guestCartService.isGuestCartExpired(nearLimitCart) === false, '29-day old cart is NOT expired');

  const expiredCart = {
    updatedAt: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days old
  };
  assert(guestCartService.isGuestCartExpired(expiredCart) === true, '31-day old cart IS expired');

  const missingTimestampCart = {
    updatedAt: undefined,
    createdAt: undefined,
  };
  assert(guestCartService.isGuestCartExpired(missingTimestampCart) === true, 'Cart missing timestamps is marked expired');

  // Test pruneIfExpired on storage
  const expiredKey = 'mm-test-expired-cart';
  const expiredPayload: StoredGuestCartPayload = {
    version: 1,
    guestId: guestId1,
    items: [validItem],
    savedItems: [],
    createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
  };
  mockStorage.setItem(expiredKey, JSON.stringify(expiredPayload));

  const loadedAfterExpire = guestCartService.loadGuestCart(expiredKey);
  assert(loadedAfterExpire.items.length === 0, 'Expired cart was pruned upon loading');
  assert(guestCartService.isValidGuestId(loadedAfterExpire.guestId), 'Pruned cart received fresh valid guestId');
  assert(loadedAfterExpire.guestId !== guestId1, 'Fresh guestId generated for expired cart');

  // ==========================================
  // Test Suite 4: Corrupt Payload Recovery
  // ==========================================
  console.log('\n🔹 [Test Suite 4] Corrupt Payload Recovery');
  const corruptKey = 'mm-test-corrupt-cart';

  // Case 4A: Malformed JSON string
  mockStorage.setItem(corruptKey, '{ broken JSON string %$#@');
  const recoveredFromBadJson = guestCartService.loadGuestCart(corruptKey);
  assert(recoveredFromBadJson !== null, 'Bad JSON did not throw exception');
  assert(guestCartService.isValidGuestId(recoveredFromBadJson.guestId), 'Recovered fresh cart has valid guestId');
  assert(recoveredFromBadJson.items.length === 0, 'Recovered fresh cart has clean empty items');

  // Case 4B: Schema corruption (wrong types: items is string)
  mockStorage.setItem(
    corruptKey,
    JSON.stringify({
      guestId: 'guest_test',
      items: 'This should be an array but is a string',
    })
  );
  const recoveredFromBadSchema = guestCartService.loadGuestCart(corruptKey);
  assert(Array.isArray(recoveredFromBadSchema.items), 'Bad schema recovered items as valid array');

  // Case 4C: Partial salvage (1 valid item, 1 corrupt item)
  const mixedData = {
    guestId: guestId1,
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 500,
    items: [
      validItem, // Valid item
      { bad: 'data', title: 123 }, // Corrupt item missing bookId, price, etc.
    ],
    savedItems: [],
  };
  const salvaged = guestCartService.salvageCorruptedPayload(mixedData);
  assert(salvaged.items.length === 1, 'Salvaged exactly 1 valid item from mixed array');
  assert(salvaged.items[0].id === validItem.id, 'Preserved the valid item ID');
  assert(salvaged.guestId === guestId1, 'Preserved the valid existing guest ID');

  // ==========================================
  // Test Suite 5: Storage Quota Handling
  // ==========================================
  console.log('\n🔹 [Test Suite 5] Storage Quota Handling (QuotaExceededError)');
  const quotaTestKey = 'mm-test-quota-cart';

  // Temporarily override mockStorage.setItem to simulate QuotaExceededError
  const originalSetItem = mockStorage.setItem;
  let quotaErrorTriggered: boolean = false;

  mockStorage.setItem = (k: string, v: string) => {
    if (k === quotaTestKey) {
      quotaErrorTriggered = true;
      const err: any = new Error('Quota exceeded');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    }
    return originalSetItem(k, v);
  };

  const largeCart: StoredGuestCartPayload = {
    version: 1,
    guestId: guestId1,
    items: [validItem],
    savedItems: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Calling saveGuestCart should catch the QuotaExceededError gracefully without throwing
  let didThrow: boolean = false;
  try {
    guestCartService.saveGuestCart(largeCart, quotaTestKey);
  } catch {
    didThrow = true;
  }

  assert(!didThrow, 'saveGuestCart did NOT throw unhandled QuotaExceededError');
  assert(Boolean(quotaErrorTriggered), 'QuotaExceededError was simulated and caught');

  // Verify memory fallback retained data
  const fromMemory = guestCartService.loadGuestCart(quotaTestKey);
  assert(fromMemory !== null, 'Retrieved payload successfully from memory fallback');
  assert(fromMemory.guestId === guestId1, 'Memory fallback retained correct guestId');

  // Restore original storage setItem
  mockStorage.setItem = originalSetItem;

  // ==========================================
  // Test Suite 6: Integration with useCartStore
  // ==========================================
  console.log('\n🔹 [Test Suite 6] Integration with useCartStore');
  const storeGuestId = useCartStore.getState().ensureGuestId();
  assert(guestCartService.isValidGuestId(storeGuestId), 'useCartStore.ensureGuestId() returns valid guest ID');
  assert(storeGuestId.startsWith('guest_'), 'Store guest ID has guest_ prefix');

  // Verify adapter works with Zustand
  const adapter = guestCartService.createResilientStorageAdapter('mm-adapter-test');
  adapter.setItem(
    'mm-adapter-test',
    JSON.stringify({
      state: {
        guestId: storeGuestId,
        items: [validItem],
        savedItems: [],
      },
      version: 1,
    })
  );

  const adapterRead = adapter.getItem('mm-adapter-test');
  assert(adapterRead !== null, 'Adapter successfully read stored cart');
  const parsedAdapter = JSON.parse(adapterRead!);
  assert(parsedAdapter.state.guestId === storeGuestId, 'Adapter preserved guest ID in Zustand state wrapper');
  assert(parsedAdapter.state.items.length === 1, 'Adapter preserved cart items in Zustand state wrapper');

  console.log('\n================================================================');
  console.log(`🏆 TASK 42 VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
