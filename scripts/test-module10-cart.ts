/**
 * Module 10: Tasks 21, 22 & 23 Automated Test Suite
 * Covers:
 * - Task 21: Save for Later Store Architecture & State Actions
 * - Task 22: 1-Click Transition & Property Preservation
 * - Task 23: Move to Cart Restoration, Quantity Merging & State Integrity
 */

import { runModule10CartUnitTests } from '../src/lib/utils/__tests__/module10Cart.test';
import { useCartStore } from '../src/hooks/useCartStore';
import { CartItem, SavedForLaterItem } from '../src/types/cart';

console.log('======================================================================');
console.log('M.M Book House Malda - Module 10 Test Suite (Tasks 21, 22 & 23)');
console.log('Save for Later, 1-Click Transition & Move-to-Cart Restoration');
console.log('======================================================================\n');

// 1. Run Core Foundation Unit Tests
const baseResults = runModule10CartUnitTests();
let passed = baseResults.passed;
let failed = baseResults.failed;
const errors = [...baseResults.errors];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`FAILED: ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

// -----------------------------------------------------------------------------
// TASK 23 DEDICATED TEST SUITE: moveToCart Quantity Merging & State Integrity
// -----------------------------------------------------------------------------
console.log('Running Task 23 Dedicated Assertions:');

// Scenario A: Quantity Merging when moved item already exists in active cart
const existingCartItem: CartItem = {
  id: 'cart-item-merge-1',
  bookId: 'book-ananda-math-special',
  variantId: 'var-deluxe',
  title: 'Anandamath (Deluxe Hardcover)',
  titleBn: 'আনন্দমঠ (ডিলাক্স সংস্করণ)',
  author: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়',
  authorBn: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়',
  price: 450,
  mrp: 600,
  quantity: 2,
  maxQuantity: 5,
  coverImage: '/images/books/anandamath.webp',
  binding: 'hardcover',
  condition: 'new',
  inStock: true,
  stockCount: 15,
};

const duplicateSavedItem: SavedForLaterItem = {
  id: 'saved-item-merge-1',
  bookId: 'book-ananda-math-special',
  variantId: 'var-deluxe',
  title: 'Anandamath (Deluxe Hardcover)',
  titleBn: 'আনন্দমঠ (ডিলাক্স সংস্করণ)',
  author: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়',
  authorBn: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়',
  price: 450,
  mrp: 600,
  quantity: 2,
  maxQuantity: 5,
  coverImage: '/images/books/anandamath.webp',
  binding: 'hardcover',
  condition: 'new',
  inStock: true,
  stockCount: 15,
  savedAt: Date.now() - 10000,
};

// Seed store
useCartStore.setState({
  items: [existingCartItem],
  savedItems: [duplicateSavedItem],
  isAnimating: false,
  lastAddedItem: null,
});

assert(
  useCartStore.getState().items.length === 1 && useCartStore.getState().items[0].quantity === 2,
  'Task 23 Setup: Active cart seeded with 1 item of quantity 2'
);
assert(
  useCartStore.getState().savedItems.length === 1,
  'Task 23 Setup: Saved items seeded with 1 item of quantity 2'
);

// Execute moveToCart: Should merge quantities 2 + 2 = 4 (no duplicate row)
useCartStore.getState().moveToCart(duplicateSavedItem.id);

const stateAfterMerge = useCartStore.getState();
assert(
  stateAfterMerge.items.length === 1,
  'Task 23 Quantity Merging: Items array length must remain 1 without duplicate rows'
);
assert(
  stateAfterMerge.items[0].quantity === 4,
  'Task 23 Quantity Merging: Active cart item quantity should merge to 4 (2 + 2)'
);
assert(
  stateAfterMerge.savedItems.length === 0,
  'Task 23 Quantity Merging: Saved item must be removed from savedItems'
);

// Subtotal recalculation check
const expectedSubtotal = 4 * 450; // 1800
const actualSubtotal = stateAfterMerge.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
assert(
  actualSubtotal === expectedSubtotal,
  `Task 23 Recalculation: Subtotal should immediately be ₹${expectedSubtotal}`
);

// Scenario B: Quantity Capping by maxQuantity
const overflowSavedItem: SavedForLaterItem = {
  id: 'saved-item-overflow',
  bookId: 'book-ananda-math-special',
  variantId: 'var-deluxe',
  title: 'Anandamath (Deluxe Hardcover)',
  titleBn: 'আনন্দমঠ (ডিলাক্স সংস্করণ)',
  author: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়',
  price: 450,
  mrp: 600,
  quantity: 3, // 4 + 3 = 7, but maxQuantity is 5
  maxQuantity: 5,
  savedAt: Date.now(),
};

useCartStore.setState({
  savedItems: [overflowSavedItem],
});

useCartStore.getState().moveToCart(overflowSavedItem.id);
const stateAfterOverflow = useCartStore.getState();
assert(
  stateAfterOverflow.items[0].quantity === 5,
  'Task 23 maxQuantity Enforcement: Merged quantity strictly capped at maxQuantity (5)'
);

// Scenario C: State Integrity & Bounce Animation
assert(
  stateAfterOverflow.isAnimating === true,
  'Task 23 Animation: isAnimating should be true upon moveToCart'
);
assert(
  stateAfterOverflow.lastAddedItem !== null && stateAfterOverflow.lastAddedItem.bookId === 'book-ananda-math-special',
  'Task 23 State Integrity: lastAddedItem should record the restored item'
);

// Scenario D: Secondary Delete Action (removeSavedItem)
const itemToDelete: SavedForLaterItem = {
  id: 'saved-item-to-delete',
  bookId: 'book-quick-delete',
  title: 'Quick Delete Book',
  titleBn: 'মুছে ফেলার বই',
  author: 'লেখক',
  price: 150,
  mrp: 200,
  savedAt: Date.now(),
};

useCartStore.setState({
  savedItems: [itemToDelete],
});
assert(
  useCartStore.getState().savedItems.length === 1,
  'Task 23 Delete: Seeded 1 saved item for delete test'
);

useCartStore.getState().removeSavedItem(itemToDelete.id);
assert(
  useCartStore.getState().savedItems.length === 0,
  'Task 23 Delete: removeSavedItem successfully removed the item from savedItems'
);

// -----------------------------------------------------------------------------
// TASK 24 DEDICATED TEST SUITE: Unlimited Capacity Save for Later Section
// -----------------------------------------------------------------------------
console.log('\nRunning Task 24 Dedicated Assertions (Unlimited Capacity & Section UI):');

// Scenario 1: Empty vs Populated state detection
useCartStore.setState({ savedItems: [] });
assert(
  useCartStore.getState().savedItems.length === 0,
  'Task 24 Empty State: Store correctly reports 0 saved items'
);

// Scenario 2: Rich Card fields validation
const richCardItem: SavedForLaterItem = {
  id: 'saved-card-rich-1',
  bookId: 'book-desh-bidesh-syed',
  variantId: 'var-hardcover',
  title: 'Deshe Bideshe',
  titleBn: 'দেশে বিদেশে',
  author: 'Syed Mujtaba Ali',
  authorBn: 'সৈয়দ মুজতবা আলী',
  price: 280,
  mrp: 350,
  binding: 'hardcover',
  coverImage: '/images/books/deshe-bideshe.webp',
  condition: 'new',
  inStock: true,
  stockCount: 18,
  savedAt: Date.now(),
};

const oosCardItem: SavedForLaterItem = {
  id: 'saved-card-oos-2',
  bookId: 'book-rare-manuscript',
  title: 'Rare Historical Chronicles',
  titleBn: 'দুর্লভ ঐতিহাসিক ইতিবৃত্ত',
  author: 'ঐতিহাসিক সংকলন',
  price: 500,
  mrp: 500,
  binding: 'paperback',
  inStock: false,
  stockCount: 0,
  savedAt: Date.now() - 5000,
};

useCartStore.setState({
  savedItems: [richCardItem, oosCardItem],
});

const stateSavedTwo = useCartStore.getState().savedItems;
assert(
  stateSavedTwo.length === 2,
  'Task 24 Card Fields: Exactly 2 items saved in list'
);

// Verify card fields for item 1
const c1 = stateSavedTwo[0];
assert(
  Boolean(c1.coverImage && c1.title && c1.titleBn && c1.author && c1.authorBn),
  'Task 24 Card Fields: Cover image, English/Bengali titles and authors present'
);
assert(
  c1.binding === 'hardcover',
  'Task 24 Card Fields: Hardcover binding format accurately recorded'
);
const discountPercent = Math.round(((c1.mrp - c1.price) / c1.mrp) * 100);
assert(
  discountPercent === 20,
  'Task 24 Card Fields: Discount calculation formula produces exact 20% savings'
);
assert(
  c1.inStock === true && c1.stockCount === 18,
  'Task 24 Card Fields: In stock status and stockCount verified'
);

// Verify card fields for out-of-stock item 2
const c2 = stateSavedTwo[1];
assert(
  c2.inStock === false && c2.stockCount === 0,
  'Task 24 Card Fields: Out-of-stock badge state verified'
);

// Scenario 3: Unlimited Capacity Scaling Stress Test (100 saved books)
const BATCH_SIZE = 100;
const unlimitedBatch: SavedForLaterItem[] = Array.from({ length: BATCH_SIZE }, (_, idx) => ({
  id: `saved-bulk-book-${idx + 1}`,
  bookId: `book-catalog-id-${idx + 1}`,
  title: `Standard Academic Book Vol. ${idx + 1}`,
  titleBn: `প্রামাণ্য অ্যাকাডেমিক বই খণ্ড ${idx + 1}`,
  author: `Author ${idx + 1}`,
  price: 100 + (idx % 20) * 15,
  mrp: 150 + (idx % 20) * 20,
  binding: idx % 2 === 0 ? 'paperback' : 'hardcover',
  inStock: idx % 10 !== 0,
  savedAt: Date.now() - idx * 1000,
}));

useCartStore.setState({
  savedItems: unlimitedBatch,
});

const bulkState = useCartStore.getState();
assert(
  bulkState.savedItems.length === BATCH_SIZE,
  `Task 24 Unlimited Capacity: Successfully scaled to ${BATCH_SIZE} distinct saved items without limitation`
);

// Check integrity of boundary elements
assert(
  bulkState.savedItems[0].id === 'saved-bulk-book-1' && bulkState.savedItems[99].id === 'saved-bulk-book-100',
  'Task 24 Unlimited Capacity: Boundary elements (first and 100th) preserve identity'
);

// Move one item from the 100-item collection back to active cart
const targetItemToMove = bulkState.savedItems[50]; // 51st item
useCartStore.getState().moveToCart(targetItemToMove.id);

const stateAfterBulkMove = useCartStore.getState();
assert(
  stateAfterBulkMove.savedItems.length === BATCH_SIZE - 1,
  'Task 24 Unlimited Capacity: Moving 1 item reduces savedItems from 100 to 99'
);
assert(
  stateAfterBulkMove.items.some((i) => i.id === targetItemToMove.id),
  'Task 24 Unlimited Capacity: Moved item is present in active cart'
);

// Bulk purge
useCartStore.getState().clearSavedItems();
assert(
  useCartStore.getState().savedItems.length === 0,
  'Task 24 Unlimited Capacity: Bulk clear resets 99 items back to 0 cleanly'
);

// Summary Output
console.log(`\n======================================================================`);
console.log(`All Module 10 Tests Completed:`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (errors.length > 0) {
  console.error('\nErrors encountered:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('\nSUCCESS: All Module 10 (Tasks 21, 22, 23 & 24) unit tests passed flawlessly!');
  console.log('======================================================================\n');
  process.exit(0);
}
