import { 
  calculateBundlePricing, 
  generateBundleButtonLabel, 
  checkCartDeduplication 
} from '../src/lib/services/bundlePricingService';
import { ProductBundle, BundleItem } from '../src/types/bundle';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 15 - Task 3 Test Suite: Pricing, Discounts & Deduplication...\n');

// 1. Prepare sample 3-item bundle
const item1: BundleItem = {
  product_id: 'B1',
  title: 'WBCS GS Manual 2026',
  cover_image_url: 'img1.jpg',
  unit_mrp: 600,
  unit_selling_price: 500,
  is_primary: true,
  is_in_stock: true,
  stock_quantity: 10,
};

const item2: BundleItem = {
  product_id: 'B2',
  title: '10 Years Solved Papers',
  cover_image_url: 'img2.jpg',
  unit_mrp: 300,
  unit_selling_price: 240,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 15,
};

const item3: BundleItem = {
  product_id: 'B3',
  title: '100 OMR Sheets Practice Pad',
  cover_image_url: 'img3.jpg',
  unit_mrp: 100,
  unit_selling_price: 80,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 50,
};

const testBundle: ProductBundle = {
  id: 'BNDL-TEST-01',
  primary_product_id: 'B1',
  title: 'Complete WBCS Aspirant Pack',
  items: [item1, item2, item3],
  discount_type: 'FLAT',
  discount_value: 50, // Flat ₹50 combo discount
  bundle_source: 'CURATED',
  is_active: true,
  priority_score: 100,
  created_at: new Date().toISOString(),
};

// 2. All 3 items selected:
// Total MRP: 600 + 300 + 100 = 1000
// Total Selling: 500 + 240 + 80 = 820
// Combo Discount: 50
// Final Payable: 820 - 50 = 770
// Total Savings: (1000 - 820) + 50 = 230
const allSelected = calculateBundlePricing({
  bundle: testBundle,
  selectedItemIds: ['B1', 'B2', 'B3'],
});

assert(allSelected.total_mrp === 1000, 'Total MRP is 1000');
assert(allSelected.total_selling_price === 820, 'Total selling price is 820');
assert(allSelected.combo_discount === 50, 'Combo discount of 50 is applied for 3 items');
assert(allSelected.final_payable_amount === 770, 'Final payable is 770');
assert(allSelected.total_savings === 230, 'Total savings is 230');
assert(allSelected.button_label === 'Add all 3 to Cart (₹770)', 'Button label displays "Add all 3 to Cart (₹770)"');

// 3. User unchecks 1 item (B3 unselected, 2 items remain):
// Total MRP: 600 + 300 = 900
// Total Selling: 500 + 240 = 740
// Combo Discount: 50
// Final Payable: 740 - 50 = 690
const twoSelected = calculateBundlePricing({
  bundle: testBundle,
  selectedItemIds: ['B1', 'B2'],
});
assert(twoSelected.total_mrp === 900, 'Total MRP is 900 for 2 items');
assert(twoSelected.final_payable_amount === 690, 'Final payable is 690');
assert(twoSelected.button_label === 'Add both to Cart (₹690)', 'Button label switches to "Add both to Cart (₹690)"');

// 4. User unchecks down to 1 item (Item 43: Conditional Discount Reversal):
// Total Selling: 500
// Combo Discount: 0 (reversal because not a bundle)
// Final Payable: 500
const oneSelected = calculateBundlePricing({
  bundle: testBundle,
  selectedItemIds: ['B1'],
});
assert(oneSelected.combo_discount === 0, 'Combo discount is 0 when only 1 item selected');
assert(oneSelected.final_payable_amount === 500, 'Final payable is regular 500 without combo discount');
assert(oneSelected.button_label === 'Add 1 item to Cart (₹500)', 'Button label is "Add 1 item to Cart (₹500)"');

// 5. User unchecks primary item, only B2 selected:
const onlySecondary = calculateBundlePricing({
  bundle: testBundle,
  selectedItemIds: ['B2'],
});
assert(onlySecondary.button_label === 'Add other item to Cart (₹240)', 'Button switches to "Add other item to Cart" when primary unchecked');

// 6. Bengali localized button label
const bengaliLabel = generateBundleButtonLabel(3, 3, true, 770, 'bn');
assert(bengaliLabel === '৩টি বই একসাথে কার্টে যোগ করুন (₹770)', 'Bengali label formatted properly');

// 7. Out of Stock (OOS) Elimination (Item 8)
const oosBundle: ProductBundle = {
  ...testBundle,
  items: [item1, { ...item2, is_in_stock: false, stock_quantity: 0 }, item3],
};
const oosPricing = calculateBundlePricing({
  bundle: oosBundle,
  selectedItemIds: ['B1', 'B2', 'B3'], // B2 is requested but OOS
});
assert(oosPricing.item_count === 2, 'OOS item B2 automatically eliminated from calculation');
assert(oosPricing.total_mrp === 700, 'Total MRP excludes OOS item (600 + 100 = 700)');

// 8. Deduplication Guard (Item 40)
const dedupResult = checkCartDeduplication([item1, item2, item3], ['B2']);
assert(dedupResult[0].isAlreadyInCart === false, 'B1 not in cart');
assert(dedupResult[1].isAlreadyInCart === true, 'B2 flagged as Already in Cart');
assert(dedupResult[2].isAlreadyInCart === false, 'B3 not in cart');

console.log('\n🎉 ALL MODULE 15 TASK 3 TESTS PASSED SUCCESSFULLY! (14/14 Checks)');
