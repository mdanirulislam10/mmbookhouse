import assert from 'assert';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useCartStore, useCart, calculateCartTotals } from '../src/hooks/useCartStore';
import { useWishlistStore } from '../src/hooks/useWishlistStore';
import { CartOrderSummary } from '../src/components/cart/CartOrderSummary';
import { CartItemCard } from '../src/components/cart/CartItemCard';
import { CartCrossSell } from '../src/components/cart/CartCrossSell';
import { SideCartDrawer } from '../src/components/cart/SideCartDrawer';
import { WishlistView } from '../src/components/account/WishlistView';

console.log('======================================================================');
console.log('🚀 M.M Book House Malda - Module 10 Master Comprehensive Audit');
console.log('Validating Completed Implementation of All Pending Tasks');
console.log('======================================================================\n');

let passed = 0;
let failed = 0;

function check(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Coupon Engine & Thresholds (Tasks 33, 34, 35, 36, 37, 38, 40)
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Coupon Engine & Minimum Order Thresholds ---');

useCartStore.setState({
  items: [
    {
      id: 'test-item-1',
      bookId: 'book-wbcs-manual-2026',
      title: 'WBCS Exam Manual',
      titleBn: 'WBCS ম্যানুয়াল',
      author: 'Dr. Ghosh',
      price: 200,
      mrp: 300,
      quantity: 1,
      inStock: true,
      isSelected: true,
    },
  ],
  appliedCoupon: null,
});

// Test A: Applying coupon below minimum threshold (WELCOME50 requires ₹399, current is ₹200)
const thresholdResult = useCartStore.getState().applyCoupon('WELCOME50');
check(!thresholdResult.success, 'Reject WELCOME50 when subtotal (₹200) is below min threshold (₹399)');
check(
  thresholdResult.message.includes('199') || thresholdResult.messageBn.includes('১৯৯'),
  'Returns helpful threshold deficit message'
);

// Increase quantity so subtotal becomes ₹600 (exceeds ₹399)
useCartStore.getState().updateQuantity('test-item-1', 3);
const validResult = useCartStore.getState().applyCoupon('WELCOME50');
check(validResult.success, 'Successfully apply WELCOME50 when subtotal exceeds threshold');

const stateWithCoupon = useCartStore.getState();
check(stateWithCoupon.appliedCoupon !== null, 'appliedCoupon is saved in store');
check(stateWithCoupon.appliedCoupon?.discountAmount === 50, 'WELCOME50 applies exact flat discount of ₹50');

// Test B: Single Best Coupon Policy (Applying new coupon replaces previous)
useCartStore.getState().applyCoupon('MALDAFREE');
check(
  useCartStore.getState().appliedCoupon?.coupon.code === 'MALDAFREE',
  'Applying MALDAFREE smoothly replaces previously applied WELCOME50'
);
check(
  useCartStore.getState().appliedCoupon?.isShippingFree === true,
  'MALDAFREE grants 100% free delivery'
);

// Test C: Remove Coupon
useCartStore.getState().removeCoupon();
check(useCartStore.getState().appliedCoupon === null, 'removeCoupon cleanly resets appliedCoupon state');

// -----------------------------------------------------------------------------
// SECTION 2: Item Removal with Undo Banner (Task 14)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Delete Item with Smooth Fade-out & Undo Banner ---');

useCartStore.setState({
  items: [
    {
      id: 'undo-item-1',
      bookId: 'book-tet-practice',
      title: 'WB Primary TET Guide',
      titleBn: 'প্রাথমিক টেট গাইড',
      author: 'M.M Team',
      price: 250,
      mrp: 350,
      quantity: 2,
      inStock: true,
    },
    {
      id: 'undo-item-2',
      bookId: 'book-history-special',
      title: 'Indian History',
      titleBn: 'ভারতের ইতিহাস',
      author: 'Prof. Roy',
      price: 300,
      mrp: 400,
      quantity: 1,
      inStock: true,
    },
  ],
  lastDeletedItem: null,
});

// Remove first item
useCartStore.getState().removeItem('undo-item-1');
check(useCartStore.getState().items.length === 1, 'Item successfully removed from active cart items');
check(
  useCartStore.getState().lastDeletedItem?.item.id === 'undo-item-1',
  'lastDeletedItem remembers removed item details'
);
check(useCartStore.getState().lastDeletedItem?.index === 0, 'lastDeletedItem preserves original index position');

// Undo removal
const undoSuccess = useCartStore.getState().undoRemoveItem();
check(undoSuccess, 'undoRemoveItem returns true');
check(useCartStore.getState().items.length === 2, 'Active items count restored to 2');
check(useCartStore.getState().items[0].id === 'undo-item-1', 'Item restored at its original index position');
check(useCartStore.getState().lastDeletedItem === null, 'lastDeletedItem cleared after successful undo');

// -----------------------------------------------------------------------------
// SECTION 3: Selective Item Checkout (Task 15)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Selective Item Checkout & Deselect All ---');

// Toggle item 2 to unselected
useCartStore.getState().toggleItemSelect('undo-item-2', false);
check(
  useCartStore.getState().items.find((i) => i.id === 'undo-item-2')?.isSelected === false,
  'Item 2 is marked isSelected = false'
);

// Select All toggle
useCartStore.getState().selectAllItems(false);
check(
  useCartStore.getState().items.every((i) => i.isSelected === false),
  'selectAllItems(false) marks all items unselected'
);

useCartStore.getState().selectAllItems(true);
check(
  useCartStore.getState().items.every((i) => i.isSelected === true),
  'selectAllItems(true) marks all items selected'
);

// -----------------------------------------------------------------------------
// SECTION 4: Gift Option & Custom Message (Task 19)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Gift Option & Custom Greeting Message ---');

useCartStore.getState().setGiftOption(true, 'শুভ জন্মদিন বন্ধু! পরীক্ষায় দারুণ সাফল্য আসুক।');
const giftState = useCartStore.getState();
check(giftState.isGiftOrder === true, 'isGiftOrder saved as true');
check(
  giftState.giftMessage === 'শুভ জন্মদিন বন্ধু! পরীক্ষায় দারুণ সাফল্য আসুক।',
  'Custom greeting message stored accurately'
);

// -----------------------------------------------------------------------------
// SECTION 5: Wishlist Folders, Add All to Cart & Shareable Link (Tasks 26-30)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 5: Wishlist Engine, Folders & WhatsApp Sharing ---');

// Test A: Folder Management
const newFolderId = useWishlistStore.getState().createFolder('Madhyamik 2026 Test', 'মাধ্যমিক ২০২৬');
check(
  useWishlistStore.getState().folders.some((f) => f.id === newFolderId),
  'Custom folder created successfully'
);

// Test B: Move item to folder
useWishlistStore.getState().moveToFolder('book-wbcs-manual-2026', newFolderId);
check(
  useWishlistStore.getState().items.find((i) => i.bookId === 'book-wbcs-manual-2026')?.folderId === newFolderId,
  'Item moved to custom folder'
);

// Test C: Shareable Link
const shareLink = useWishlistStore.getState().getShareableLink(newFolderId);
check(shareLink.includes('/account/wishlist?folder='), 'Generates valid public shareable link with folder parameter');

// Test D: Add All to Cart
const addAllResult = useWishlistStore.getState().addAllToCart(newFolderId);
check(addAllResult.addedCount > 0, 'addAllToCart transfers items from folder directly into active cart');

// -----------------------------------------------------------------------------
// SECTION 6: UI Component Integrations & Banners (Tasks 16, 17, 20, 26, 31, 32)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 6: Component Rendering & Banners ---');

// Test CartItemCard Price Drop Banner (Task 16)
const itemWithPriceDrop = {
  id: 'card-1',
  bookId: 'book-wbcs-manual-2026',
  title: 'WBCS Exam Manual',
  titleBn: 'WBCS ম্যানুয়াল',
  author: 'Dr. Ghosh',
  price: 550,
  mrp: 750,
  quantity: 1,
  priceDroppedAmount: 40,
  inStock: true,
};
const cardHtml = renderToString(React.createElement(CartItemCard, { item: itemWithPriceDrop }));
check(cardHtml.includes('সুসংবাদ!') || cardHtml.includes('Price dropped'), 'CartItemCard renders Task 16 Price Drop Banner');

// Test CartItemCard Out of Stock Banner (Task 17)
const oosItem = {
  ...itemWithPriceDrop,
  inStock: false,
};
const oosHtml = renderToString(React.createElement(CartItemCard, { item: oosItem }));
check(oosHtml.includes('স্টক এইমাত্র শেষ হয়ে গেছে') || oosHtml.includes('out of stock'), 'CartItemCard renders Task 17 Out of Stock Banner');

// Test CartCrossSell Carousel (Task 20)
const crossSellHtml = renderToString(React.createElement(CartCrossSell));
check(
  crossSellHtml.includes('আপনার কার্টের বইগুলোর সাথে পাঠকেরা আরও যা কিনেছেন') ||
    crossSellHtml.includes('Customers who bought'),
  'CartCrossSell renders Task 20 cross-sell recommendation heading'
);

// Test Layout Toast Mounting (Task 10)
const layoutPath = path.join(__dirname, '../src/app/layout.tsx');
const layoutCode = fs.readFileSync(layoutPath, 'utf8');
check(layoutCode.includes('CartToastContainer'), 'Root layout mounts CartToastContainer (Task 10)');

// Test Dedicated Wishlist Page Existence (Task 26)
const wishlistPagePath = path.join(__dirname, '../src/app/account/wishlist/page.tsx');
check(fs.existsSync(wishlistPagePath), 'src/app/account/wishlist/page.tsx exists for Task 26');

// Test WishlistView Component
const wishlistViewHtml = renderToString(React.createElement(WishlistView));
check(
  wishlistViewHtml.includes('পছন্দের তালিকা') || wishlistViewHtml.includes('Wishlist'),
  'WishlistView component renders successfully'
);

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// SECTION 7: Bug Audit Verifications (Tasks 8, 9, 13, 17, 19, 23, 40)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 7: Internal Bug Fix Verifications (Tasks 1-50 Audit) ---');

// Test 1: Task 17 Out-of-Stock Exclusion from Subtotal & Active Cart Count
const testItemsWithOOS = [
  {
    id: 'instock-book',
    bookId: 'book-instock',
    title: 'In Stock Book',
    titleBn: 'স্টকে থাকা বই',
    author: 'Author A',
    price: 500,
    mrp: 600,
    quantity: 1,
    inStock: true,
    isSelected: true,
  },
  {
    id: 'oos-book',
    bookId: 'book-oos',
    title: 'Out of Stock Book',
    titleBn: 'স্টক শেষ বই',
    author: 'Author B',
    price: 350,
    mrp: 450,
    quantity: 1,
    inStock: false,
    isSelected: true,
  },
];

const computedTotals = calculateCartTotals(testItemsWithOOS, []);
check(
  computedTotals.selectedSubtotal === 500,
  'Task 17: Out-of-stock item is strictly excluded from checkout selectedSubtotal (₹500, not ₹850)'
);
check(
  computedTotals.selectedCount === 1,
  'Task 17: Out-of-stock item is excluded from active selectedCount (1 item, not 2)'
);

// Test 2: Task 40 Dynamic Coupon Recalculation & Invalidation on Subtotal Drop
const couponWelcome50 = {
  coupon: {
    code: 'WELCOME50',
    title: 'Welcome Discount',
    titleBn: 'ওয়েলকাম ডিসকাউন্ট',
    description: 'Flat ₹50 off on orders above ₹399',
    descriptionBn: '₹৩৯৯ এর বেশি অর্ডারে ফ্ল্যাট ₹৫০ ছাড়',
    type: 'FLAT' as const,
    value: 50,
    minOrderValue: 399,
    expiresAt: '2026-12-31',
  },
  discountAmount: 50,
  isShippingFree: false,
  message: 'Applied',
  messageBn: 'প্রয়োগ করা হয়েছে',
};

const totalsWithValidCoupon = calculateCartTotals(testItemsWithOOS, [], couponWelcome50);
check(
  totalsWithValidCoupon.couponDiscount === 50,
  'Task 40: WELCOME50 active discount is ₹50 when in-stock subtotal is ₹500 (>= ₹399)'
);

// When in-stock subtotal drops below ₹399 (e.g. ₹200), coupon discount must automatically invalidate to ₹0
const lowSubtotalItems = [
  {
    id: 'instock-book',
    bookId: 'book-instock',
    title: 'In Stock Book',
    titleBn: 'স্টকে থাকা বই',
    author: 'Author A',
    price: 200, // below 399 threshold
    mrp: 300,
    quantity: 1,
    inStock: true,
    isSelected: true,
  },
];
const totalsWithInvalidatedCoupon = calculateCartTotals(lowSubtotalItems, [], couponWelcome50);
check(
  totalsWithInvalidatedCoupon.couponDiscount === 0,
  'Task 40: Coupon discount automatically invalidates to ₹0 when subtotal drops below coupon threshold'
);

// Test 3: Task 19 & 44 clearCart Resets All Dangling States
useCartStore.getState().setGiftOption(true, 'Happy Birthday!');
useCartStore.getState().clearCart();
const clearedState = useCartStore.getState();
check(clearedState.items.length === 0, 'clearCart resets items array to empty');
check(clearedState.appliedCoupon === null, 'clearCart completely resets appliedCoupon');
check(clearedState.isGiftOrder === false, 'clearCart completely resets isGiftOrder');
check(clearedState.giftMessage === '', 'clearCart completely resets giftMessage');

// Test 4: Task 23 moveToCart Preserves isFreebie Status
useCartStore.setState({
  items: [],
  savedItems: [
    {
      id: 'freebie-saved',
      bookId: 'book-gift-pen',
      title: 'Free Bookmark & Pen Set',
      titleBn: 'ফ্রি বুকমার্ক ও পেন সেট',
      author: 'M.M Exclusive',
      price: 0,
      mrp: 50,
      quantity: 1,
      isFreebie: true,
      inStock: true,
      savedAt: Date.now(),
    },
  ],
});
useCartStore.getState().moveToCart('freebie-saved');
const movedItem = useCartStore.getState().items.find((i) => i.id === 'freebie-saved');
check(movedItem?.isFreebie === true, 'Task 23: moveToCart preserves isFreebie property');

// Test 5: Task 13 Amazon Dropdown & Disabled OOS Checkbox in CartItemCard
const renderedOosCard = renderToString(
  React.createElement(CartItemCard, {
    item: {
      id: 'card-oos-test',
      bookId: 'b-1',
      title: 'Sample Test',
      titleBn: 'নমুনা',
      author: 'Writer',
      price: 300,
      mrp: 400,
      quantity: 1,
      inStock: false,
    },
  })
);
check(
  renderedOosCard.includes('disabled') && renderedOosCard.includes('cursor-not-allowed'),
  'Task 17 & 15: CartItemCard disables selection checkbox when item is out of stock'
);
check(
  renderedOosCard.includes('<select') && (renderedOosCard.includes('0 (Delete)') || renderedOosCard.includes('০ (মুছে ফেলুন)')),
  'Task 13: CartItemCard renders Amazon-style desktop dropdown with 0 (Delete) and quantity options'
);

// Test 6: Task 8 & 9 SideCartDrawer Bottom Sheet & Button Details
useCartStore.setState({
  isDrawerOpen: true,
  items: [
    {
      id: 'drawer-book-1',
      bookId: 'book-drawer-1',
      title: 'Drawer Book',
      titleBn: 'ড্রয়ার বই',
      author: 'Author',
      price: 450,
      mrp: 550,
      quantity: 2,
      inStock: true,
    },
  ],
});
const drawerHtml = renderToString(React.createElement(SideCartDrawer, { isOpen: true }));
check(
  drawerHtml.includes('max-h-[75vh]') && drawerHtml.includes('rounded-t-2xl'),
  'Task 8: SideCartDrawer renders mobile smart bottom sheet with 75% height and rounded top'
);
check(
  drawerHtml.includes('w-12 h-1.5 bg-gray-300'),
  'Task 8: SideCartDrawer includes mobile top drag handle'
);
check(
  drawerHtml.includes('Proceed to Buy') || drawerHtml.includes('অর্ডার সম্পন্ন করুন'),
  'Task 9: Proceed to Buy button displays live action CTA'
);
check(
  drawerHtml.includes('900') || drawerHtml.includes('৯০০'),
  'Task 9: Proceed to Buy button contains live total payable amount (₹900)'
);

console.log('\n======================================================================');
console.log(`Master Audit Complete: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================');

if (failed > 0) {
  process.exit(1);
}
