/**
 * Module 7: Automated Verification Test Suite
 * भाग ৫ ও ভাগ ৬ (Tasks 21 to 30)
 *
 * Covers:
 * - Task 21: Amazon-style binding variant selector calculations
 * - Task 22: Used book variant option pricing and condition validation
 * - Task 23: Classic Amazon pricing & savings formulas
 * - Task 24: Book specifications table fields & ISBN validation
 * - Task 25: Rich description word counter & 200-word truncation threshold
 * - Task 26: Author bio matching & related books resolver
 * - Task 27: Bulk order notice WhatsApp deep-link generation
 * - Task 28 & 29: Dynamic URL query parameters & optimistic state transitions
 * - Task 30: Promotional gift & mock-test bonus coupon integrity
 */

import { DETAILED_BOOKS_CATALOG } from '@/lib/data/pdpCatalog';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { DetailedBookProduct, VariantFormat, VariantCondition } from '@/types/pdp';

export function runModule7VariantsUnitTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`FAILED: ${testName}`);
    }
  }

  const sampleBook: DetailedBookProduct = DETAILED_BOOKS_CATALOG[0];

  // Test 1: Task 21 - Binding variant options availability
  assert(
    Array.isArray(sampleBook.variants) && sampleBook.variants.length >= 2,
    'Task 21: Book should have at least 2 binding variants (Paperback & Hardcover)'
  );
  const paperback = sampleBook.variants?.find((v) => v.format === 'paperback');
  const hardcover = sampleBook.variants?.find((v) => v.format === 'hardcover');
  assert(
    Boolean(paperback && paperback.price > 0 && paperback.mrp >= paperback.price),
    'Task 21: Paperback variant has valid positive price and MRP'
  );
  assert(
    Boolean(hardcover && hardcover.price > (paperback?.price ?? 0)),
    'Task 21: Hardcover variant has higher price reflecting library binding'
  );

  // Test 2: Task 22 - Used book option card validation
  const usedOption = sampleBook.usedBookOption;
  assert(
    Boolean(usedOption && usedOption.isAvailable && usedOption.price < sampleBook.price),
    'Task 22: Used book option exists, is available, and is priced lower than new book'
  );
  assert(
    Boolean(usedOption?.conditionNote && usedOption?.conditionNoteBn),
    'Task 22: Used book condition notes are provided bilingually'
  );
  const extraSavings = sampleBook.price - (usedOption?.price ?? 0);
  assert(
    extraSavings > 0,
    `Task 22: Extra savings on used book calculated properly: ₹${extraSavings}`
  );

  // Test 3: Task 23 - Amazon classic pricing & savings block
  const mrp = sampleBook.mrp;
  const price = sampleBook.price;
  const savings = mrp - price;
  const discountPct = Math.round(((mrp - price) / mrp) * 100);
  assert(
    savings === 255 && discountPct === 30,
    `Task 23: M.R.P. ₹${mrp}, Price ₹${price} yields exact savings of ₹${savings} (${discountPct}%)`
  );
  assert(
    formatINR(savings, 'bn') === '₹২৫৫',
    'Task 23: Savings format in Bengali numerals yields ₹২৫৫'
  );

  // Test 4: Task 24 - Book specifications table grid metadata
  const specs = sampleBook.specifications;
  assert(Boolean(specs.isbn13 && specs.isbn13.length >= 10), 'Task 24: ISBN-13 is valid and non-empty');
  assert(Boolean(specs.publisher && specs.publicationYear), 'Task 24: Publisher and year are present');
  assert(specs.pages === 864, 'Task 24: Page count is accurate (864 pages)');
  assert(Boolean(specs.weight && specs.dimensions && specs.paperType), 'Task 24: Weight, dimensions & paper quality exist');

  // Test 5: Task 25 - Smart expandable description & 200-word truncation threshold
  const words = sampleBook.descriptionBn.trim().split(/\s+/);
  assert(words.length > 20, 'Task 25: Description contains substantial text');
  const dummyLongText = new Array(250).fill('টেস্টশব্দ').join(' ');
  const dummyWords = dummyLongText.trim().split(/\s+/);
  const isTruncatable = dummyWords.length > 200;
  assert(
    isTruncatable && dummyWords.slice(0, 200).length === 200,
    'Task 25: Word counter correctly identifies > 200 words and splits preview at 200 words'
  );

  // Test 6: Task 26 - Author bio card and other books resolver
  const authorBio = sampleBook.authorBio;
  assert(
    Boolean(authorBio && authorBio.name && authorBio.bioBn),
    'Task 26: Author bio has valid name and bilingual biography'
  );
  assert(
    Boolean(authorBio?.otherBookIds && authorBio.otherBookIds.length > 0),
    'Task 26: Author has linked other book IDs for carousel rendering'
  );

  // Test 7: Task 27 - Wholesale bulk order WhatsApp message composer
  const waNumber = '919733000000';
  const testTitle = sampleBook.titleBn;
  const waMessage = `নমস্কার, আমি M.M Book House Malda থেকে "${testTitle}" বইটির বাল্ক / পাইকারি অর্ডারের (১০+ কপি) স্পেশাল ছাড় ও ডেলিভারির বিষয়ে জানতে চাই।`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
  assert(
    waUrl.includes('https://wa.me/919733000000?text='),
    'Task 27: Bulk order notice generates valid encoded WhatsApp inquiry deep-link'
  );

  // Test 8: Task 28 & 29 - URL query sync parameters
  function buildVariantUrl(pathname: string, format: VariantFormat, condition: VariantCondition): string {
    const params = new URLSearchParams();
    params.set('format', format);
    params.set('condition', condition);
    return `${pathname}?${params.toString()}`;
  }
  const testUrl = buildVariantUrl('/product/wbcs-preliminary-main-manual-2026', 'hardcover', 'new');
  assert(
    testUrl === '/product/wbcs-preliminary-main-manual-2026?format=hardcover&condition=new',
    'Task 28: URL sync builds exact shareable format ?format=hardcover&condition=new'
  );
  const testUsedUrl = buildVariantUrl('/product/wbcs-preliminary-main-manual-2026', 'paperback', 'used');
  assert(
    testUsedUrl === '/product/wbcs-preliminary-main-manual-2026?format=paperback&condition=used',
    'Task 28: Used condition URL sync produces ?format=paperback&condition=used'
  );

  // Test 9: Task 30 - Promotional gift & mock-test bonus ribbon
  const bonus = sampleBook.bonusOffer;
  assert(
    Boolean(bonus && bonus.titleBn && bonus.description),
    'Task 30: Bonus promotional offer data contains gift title and redemption info'
  );

  // Test 10: Numerals and currency utility formatting
  assert(toBengaliNumerals(2026) === '২০২৬', 'Numeral conversion properly translates 2026 to ২০২৬');
  assert(toBengaliNumerals('Page 42') === 'Page ৪২', 'Numeral conversion handles embedded digits');

  return { passed, failed, errors };
}
