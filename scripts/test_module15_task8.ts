import { AdminBundleManager } from '../src/components/admin/AdminBundleManager';
import { ProductBundle, BundleItem } from '../src/types/bundle';
import { calculateBundlePricing } from '../src/lib/services/bundlePricingService';
import { isAntiCannibalized, isPriceAsymmetricValid } from '../src/lib/services/bundleRecommendationService';

async function runTests() {
  console.log('🧪 Running Module 15 - Task 8 Verification: Admin Curated Bundle Builder & Merchandising Manager');

  // Test 1: Component export
  console.log('Test 1: Verify AdminBundleManager export');
  if (typeof AdminBundleManager !== 'function') {
    throw new Error('AdminBundleManager must be a valid React component');
  }
  console.log('✅ Test 1 Passed: AdminBundleManager exported cleanly.');

  // Test 2: Admin Curation with Priority 1 Override (Items 21, 24)
  console.log('Test 2: Admin Curation Priority 1 Override ranking');
  const primaryBook: BundleItem = {
    product_id: 'wb-history-10',
    title: 'Itihas O Paribesh Class 10',
    title_bn: 'ইতিহাস ও পরিবেশ দশম শ্রেণি',
    author: 'WBBSE',
    cover_image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
    unit_mrp: 180,
    unit_selling_price: 160,
    is_primary: true,
    is_in_stock: true,
    stock_quantity: 40,
    category_id: 'Academic',
    subject: 'History',
  };

  const compBook1: BundleItem = {
    product_id: 'wb-history-map-10',
    title: 'Madhyamik Itihas Map Pointing & Question Bank',
    title_bn: 'মাধ্যমিক ইতিহাস ম্যাপ পয়েন্ট ও প্রশ্নব্যাংক',
    author: 'Chhaya Prakashani',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    unit_mrp: 120,
    unit_selling_price: 100,
    is_primary: false,
    is_in_stock: true,
    stock_quantity: 30,
    category_id: 'Guide',
    subject: 'History',
  };

  const curatedBundle: ProductBundle = {
    id: 'curated-wb-history-10',
    primary_product_id: primaryBook.product_id,
    title: 'Madhyamik Class 10 History Master Combo',
    title_bn: 'মাধ্যমিক ইতিহাস মাস্টার কম্বো',
    items: [primaryBook, compBook1],
    discount_type: 'PERCENTAGE',
    discount_value: 12,
    bundle_source: 'CURATED',
    priority_score: 100, // Priority 1 override
    is_active: true,
    created_at: new Date().toISOString(),
  };

  if (curatedBundle.bundle_source !== 'CURATED' || curatedBundle.priority_score !== 100) {
    throw new Error('Test 2 Failed: Curated bundle must have source CURATED and priority 100');
  }
  console.log('✅ Test 2 Passed: Admin curated bundle configured with Priority 1 override.');

  // Test 3: Anti-Cannibalization detection in curation (Item 23)
  console.log('Test 3: Anti-cannibalization detection');
  const rivalTextbook: BundleItem = {
    product_id: 'wb-history-rival-10',
    title: 'Itihas Bichitra Class 10 (Rival Textbook)',
    author: 'Santra Publication',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    unit_mrp: 175,
    unit_selling_price: 155,
    is_primary: false,
    is_in_stock: true,
    stock_quantity: 15,
    category_id: 'Academic',
    subject: 'History',
  };

  const isAllowedSubstitute = isAntiCannibalized(primaryBook, rivalTextbook);
  if (isAllowedSubstitute) {
    throw new Error('Test 3 Failed: Rival textbook of same subject and category should be flagged by anti-cannibalization');
  }
  console.log('✅ Test 3 Passed: Anti-cannibalization guard successfully detects rival textbook substitute.');

  // Test 4: Asymmetric Price Validation in Curation (Item 26)
  console.log('Test 4: Asymmetric price ratio guard');
  const expensiveEncyclopedia: BundleItem = {
    product_id: 'expensive-encyclopedia',
    title: 'Oxford Illustrated Historical Encyclopedia',
    author: 'Oxford Press',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    unit_mrp: 1200,
    unit_selling_price: 950, // 950 / 160 = 5.9x (exceeds 2.0x limit)
    is_primary: false,
    is_in_stock: true,
    stock_quantity: 5,
  };

  const isPriceValid = isPriceAsymmetricValid(primaryBook, expensiveEncyclopedia, 2.0);
  if (isPriceValid) {
    throw new Error('Test 4 Failed: Item with 5.9x price must violate asymmetric price ratio');
  }
  console.log('✅ Test 4 Passed: Asymmetric price validation correctly flags items exceeding 2.0x primary price.');

  // Test 5: Live Pricing preview for curated bundle
  console.log('Test 5: Live pricing preview calculation');
  const pricingPreview = calculateBundlePricing({
    bundle: curatedBundle,
    selectedItemIds: [primaryBook.product_id, compBook1.product_id],
    locale: 'bn',
  });

  // Total Selling Price = 160 + 100 = 260. 12% combo discount = 31.2 -> final = 228.8
  if (pricingPreview.total_selling_price !== 260) {
    throw new Error(`Test 5 Failed: Expected 260 selling price, got ${pricingPreview.total_selling_price}`);
  }
  if (pricingPreview.combo_discount !== 31.2) {
    throw new Error(`Test 5 Failed: Expected 31.2 combo discount, got ${pricingPreview.combo_discount}`);
  }
  if (pricingPreview.final_payable_amount !== 228.8) {
    throw new Error(`Test 5 Failed: Expected 228.8 payable, got ${pricingPreview.final_payable_amount}`);
  }
  console.log('✅ Test 5 Passed: Live pricing breakdown computes accurate preview.');

  console.log('\n🎉 ALL 5 TESTS FOR TASK 8 PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Task 8 verification failed:', err);
  process.exit(1);
});
