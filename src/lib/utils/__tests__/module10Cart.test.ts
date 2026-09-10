/**
 * Module 10: Cart, Saved For Later & Wishlist Test Suite
 * Part 3: Tasks 21 & 22 - Core Store Architecture & 1-Click Save For Later Transition
 *
 * Covers:
 * - Task 21: useCartStore savedItems state slice, saveForLater, moveToCart, removeSavedItem, clearSavedItems
 * - Task 22: Item transition, 0ms immediate subtotal/count recalculation, and lossless property preservation
 */

import { useCartStore } from '@/hooks/useCartStore';
import { CartItem, SavedForLaterItem } from '@/types/cart';

export interface TestResult {
  passed: number;
  failed: number;
  errors: string[];
}

export function runModule10CartUnitTests(): TestResult {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`FAILED: ${testName}${detail ? ` -> ${detail}` : ''}`);
    }
  }

  // Helper to reset and seed store for tests
  const testBook1: CartItem = {
    id: 'test-cart-item-1',
    bookId: 'book-wbcs-manual-2026',
    variantId: 'var-hardcover',
    title: 'WBCS Preliminary & Main Exam Manual (2026 Edition)',
    titleBn: 'ডাব্লুবিসিএস প্রিলিমিনারি ও মেইনস ম্যানুয়াল (২০২৬)',
    author: 'ড. অশোক কুমার ঘোষ',
    authorBn: 'ড. অশোক কুমার ঘোষ',
    price: 650,
    mrp: 850,
    quantity: 2,
    maxQuantity: 10,
    coverImage: '/images/books/wbcs-manual.webp',
    binding: 'hardcover',
    condition: 'new',
    inStock: true,
    stockCount: 25,
    isFreebie: false,
    addedAt: 1700000000000,
  };

  const testBook2: CartItem = {
    id: 'test-cart-item-2',
    bookId: 'book-college-history-sem4',
    variantId: 'var-paperback',
    title: 'Modern Indian History (UGB Sem-IV)',
    titleBn: 'আধুনিক ভারতের ইতিহাস (UGB ৪র্থ সেমিস্টার)',
    author: 'প্রফেসর প্রণব চ্যাটার্জী',
    authorBn: 'প্রফেসর প্রণব চ্যাটার্জী',
    price: 320,
    mrp: 400,
    quantity: 1,
    maxQuantity: 5,
    coverImage: '/images/books/history-sem4.webp',
    binding: 'paperback',
    condition: 'new',
    inStock: true,
    stockCount: 12,
    isFreebie: false,
    addedAt: 1700000050000,
  };

  // Reset store to known baseline state
  useCartStore.setState({
    items: [testBook1, testBook2],
    savedItems: [],
    isAnimating: false,
    lastAddedItem: null,
  });

  const initialItems = useCartStore.getState().items;
  const initialSaved = useCartStore.getState().savedItems;

  // ---------------------------------------------------------------------------
  // Test Suite 1: Initial Store Baseline State
  // ---------------------------------------------------------------------------
  assert(
    initialItems.length === 2,
    'Store Baseline: Active cart should have exactly 2 seeded test items'
  );
  assert(
    Array.isArray(initialSaved) && initialSaved.length === 0,
    'Store Baseline: savedItems should be initialized as an empty array'
  );

  const initialCount = initialItems.reduce((sum, i) => sum + i.quantity, 0); // 2 + 1 = 3
  const initialSubtotal = initialItems.reduce((sum, i) => sum + i.price * i.quantity, 0); // 650*2 + 320*1 = 1620
  assert(
    initialCount === 3,
    'Store Baseline: Initial active item total count is 3'
  );
  assert(
    initialSubtotal === 1620,
    'Store Baseline: Initial active cart subtotal is ₹1620'
  );

  // ---------------------------------------------------------------------------
  // Test Suite 2: Task 22 - 1-Click Transition from Cart to Save for Later
  // ---------------------------------------------------------------------------
  useCartStore.getState().saveForLater(testBook1.id);

  const stateAfterSave = useCartStore.getState();
  assert(
    stateAfterSave.items.length === 1,
    'Task 22 Transition: Active items count should decrease from 2 to 1'
  );
  assert(
    stateAfterSave.items[0].id === testBook2.id,
    'Task 22 Transition: Active cart should retain only the un-moved item'
  );
  assert(
    stateAfterSave.savedItems.length === 1,
    'Task 22 Transition: savedItems length should now be 1'
  );

  const savedItem = stateAfterSave.savedItems[0];
  assert(
    savedItem.id === testBook1.id,
    'Task 22 Transition: savedItem id must match the moved item id'
  );

  // ---------------------------------------------------------------------------
  // Test Suite 3: Lossless Item Property Preservation
  // ---------------------------------------------------------------------------
  assert(
    savedItem.bookId === testBook1.bookId,
    'Task 22 Preservation: bookId must be preserved'
  );
  assert(
    savedItem.variantId === testBook1.variantId,
    'Task 22 Preservation: variantId must be preserved'
  );
  assert(
    savedItem.title === testBook1.title && savedItem.titleBn === testBook1.titleBn,
    'Task 22 Preservation: English and Bengali titles must be preserved'
  );
  assert(
    savedItem.author === testBook1.author && savedItem.authorBn === testBook1.authorBn,
    'Task 22 Preservation: English and Bengali authors must be preserved'
  );
  assert(
    savedItem.price === testBook1.price && savedItem.mrp === testBook1.mrp,
    'Task 22 Preservation: price and mrp must be preserved exactly'
  );
  assert(
    savedItem.quantity === testBook1.quantity,
    'Task 22 Preservation: quantity must be recorded in savedItem'
  );
  assert(
    savedItem.coverImage === testBook1.coverImage,
    'Task 22 Preservation: coverImage URL must be preserved'
  );
  assert(
    savedItem.binding === testBook1.binding,
    'Task 22 Preservation: binding (hardcover/paperback) must be preserved'
  );
  assert(
    savedItem.condition === testBook1.condition,
    'Task 22 Preservation: condition must be preserved'
  );
  assert(
    typeof savedItem.savedAt === 'number' && savedItem.savedAt > 0,
    'Task 22 Preservation: savedAt timestamp must be generated and valid'
  );

  // ---------------------------------------------------------------------------
  // Test Suite 4: Immediate 0ms Subtotal & Count Recalculation
  // ---------------------------------------------------------------------------
  const countAfterSave = stateAfterSave.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalAfterSave = stateAfterSave.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  assert(
    countAfterSave === 1,
    'Task 22 Recalculation: Active item count should immediately drop from 3 to 1'
  );
  assert(
    subtotalAfterSave === 320,
    'Task 22 Recalculation: Active cart subtotal should immediately drop from ₹1620 to ₹320'
  );

  // ---------------------------------------------------------------------------
  // Test Suite 5: Task 21 - Move Back from Save for Later to Cart (moveToCart)
  // ---------------------------------------------------------------------------
  useCartStore.getState().moveToCart(savedItem.id);

  const stateAfterMoveBack = useCartStore.getState();
  assert(
    stateAfterMoveBack.savedItems.length === 0,
    'Task 21 MoveToCart: savedItems should be empty after moving item back'
  );
  assert(
    stateAfterMoveBack.items.length === 2,
    'Task 21 MoveToCart: Active items count should return to 2'
  );

  const restoredItem = stateAfterMoveBack.items.find((i) => i.id === testBook1.id);
  assert(
    Boolean(restoredItem),
    'Task 21 MoveToCart: Restored item must exist in active cart items'
  );
  assert(
    restoredItem?.bookId === testBook1.bookId && restoredItem?.price === testBook1.price,
    'Task 21 MoveToCart: Restored item properties must be intact'
  );

  const countAfterRestore = stateAfterMoveBack.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalAfterRestore = stateAfterMoveBack.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  assert(
    countAfterRestore === 3,
    'Task 21 MoveToCart: Active count should restore back to 3'
  );
  assert(
    subtotalAfterRestore === 1620,
    'Task 21 MoveToCart: Active subtotal should restore back to ₹1620'
  );

  // ---------------------------------------------------------------------------
  // Test Suite 6: removeSavedItem & clearSavedItems
  // ---------------------------------------------------------------------------
  // Save both items
  useCartStore.getState().saveForLater(testBook1.id);
  useCartStore.getState().saveForLater(testBook2.id);

  const stateBothSaved = useCartStore.getState();
  assert(
    stateBothSaved.savedItems.length === 2,
    'Task 21 Actions: Both items successfully moved to savedItems'
  );
  assert(
    stateBothSaved.items.length === 0,
    'Task 21 Actions: Active cart items should be empty'
  );

  // Remove one item
  useCartStore.getState().removeSavedItem(testBook1.id);
  const stateOneRemoved = useCartStore.getState();
  assert(
    stateOneRemoved.savedItems.length === 1 && stateOneRemoved.savedItems[0].id === testBook2.id,
    'Task 21 Actions: removeSavedItem should remove the targeted item only'
  );

  // Clear all saved items
  useCartStore.getState().clearSavedItems();
  const stateCleared = useCartStore.getState();
  assert(
    stateCleared.savedItems.length === 0,
    'Task 21 Actions: clearSavedItems should completely empty savedItems'
  );

  return { passed, failed, errors };
}

// Auto-run if executed directly in Node environment
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('module10Cart.test')) {
  const result = runModule10CartUnitTests();
  console.log(`\n========================================`);
  console.log(`Module 10 Cart Unit Tests Execution:`);
  console.log(`Passed: ${result.passed} | Failed: ${result.failed}`);
  if (result.errors.length > 0) {
    console.error(`Errors:\n${result.errors.join('\n')}`);
    process.exit(1);
  } else {
    console.log(`ALL TESTS PASSED SUCCESSFULLY!`);
    console.log(`========================================\n`);
  }
}
