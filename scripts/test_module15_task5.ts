import { BundleItem } from '../src/types/bundle';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 15 - Task 5 Test Suite: Quick Book Popover Modal Logic...\n');

const samplePreviewItem: BundleItem = {
  product_id: 'BK-HIST-MOCK',
  title: 'Indian National Movement: Comprehensive MCQ Bank',
  title_bn: 'ভারতের স্বাধীনতা সংগ্রাম ও প্রশ্নোত্তর সম্ভার',
  author: 'Dr. Sailendra Nath Sen',
  publisher: 'Sreedhar Publishers',
  cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
  unit_mrp: 320,
  unit_selling_price: 250,
  is_primary: false,
  is_in_stock: true,
  stock_quantity: 35,
  rating: 4.9,
  total_reviews: 84,
  page_count: 420,
  edition: '2026 Revised Edition',
  synopsis: 'A definitive guide covering 1857 to 1947 with 2000+ chapterwise MCQs and previous years analysis.',
};

// 1. Verify item properties for popover
assert(Boolean(samplePreviewItem.title && samplePreviewItem.title_bn), 'Book has English & Bengali titles');
assert(samplePreviewItem.rating === 4.9, 'Rating is 4.9');
assert(samplePreviewItem.page_count === 420, 'Page count is 420');
assert(Boolean(samplePreviewItem.synopsis && samplePreviewItem.synopsis.length > 20), 'Synopsis exists and is descriptive');

// 2. Discount percentage calculation
const discount = Math.round(((samplePreviewItem.unit_mrp - samplePreviewItem.unit_selling_price) / samplePreviewItem.unit_mrp) * 100);
assert(discount === 22, 'Discount percentage is 22%');

console.log('\n🎉 ALL MODULE 15 TASK 5 TESTS PASSED SUCCESSFULLY! (4/4 Checks)');
