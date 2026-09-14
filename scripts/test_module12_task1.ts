/**
 * Test Suite: Module 12 - Task 1: Core Types & Zod Validations
 * Validates:
 * - Indian GSTIN Regex, Sanitization, State Code Extraction (WB = 19)
 * - Delivery Speed & Payment Method Enums
 * - Coupon Code Format & Sanitizer
 * - 4-Digit COD OTP Anti-Fraud Regex
 * - Single Item Schema & Constraints
 * - Conditional Place Order Refinements (GST Invoice requirement, COD OTP)
 */

import {
  GSTIN_REGEX,
  COD_OTP_REGEX,
  COUPON_CODE_REGEX,
  sanitizeGstin,
  sanitizeCouponCode,
  validateGstin,
  gstBillingSchema,
  deliverySpeedSchema,
  paymentMethodSchema,
  couponCodeSchema,
  codVerificationSchema,
  checkoutItemInputSchema,
  placeOrderSchema,
} from '../src/lib/validations/checkout';

import {
  CheckoutMode,
  CheckoutStep,
  DeliverySpeedId,
  PaymentMethodType,
  CheckoutSession,
  PlaceOrderPayload,
} from '../src/types/checkout';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ Passed: ${message}`);
  } else {
    console.error(`  ❌ Failed: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
}

console.log('🧪 Starting Module 12 - Task 1 Tests: Checkout Types & Validations\n');

// 1. GSTIN Regex & Sanitization Tests
console.log('--- 1. GSTIN Validation Tests ---');
const validWbGstin = '19AAAAA0000A1Z5';
const validDelhiGstin = '07AAAAA0000A1Z2';
const invalidGstin1 = '19AAAAA0000A1';     // Too short
const invalidGstin2 = '19AAAAA0000A1Z59';   // Too long
const invalidGstin3 = '19AAAAA0000A195';   // 14th char not Z

assert(GSTIN_REGEX.test(validWbGstin), 'Valid WB GSTIN matches regex');
assert(GSTIN_REGEX.test(validDelhiGstin), 'Valid Delhi GSTIN matches regex');
assert(!GSTIN_REGEX.test(invalidGstin1), 'Short GSTIN rejected');
assert(!GSTIN_REGEX.test(invalidGstin2), 'Long GSTIN rejected');
assert(!GSTIN_REGEX.test(invalidGstin3), 'Non-Z 14th char GSTIN rejected');

const formattedGstin = sanitizeGstin(' 19aaaaa 0000a1z5 ');
assert(formattedGstin === validWbGstin, 'sanitizeGstin strips spaces and converts to uppercase');

const wbGstinValidation = validateGstin('19AAAAA0000A1Z5');
assert(wbGstinValidation.isValid === true, 'validateGstin accepts valid GSTIN');
assert(wbGstinValidation.stateCode === '19', 'Correctly extracts WB state code 19');
assert(wbGstinValidation.isWestBengal === true, 'Correctly flags isWestBengal as true');

const delhiValidation = validateGstin('07AAAAA0000A1Z2');
assert(delhiValidation.isValid === true, 'validateGstin accepts Delhi GSTIN');
assert(delhiValidation.stateCode === '07', 'Correctly extracts Delhi state code 07');
assert(delhiValidation.isWestBengal === false, 'Correctly flags non-WB as false');

const invalidValidation = validateGstin('INVALID_GST');
assert(invalidValidation.isValid === false, 'validateGstin rejects invalid format');

// 2. GST Billing Zod Schema
console.log('\n--- 2. GST Billing Zod Schema ---');
const validGstBilling = {
  companyName: 'Malda College Library',
  gstin: '19AAAAA0000A1Z5',
  registeredAddress: 'NH-34, Rathbari, Malda, WB',
};
const parsedGst = gstBillingSchema.safeParse(validGstBilling);
assert(parsedGst.success, 'Valid GST billing object passes schema');

const invalidGstBilling = {
  companyName: 'M', // too short (<2 chars)
  gstin: '12345',
};
const failedGst = gstBillingSchema.safeParse(invalidGstBilling);
assert(!failedGst.success, 'Short company name and invalid GSTIN fail schema');

// 3. Delivery Speed & Payment Method Enums
console.log('\n--- 3. Delivery Speed & Payment Method Enums ---');
assert(deliverySpeedSchema.safeParse('standard').success, 'standard delivery speed accepted');
assert(deliverySpeedSchema.safeParse('express_sameday').success, 'express_sameday speed accepted');
assert(deliverySpeedSchema.safeParse('store_pickup').success, 'store_pickup speed accepted');
assert(!deliverySpeedSchema.safeParse('drone_delivery').success, 'invalid speed rejected');

assert(paymentMethodSchema.safeParse('upi').success, 'upi payment method accepted');
assert(paymentMethodSchema.safeParse('cod').success, 'cod payment method accepted');
assert(paymentMethodSchema.safeParse('card').success, 'card payment method accepted');
assert(paymentMethodSchema.safeParse('netbanking').success, 'netbanking payment method accepted');
assert(!paymentMethodSchema.safeParse('bitcoin').success, 'invalid payment rejected');

