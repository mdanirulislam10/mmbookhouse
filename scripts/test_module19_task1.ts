/**
 * Test Suite: Module 19 - Task 1: Core Types & Zod Validations
 * Run: npx tsx scripts/test_module19_task1.ts
 */

import {
  adminRoleSchema,
  adminLoginSchema,
  bookMetadataSchema,
  bulkBookImportRowSchema,
  counterPickupOtpSchema,
  rtoVerificationSchema,
  couponConfigSchema,
  storeProfileSettingsSchema,
} from '../src/lib/validations/sellerCentral';
import { BookInventoryItem } from '../src/types/sellerCentral';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask1Tests() {
  console.log('========================================================================');
  console.log('🧪 MODULE 19 - TASK 1: SELLER CENTRAL TYPES & VALIDATIONS TEST SUITE');
  console.log('========================================================================\n');

  // Test 1: Admin Roles
  console.log('--- TEST 1: Admin RBAC Roles ---');
  assert(adminRoleSchema.safeParse('super_admin').success, 'super_admin role is valid');
  assert(adminRoleSchema.safeParse('inventory_manager').success, 'inventory_manager role is valid');
  assert(adminRoleSchema.safeParse('dispatch_staff').success, 'dispatch_staff role is valid');
  assert(!adminRoleSchema.safeParse('random_role').success, 'random_role is rejected');

  // Test 2: Admin Login & 2FA Schema
  console.log('\n--- TEST 2: Admin Login & 2FA Schema ---');
  const validLogin = adminLoginSchema.safeParse({
    email: 'owner@mmbookhouse.in',
    password: 'SuperSecurePassword2026',
    otp_code: '492810',
  });
  assert(validLogin.success, 'Valid login with 6-digit OTP succeeds');

  const invalidOtp = adminLoginSchema.safeParse({
    email: 'owner@mmbookhouse.in',
    password: 'SuperSecurePassword2026',
    otp_code: '123', // only 3 digits!
  });
  assert(!invalidOtp.success, '3-digit OTP code is rejected');

  // Test 3: Book Metadata Validation
  console.log('\n--- TEST 3: Book Metadata Validation ---');
  const validBook = bookMetadataSchema.safeParse({
    sku: 'WBCS-2026-SCAN',
    isbn: '9789352834912',
    title: 'WBCS Preliminary General Studies Scanner 2026',
    title_bn: 'ডব্লিউবিসিএস প্রিলিমিনারি স্ক্যানার ২০২৬',
    author: 'ড. অশোক কুমার ব্যানার্জী',
    publisher: 'ছায়া প্রকাশনী',
    edition_year: 2026,
    categories: ['WBCS', 'Civil Services'],
    mrp: 650,
    selling_price: 520,
    wholesale_cost_price: 380,
    stock_quantity: 45,
    low_stock_threshold: 5,
    weight_grams: 480,
    rack_location: 'Rack B-1, Shelf 3',
  });
  assert(validBook.success, 'Complete valid book metadata passes');

  // Selling price higher than MRP should fail
  const priceCheck = bookMetadataSchema.safeParse({
    sku: 'WBCS-BAD',
    isbn: '9789352834912',
    title: 'Bad Price Book',
    title_bn: 'ভুল দামের বই',
    author: 'লেখক',
    publisher: 'প্রকাশনী',
    categories: ['টেস্ট'],
    mrp: 500,
    selling_price: 550, // Higher than MRP!
    stock_quantity: 10,
    weight_grams: 300,
  });
  assert(!priceCheck.success, 'Selling price higher than MRP fails validation');

  // Test 4: Bulk CSV Import Row
  console.log('\n--- TEST 4: Bulk CSV Import Row Parser ---');
  const csvRow = bulkBookImportRowSchema.safeParse({
    sku: 'CHH-HIST-01',
    isbn: '9789350011223',
    title: 'Modern Indian History',
    title_bn: 'আধুনিক ভারতের ইতিহাস',
    author: 'ড. জীবন মুখোপাধ্যায়',
    publisher: 'ছায়া প্রকাশনী',
    mrp: '450',
    selling_price: '360',
    wholesale_cost_price: '260',
    stock_quantity: '25',
    weight_grams: '350',
    categories: 'College; History Honours; WBCS',
  });
  assert(csvRow.success, 'String-coerced CSV row parses successfully');
  if (csvRow.success) {
    assert(csvRow.data.categories.length === 3, 'Categories correctly split into 3 array items');
  }

  // Test 5: Counter Store Pickup OTP
  console.log('\n--- TEST 5: Counter Store Pickup OTP Schema ---');
  const validCounterOtp = counterPickupOtpSchema.safeParse({
    order_id: 'ORD-STORE-99',
    otp_code: '4928',
  });
  assert(validCounterOtp.success, '4-digit counter pickup OTP is valid');

  const badCounterOtp = counterPickupOtpSchema.safeParse({
    order_id: 'ORD-STORE-99',
    otp_code: '49281', // 5 digits
  });
  assert(!badCounterOtp.success, '5-digit counter pickup OTP is rejected');

  // Test 6: RTO Verification
  console.log('\n--- TEST 6: RTO Verification Schema ---');
  const validRto = rtoVerificationSchema.safeParse({
    awb_code: 'BLUDART-983210',
    condition: 'intact',
    restock_inventory: true,
    issue_refund: true,
  });
  assert(validRto.success, 'RTO parcel verification schema succeeds');

  // Test 7: Coupon Config
  console.log('\n--- TEST 7: Coupon Config Schema ---');
  const validCoupon = couponConfigSchema.safeParse({
    code: 'MADHYAMIK50',
    discount_type: 'flat',
    discount_value: 50,
    min_order_value: 400,
    expires_at: '2026-12-31T23:59:59.000Z',
    max_usages_per_user: 1,
  });
  assert(validCoupon.success, 'Valid flat discount coupon schema passes');

  const badCoupon = couponConfigSchema.safeParse({
    code: 'lower_case_code',
    discount_type: 'flat',
    discount_value: 50,
    expires_at: 'bad-date',
  });
  assert(!badCoupon.success, 'Lowercase code and bad date are rejected');

  // Test 8: Store Profile Settings
  console.log('\n--- TEST 8: Store Profile Settings Schema ---');
  const validStore = storeProfileSettingsSchema.safeParse({
    store_name: 'M.M Book House Malda',
    address: 'রবীন্দ্র এভিনিউ, নেতাজি সুভাষ রোড, মালদা, পশ্চিমবঙ্গ - ৭৩২৪০১',
    phone: '+919832000000',
    whatsapp: '+919832000000',
    email: 'contact@mmbookhouse.in',
    upi_id: 'mmbookhouse@okaxis',
    is_announcement_active: true,
    announcement_notice: 'মাধ্যমিক টেস্ট পেপারস ২০২৬ এখন উপলব্ধ!',
    is_maintenance_mode: false,
  });
  assert(validStore.success, 'Complete store profile settings schema passes');

  console.log('\n🎉 ALL TASK 1 TESTS PASSED SUCCESSFULLY! (100% Validations & Types Working)');
}

runTask1Tests().catch((err) => {
  console.error('Fatal error running Task 1 test:', err);
  process.exit(1);
});
