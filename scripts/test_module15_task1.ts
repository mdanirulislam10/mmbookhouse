import { 
  createBundleInputSchema, 
  addBundleToCartSchema, 
  bundleAnalyticsSchema,
  bundleItemSchema 
} from '../src/lib/validations/bundle';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 15 - Task 1 Test Suite: Bundle Types & Zod Validations...\n');

// 1. Valid 2-item bundle
const item1 = {
  product_id: 'BOOK-001',
  title: 'WBCS Preliminary General Studies Manual',
  title_bn: 'ডব্লিউবিসিএস প্রিলিমিনারি জেনারেল স্টাডিজ ম্যানুয়াল',
  cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300',
  unit_mrp: 650,
  unit_selling_price: 520,
  is_primary: true,
  is_in_stock: true,
  stock_quantity: 45,
};

const item2 = {
  product_id: 'BOOK-002',
  title: '10 Years WBCS Solved Question Papers',
  title_bn: '১০ বছরের ডব্লিউবিসিএস সমাধানকৃত প্রশ্নপত্র',
  cover_image_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=300',
  unit_mrp: 350,
  unit_selling_price: 280,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 60,
};

const item3 = {
  product_id: 'STAT-003',
  title: '100 Sheets OMR Practice Workbook',
  cover_image_url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300',
  unit_mrp: 120,
  unit_selling_price: 90,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 100,
};

const valid2ItemBundle = {
  primary_product_id: 'BOOK-001',
  title: 'WBCS Prelims Starter Combo',
  items: [item1, item2],
  discount_type: 'PERCENTAGE' as const,
  discount_value: 5,
  bundle_source: 'CURATED' as const,
};

assert(createBundleInputSchema.safeParse(valid2ItemBundle).success === true, 'Valid 2-item bundle accepted');

// 2. Valid 3-item bundle
const valid3ItemBundle = {
  ...valid2ItemBundle,
  title: 'WBCS Ultimate Ranker Bundle',
  items: [item1, item2, item3],
  discount_type: 'FLAT' as const,
  discount_value: 50,
};

assert(createBundleInputSchema.safeParse(valid3ItemBundle).success === true, 'Valid 3-item bundle accepted');

// 3. Reject bundle with 1 item (Item 6 constraint: min 2)
const invalid1ItemBundle = {
  ...valid2ItemBundle,
  items: [item1],
};
assert(createBundleInputSchema.safeParse(invalid1ItemBundle).success === false, 'Bundle with only 1 item rejected');

// 4. Reject bundle with > 3 items (Item 6 constraint: max 3)
const item4 = { ...item3, product_id: 'BOOK-004' };
const invalid4ItemBundle = {
  ...valid2ItemBundle,
  items: [item1, item2, item3, item4],
};
assert(createBundleInputSchema.safeParse(invalid4ItemBundle).success === false, 'Bundle with 4 items rejected (max 3 allowed)');

// 5. Reject bundle without primary item
const noPrimaryBundle = {
  ...valid2ItemBundle,
  items: [{ ...item1, is_primary: false }, item2],
};
assert(createBundleInputSchema.safeParse(noPrimaryBundle).success === false, 'Bundle with no primary item rejected');

// 6. Reject bundle with multiple primary items
const multiPrimaryBundle = {
  ...valid2ItemBundle,
  items: [item1, { ...item2, is_primary: true }],
};
assert(createBundleInputSchema.safeParse(multiPrimaryBundle).success === false, 'Bundle with multiple primary items rejected');

// 7. Reject percentage discount > 50%
const excessiveDiscountBundle = {
  ...valid2ItemBundle,
  discount_type: 'PERCENTAGE' as const,
  discount_value: 65,
};
assert(createBundleInputSchema.safeParse(excessiveDiscountBundle).success === false, 'Excessive >50% percentage discount rejected');

// 8. Test addBundleToCartSchema
const validCartPayload = {
  bundleId: 'BNDL-001',
  primaryProductId: 'BOOK-001',
  selectedProductIds: ['BOOK-001', 'BOOK-002'],
  comboDiscountApplied: 50,
};
assert(addBundleToCartSchema.safeParse(validCartPayload).success === true, 'Valid add-to-cart payload accepted');

// 9. Test bundleAnalyticsSchema
const validAnalyticsPayload = {
  bundle_id: 'BNDL-001',
  primary_product_id: 'BOOK-001',
  event_type: 'CONVERT' as const,
  item_ids: ['BOOK-001', 'BOOK-002', 'STAT-003'],
  total_amount: 890,
  user_id: 'usr_123',
};
assert(bundleAnalyticsSchema.safeParse(validAnalyticsPayload).success === true, 'Valid bundle analytics event schema accepted');

console.log('\n🎉 ALL MODULE 15 TASK 1 TESTS PASSED SUCCESSFULLY! (9/9 Checks)');