// 4. Coupon Code Regex & Sanitizer
console.log('\n--- 4. Coupon Code Tests ---');
assert(COUPON_CODE_REGEX.test('WELCOME50'), 'Standard coupon WELCOME50 passes');
assert(COUPON_CODE_REGEX.test('MALDA_FREE'), 'Coupon with underscore passes');
assert(!COUPON_CODE_REGEX.test('NO'), 'Coupon under 3 chars rejected');
assert(!COUPON_CODE_REGEX.test('THIS_COUPON_CODE_IS_WAY_TOO_LONG_12345'), 'Over 20 chars rejected');

const cleanCoupon = sanitizeCouponCode(' welcome-50 ');
assert(cleanCoupon === 'WELCOME-50', 'sanitizeCouponCode formats properly');

// 5. COD 4-Digit OTP Regex & Schema
console.log('\n--- 5. COD 4-Digit OTP Tests ---');
assert(COD_OTP_REGEX.test('4921'), '4-digit OTP passes');
assert(!COD_OTP_REGEX.test('123'), '3-digit OTP fails');
assert(!COD_OTP_REGEX.test('12345'), '5-digit OTP fails');
assert(!COD_OTP_REGEX.test('ABCD'), 'Alphabetical OTP fails');

const validCodVerif = codVerificationSchema.safeParse({
  phone: '9832012345',
  otp: '5812',
});
assert(validCodVerif.success, 'Valid COD phone and 4-digit OTP accepted');

const invalidCodVerif = codVerificationSchema.safeParse({
  phone: '12345',
  otp: '99',
});
assert(!invalidCodVerif.success, 'Invalid COD phone and short OTP rejected');

// 6. Checkout Item Schema
console.log('\n--- 6. Checkout Item Schema ---');
const validItem = {
  bookId: 'book-wbcs-scan-2026',
  quantity: 2,
  binding: 'paperback',
  condition: 'new',
  giftOptions: {
    isGiftWrapSelected: true,
    giftWrapFee: 30,
    giftMessage: 'Best wishes for your exam!',
  },
};
const parsedItem = checkoutItemInputSchema.safeParse(validItem);
assert(parsedItem.success, 'Valid checkout item passes schema');

const invalidItem = {
  bookId: '', // Empty
  quantity: 0, // Less than 1
};
assert(!checkoutItemInputSchema.safeParse(invalidItem).success, 'Invalid item rejected');

// 7. Complete Order Placement Schema (with Refinements)
console.log('\n--- 7. Complete Order Placement Schema ---');
const validOrderCart: PlaceOrderPayload = {
  sessionId: 'sess-test-uuid-001',
  idempotencyKey: 'idemp-key-uuid-9876543210',
  mode: 'cart',
  items: [
    {
      bookId: 'book-101',
      quantity: 1,
    },
  ],
  shippingAddressId: 'addr-malda-001',
  deliverySpeed: 'standard',
  paymentMethod: 'upi',
  useGstInvoice: false,
};

const parsedOrder1 = placeOrderSchema.safeParse(validOrderCart);
assert(parsedOrder1.success, 'Valid standard UPI order passes schema');

// Test 1-Click Buy Now Mode
const validBuyNowOrder: PlaceOrderPayload = {
  sessionId: 'sess-buynow-002',
  idempotencyKey: 'idemp-buynow-uuid-555555555',
  mode: 'buy_now',
  items: [
    {
      bookId: 'book-special-wbcs',
      quantity: 1,
      binding: 'hardcover',
    },
  ],
  shippingAddressId: 'addr-malda-001',
  deliverySpeed: 'express_sameday',
  paymentMethod: 'cod',
  codOtpCode: '8241',
  useGstInvoice: false,
};

const parsedOrder2 = placeOrderSchema.safeParse(validBuyNowOrder);
assert(parsedOrder2.success, 'Valid 1-Click Buy Now COD order with OTP passes schema');

// Refinement Test: useGstInvoice true but missing gstDetails
const missingGstDetailsOrder = {
  ...validOrderCart,
  useGstInvoice: true,
  // gstDetails missing
};
const failedGstOrder = placeOrderSchema.safeParse(missingGstDetailsOrder);
assert(!failedGstOrder.success, 'Order with useGstInvoice=true fails when gstDetails missing');

// Valid GST Order
const validGstOrder = {
  ...validOrderCart,
  useGstInvoice: true,
  gstDetails: validGstBilling,
};
const passedGstOrder = placeOrderSchema.safeParse(validGstOrder);
assert(passedGstOrder.success, 'Order with valid GST details passes');

// Refinement Test: COD selected with invalid OTP code format
const invalidOtpCodOrder = {
  ...validBuyNowOrder,
  codOtpCode: '12', // Only 2 digits
};
const failedOtpOrder = placeOrderSchema.safeParse(invalidOtpCodOrder);
assert(!failedOtpOrder.success, 'Order with invalid COD OTP code rejected');

console.log(`\n========================================`);
console.log(`🎉 Task 1 Complete: ${passedTests}/${totalTests} Tests Passed!`);
console.log(`========================================\n`);
