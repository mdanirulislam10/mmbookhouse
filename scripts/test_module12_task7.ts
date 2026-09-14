/**
 * Test Suite: Module 12 - Task 7: Order Pricing Calculation, Promo Coupons & Zero-Trust Engine
 * Validates:
 * - Zero Client Trust Server Price Recalculation (Item 39)
 * - Transparent Price Drift Detection (Item 29)
 * - Promo Coupons: Flat ₹50, Percentage 10%, Free Shipping (Item 37, 38)
 * - Net Payable with Shipping & Gift Wrapping
 * - Component Export Check
 */

import {
  validateCoupon,
  calculateCheckoutPricing,
} from '../src/lib/services/checkoutPricingService';

import { CheckoutItem } from '../src/types/checkout';
import * as checkoutExports from '../src/components/checkout';

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

console.log('🧪 Starting Module 12 - Task 7 Tests: Pricing & Zero-Trust Verification\n');

// 1. Promo Coupon Validation (Item 37, 38)
console.log('--- 1. Promo Coupon Validation Tests ---');
const coupon1 = validateCoupon('WELCOME50', 350); // Order >= 299
assert(coupon1.isValid === true, 'WELCOME50 valid for ₹350 order');
assert(coupon1.discountAmount === 50, 'Applies flat ₹50 discount');

const coupon1Fail = validateCoupon('WELCOME50', 200); // Order < 299
assert(coupon1Fail.isValid === false, 'WELCOME50 rejected for order below ₹299 threshold');
assert(Boolean(coupon1Fail.errorBn?.includes('ন্যূনতম ₹299') || coupon1Fail.errorBn?.includes('২৯৯') || coupon1Fail.error?.includes('299')), 'Returns minimum order value notice');

// Percentage Coupon Test
const coupon2 = validateCoupon('MM10', 800); // 10% of 800 = 80
assert(coupon2.isValid === true, 'MM10 valid for ₹800 order');
assert(coupon2.discountAmount === 80, '10% of ₹800 equals ₹80');

const coupon2Cap = validateCoupon('MM10', 1500); // 10% of 1500 = 150 capped at 100
assert(coupon2Cap.discountAmount === 100, 'Discount capped at maxDiscount of ₹100');

// Free Shipping Coupon
const coupon3 = validateCoupon('MALDAFREE', 250);
assert(coupon3.isValid === true && coupon3.isFreeShipping === true, 'MALDAFREE flags isFreeShipping as true');

// Invalid Coupon
const invalidCoupon = validateCoupon('RANDOM_CODE', 500);
assert(invalidCoupon.isValid === false, 'Non-existent coupon code rejected');

// 2. Zero Client Trust Recalculation (Item 39)
console.log('\n--- 2. Zero Client Trust Recalculation Tests ---');
const clientItems: CheckoutItem[] = [
  {
    id: 'item-1',
    bookId: 'book-wbcs-manual',
    title: 'WBCS Manual',
    titleBn: 'ডব্লিউবিসিএস ম্যানুয়াল',
    author: 'Nitin Singhania',
    price: 10, // Tampered price by hacker: ₹10 instead of ₹400
    mrp: 600,
    quantity: 1,
  },
];

// DB Catalog Price Lookup
const officialCatalog = {
  'book-wbcs-manual': {
    price: 400, // Actual catalog price
    mrp: 600,
  },
};

const pricingRecalc = calculateCheckoutPricing({
  items: clientItems,
  pincode: '732101', // Malda Town
  deliverySpeed: 'standard',
  catalogPriceLookup: officialCatalog,
});

assert(pricingRecalc.itemsSubtotal === 400, 'Hacker tampered price (₹10) ignored; recalculated to official ₹400');
assert(pricingRecalc.catalogSavings === 200, 'Savings accurately computed (600 - 400 = 200)');
assert(pricingRecalc.priceDrifts !== undefined && pricingRecalc.priceDrifts.length === 1, 'Price drift detected and flagged');
assert(pricingRecalc.priceDrifts?.[0].newPrice === 400, 'Price drift records new catalog price (Item 29)');

// 3. Shipping & Speed Surcharges
console.log('\n--- 3. Shipping & Delivery Speeds in Pricing ---');
const expressPricing = calculateCheckoutPricing({
  items: [
    {
      id: 'item-2',
      bookId: 'book-math',
      title: 'Math',
      titleBn: 'গণিত',
      author: 'RS Aggarwal',
      price: 300,
      mrp: 350,
      quantity: 1,
    },
  ],
  pincode: '732101',
  deliverySpeed: 'express_sameday', // Adds ₹25
});

assert(expressPricing.deliverySpeedFee === 25, 'Express adds ₹25 speed fee');
assert(expressPricing.totalShippingFee === expressPricing.baseShippingFee + 25, 'Total shipping combines base + express');

// Store Pickup Waiver
const pickupPricing = calculateCheckoutPricing({
  items: clientItems,
  pincode: '732101',
  deliverySpeed: 'store_pickup',
  catalogPriceLookup: officialCatalog,
});
assert(pickupPricing.totalShippingFee === 0, 'Store pickup zeroes out all shipping fees');
assert(pickupPricing.isFreeShipping === true, 'isFreeShipping is true for store pickup');

// 4. Net Payable with Promo Code Applied (Item 38)
console.log('\n--- 4. Coupon Net Payable Verification ---');
const promoPricing = calculateCheckoutPricing({
  items: clientItems, // Subtotal ₹400
  pincode: '732101',
  deliverySpeed: 'store_pickup', // Shipping ₹0
  couponCode: 'WELCOME50',       // -₹50 discount
  catalogPriceLookup: officialCatalog,
});

assert(promoPricing.couponDiscount === 50, 'Applies ₹50 coupon discount');
assert(promoPricing.finalPayable === 350, 'Net payable accurately reduced to ₹350 (400 - 50 = 350) (Item 38)');

// 5. Component Export Check
console.log('\n--- 5. Component Export Check ---');
assert(typeof checkoutExports.CheckoutOrderSummary === 'function', 'CheckoutOrderSummary exported as React component');

console.log(`\n========================================`);
console.log(`🎉 Task 7 Complete: ${passedTests}/${totalTests} Tests Passed!`);
console.log(`========================================\n`);
