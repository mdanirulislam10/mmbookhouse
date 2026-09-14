import { 
  calculateAprioriMetrics, 
  isAntiCannibalized, 
  isPriceAsymmetricValid, 
  isVolumeSeriesMatch, 
  resolveFbtBundle 
} from '../src/lib/services/bundleRecommendationService';
import { BundleItem, ProductBundle } from '../src/types/bundle';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 15 - Task 2 Test Suite: Apriori Market Basket & Recommendation Engine...\n');

// 1. Test Apriori Market Basket Mining (Item 4 & 31)
const mockOrders = [
  { order_id: 'O1', item_ids: ['BK-WBCS-MANUAL', 'BK-WBCS-SOLVED', 'STAT-OMR'] },
  { order_id: 'O2', item_ids: ['BK-WBCS-MANUAL', 'BK-WBCS-SOLVED'] },
  { order_id: 'O3', item_ids: ['BK-WBCS-MANUAL', 'BK-WBCS-SOLVED', 'STAT-OMR'] },
  { order_id: 'O4', item_ids: ['BK-WBCS-MANUAL', 'BK-HIST-10'] },
  { order_id: 'O5', item_ids: ['BK-WBCS-SOLVED', 'STAT-OMR'] },
  { order_id: 'O6', item_ids: ['BK-NOVEL-01', 'BK-POETRY-02'] },
  { order_id: 'O7', item_ids: ['BK-CHILDREN-03'] },
  { order_id: 'O8', item_ids: ['BK-COOKING-04'] },
  { order_id: 'O9', item_ids: ['BK-RELIGION-05'] },
  { order_id: 'O10', item_ids: ['BK-DICTIONARY-06'] },
];

const metrics = calculateAprioriMetrics(mockOrders, 0.20, 0.50);
assert(metrics.length > 0, 'Apriori mined valid co-purchase association rules');

// WBCS-MANUAL -> WBCS-SOLVED co-purchased in 3 out of 4 orders containing MANUAL (75% confidence)
const manualToSolved = metrics.find(
  (m) => m.product_a_id === 'BK-WBCS-MANUAL' && m.product_b_id === 'BK-WBCS-SOLVED'
);
assert(Boolean(manualToSolved), 'Found rule: Manual -> Solved');
assert(manualToSolved!.confidence >= 0.70, 'Confidence is >= 70% (3/4 = 75%)');
assert(manualToSolved!.lift_score > 1.0, 'Lift score is > 1.0 (positive correlation)');

// 2. Test Anti-Cannibalization Filter (Item 32)
const chhayaMathTextbook: BundleItem = {
  product_id: 'CHHAYA-MATH-10',
  title: 'Chhaya Secondary Mathematics Textbook',
  publisher: 'Chhaya Prakashani',
  subject: 'Mathematics',
  category_id: 'CLASS-10',
  cover_image_url: 'img1.jpg',
  unit_mrp: 300,
  unit_selling_price: 260,
  is_primary: true,
  is_in_stock: true,
  stock_quantity: 20,
};

const prantikMathTextbook: BundleItem = {
  product_id: 'PRANTIK-MATH-10',
  title: 'Prantik Secondary Mathematics Textbook',
  publisher: 'Prantik',
  subject: 'Mathematics',
  category_id: 'CLASS-10',
  cover_image_url: 'img2.jpg',
  unit_mrp: 310,
  unit_selling_price: 270,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 25,
};

const mathSolvedTestPaper: BundleItem = {
  product_id: 'SOLVED-MATH-10',
  title: '10 Years Madhyamik Mathematics Solved Test Papers',
  publisher: 'Prantik',
  subject: 'Mathematics',
  category_id: 'CLASS-10',
  cover_image_url: 'img3.jpg',
  unit_mrp: 180,
  unit_selling_price: 150,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 50,
};

assert(isAntiCannibalized(chhayaMathTextbook, prantikMathTextbook) === false, 'Blocked rival substitute textbook in same subject & class');
assert(isAntiCannibalized(chhayaMathTextbook, mathSolvedTestPaper) === true, 'Allowed complementary solved test papers for textbook');

// 3. Test Asymmetric Directional Price Validator (Item 26)
assert(isPriceAsymmetricValid(600, 250) === true, 'Valid: ₹250 paper on ₹600 manual');
assert(isPriceAsymmetricValid(80, 500) === false, 'Invalid: ₹500 book on ₹80 item (exceeds 2.0x limit)');

// 4. Test Multi-Volume Series Grouping (Item 38)
assert(isVolumeSeriesMatch('Feluda Samagra Vol 1', 'Feluda Samagra Vol 2') === true, 'Matched series Volume 1 and Volume 2');
assert(isVolumeSeriesMatch('Feluda Samagra Vol 1', 'Byomkesh Samagra Vol 2') === false, 'Different series titles do not match');

// 5. Test Priority Resolver (Item 25)
const catalog: BundleItem[] = [
  chhayaMathTextbook,
  mathSolvedTestPaper,
  {
    product_id: 'PHY-SCI-10',
    title: 'Physical Science Class 10 Textbook',
    subject: 'Physical Science',
    category_id: 'CLASS-10',
    cover_image_url: 'img4.jpg',
    unit_mrp: 280,
    unit_selling_price: 240,
    is_primary: false,
    is_in_stock: true,
    stock_quantity: 30,
    rating: 4.8,
    total_reviews: 120,
  }
];

// Test Cold-Start / Fallback bundle
const fallbackBundle = resolveFbtBundle({
  primaryProduct: chhayaMathTextbook,
  catalog,
});
assert(fallbackBundle.bundle_source === 'CATEGORY_FALLBACK', 'Cold start resolved to CATEGORY_FALLBACK');
assert(fallbackBundle.priority_score === 50, 'Fallback priority is 50');
assert(fallbackBundle.items.length >= 2, 'Fallback bundle has at least 2 items');

// Test Curated Bundle Override (Priority 1)
const curatedBundle: ProductBundle = {
  id: 'CUR-001',
  primary_product_id: chhayaMathTextbook.product_id,
  title: 'Madhyamik Topper Math & Science Combo',
  items: [chhayaMathTextbook, mathSolvedTestPaper],
  discount_type: 'FLAT',
  discount_value: 40,
  bundle_source: 'CURATED',
  is_active: true,
  priority_score: 100,
  created_at: new Date().toISOString(),
};

const resolvedCurated = resolveFbtBundle({
  primaryProduct: chhayaMathTextbook,
  catalog,
  curatedBundles: [curatedBundle],
});
assert(resolvedCurated.bundle_source === 'CURATED', 'Admin curated bundle takes highest priority');
assert(resolvedCurated.priority_score === 100, 'Curated priority score is 100');

// Test Seasonal Boost for Test Papers (Item 34)
const seasonalBundle = resolveFbtBundle({
  primaryProduct: chhayaMathTextbook,
  catalog,
  isTestPaperSeason: true,
});
assert(seasonalBundle.items.some((it) => it.product_id === 'SOLVED-MATH-10'), 'Test paper included with seasonal boost');

console.log('\n🎉 ALL MODULE 15 TASK 2 TESTS PASSED SUCCESSFULLY! (12/12 Checks)');
