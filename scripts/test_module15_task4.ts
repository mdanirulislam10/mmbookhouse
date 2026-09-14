import { calculateBundlePricing } from '../src/lib/services/bundlePricingService';
import { ProductBundle, BundleItem } from '../src/types/bundle';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 15 - Task 4 Test Suite: Frequently Bought Together UI Logic...\n');

const item1: BundleItem = {
  product_id: 'P1',
  title: 'Secondary English Grammar',
  title_bn: 'মাধ্যমিক ইংরেজি ব্যাকরণ',
  cover_image_url: 'cover1.jpg',
  unit_mrp: 350,
  unit_selling_price: 280,
  is_primary: true,
  is_in_stock: true,
  stock_quantity: 20,
};

const item2: BundleItem = {
  product_id: 'P2',
  title: 'English Composition & Essay Bank',
  title_bn: 'ইংরেজি রচনা সম্ভার',
  cover_image_url: 'cover2.jpg',
  unit_mrp: 250,
  unit_selling_price: 200,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 15,
};

const item3: BundleItem = {
  product_id: 'P3',
  title: '10 Years Madhyamik English Solved Question Papers',
  title_bn: '১০ বছরের সমাধান',
  cover_image_url: 'cover3.jpg',
  unit_mrp: 180,
  unit_selling_price: 150,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 40,
};

const bundle: ProductBundle = {
  id: 'BNDL-ENG-01',
  primary_product_id: 'P1',
  title: 'Madhyamik English Score Booster Pack',
  items: [item1, item2, item3],
  discount_type: 'PERCENTAGE',
  discount_value: 10, // 10% combo discount
  bundle_source: 'CURATED',
  is_active: true,
  priority_score: 100,
  created_at: new Date().toISOString(),
};

// 1. Initial State (All 3 items selected):
// Total MRP: 350 + 250 + 180 = 780
// Total Selling: 280 + 200 + 150 = 630
// 10% Combo Discount: 63
// Final Payable: 630 - 63 = 567
const stateAllSelected = calculateBundlePricing({
  bundle,
  selectedItemIds: ['P1', 'P2', 'P3'],
  locale: 'bn',
});

assert(stateAllSelected.total_mrp === 780, 'Total MRP is 780');
assert(stateAllSelected.total_selling_price === 630, 'Total selling price is 630');
assert(stateAllSelected.combo_discount === 63, '10% Combo discount is 63');
assert(stateAllSelected.final_payable_amount === 567, 'Payable is 567');
assert(stateAllSelected.button_label === '৩টি বই একসাথে কার্টে যোগ করুন (₹567)', 'Bengali CTA matches 3 items');

// 2. User unchecks P3 (P1 + P2 remain):
// Total MRP: 350 + 250 = 600
// Total Selling: 280 + 200 = 480
// 10% Combo Discount: 48
// Final Payable: 480 - 48 = 432
const stateTwoSelected = calculateBundlePricing({
  bundle,
  selectedItemIds: ['P1', 'P2'],
  locale: 'bn',
});
assert(stateTwoSelected.final_payable_amount === 432, 'Payable for 2 items is 432');
assert(stateTwoSelected.button_label === 'উভয় বই কার্টে যোগ করুন (₹432)', 'Bengali CTA matches 2 items');

// 3. User unchecks P1 (Primary unchecked, only P2 selected):
const stateOnlyP2 = calculateBundlePricing({
  bundle,
  selectedItemIds: ['P2'],
  locale: 'bn',
});
assert(stateOnlyP2.combo_discount === 0, 'Combo discount revoked for single item');
assert(stateOnlyP2.final_payable_amount === 200, 'Single item payable is 200');
assert(stateOnlyP2.button_label === 'সম্পূরক বইটি কার্টে যোগ করুন (₹200)', 'Switches to supplementary single item CTA');

console.log('\n🎉 ALL MODULE 15 TASK 4 TESTS PASSED SUCCESSFULLY! (8/8 Checks)');
