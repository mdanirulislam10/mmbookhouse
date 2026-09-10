import React from 'react';
import { renderToString } from 'react-dom/server';
import { CartCouponBox } from '../src/components/cart/CartCouponBox';

console.log('================================================================');
console.log('🏷️ Task 33 Verification: CartCouponBox Component');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log('  ✓ PASS: ' + message);
    passed++;
  } else {
    console.error('  ✗ FAIL: ' + message);
    failed++;
  }
}

// 1. Collapsed State Testing
console.log('🔹 1. Collapsed Accordion State:');
const htmlCollapsedBn = renderToString(
  React.createElement(CartCouponBox, { defaultExpanded: false, language: 'bn' })
);
assert(htmlCollapsedBn.includes('aria-expanded="false"'), 'Collapsed state has aria-expanded="false"');
assert(htmlCollapsedBn.includes('প্রমো কোড ব্যবহার করুন'), 'Contains Bengali collapsed header title');
assert(htmlCollapsedBn.includes('khulun') || htmlCollapsedBn.includes('খুলুন'), 'Contains "খুলুন" open indicator');
assert(!htmlCollapsedBn.includes('role="region"'), 'Accordion panel is not rendered in DOM when collapsed');

const htmlCollapsedEn = renderToString(
  React.createElement(CartCouponBox, { defaultExpanded: false, language: 'en' })
);
assert(htmlCollapsedEn.includes('Apply Promo Code'), 'Contains English collapsed header title');
assert(htmlCollapsedEn.includes('Open'), 'Contains "Open" indicator in English');

// 2. Expanded State Testing
console.log('\n🔹 2. Expanded Accordion State:');
const htmlExpanded = renderToString(
  React.createElement(CartCouponBox, { defaultExpanded: true, language: 'bn' })
);
assert(htmlExpanded.includes('aria-expanded="true"'), 'Expanded state has aria-expanded="true"');
assert(htmlExpanded.includes('role="region"'), 'Expanded panel has role="region" for WCAG 2.1 AA compliance');
assert(htmlExpanded.includes('uppercase'), 'Input has uppercase formatting');
assert(htmlExpanded.includes('placeholder:normal-case'), 'Input has placeholder:normal-case style');
assert(htmlExpanded.includes('font-mono'), 'Input has font-mono for clear promo code readability');
assert(htmlExpanded.includes('প্রয়োগ করুন'), 'Contains primary action button "প্রয়োগ করুন" in Bengali');

const htmlExpandedEn = renderToString(
  React.createElement(CartCouponBox, { defaultExpanded: true, language: 'en' })
);
assert(htmlExpandedEn.includes('Apply'), 'Contains primary action button "Apply" in English');
assert(htmlExpandedEn.includes('Enter promo code'), 'Contains English placeholder text');

// 3. Active / Applied Coupon Chip State
console.log('\n🔹 3. Applied Coupon Chip & Remove Button:');
const appliedCouponSample = {
  code: 'MMBOOK50',
  discountAmount: 50,
  title: 'Flat ₹50 Off on orders above ₹499',
  titleBn: '₹৪৯৯+ অর্ডারে ৫০ টাকা ছাড়',
};

const htmlAppliedBn = renderToString(
  React.createElement(CartCouponBox, { appliedCoupon: appliedCouponSample, language: 'bn' })
);
assert(htmlAppliedBn.includes('data-testid="active-coupon-chip"'), 'Renders active coupon chip container');
assert(htmlAppliedBn.includes('MMBOOK50'), 'Displays active coupon code "MMBOOK50"');
assert(htmlAppliedBn.includes('bg-emerald-50'), 'Active coupon chip has emerald background styling');
assert(htmlAppliedBn.includes('border-emerald-300'), 'Active coupon chip has emerald border');
assert(htmlAppliedBn.includes('৫০'), 'Displays localized Bengali formatted discount amount');
assert(htmlAppliedBn.includes('মুছুন'), 'Contains "মুছুন" remove button');
assert(htmlAppliedBn.includes('aria-label="প্রমো কোড মুছুন"'), 'Remove button has accessible aria-label');

const htmlAppliedEn = renderToString(
  React.createElement(CartCouponBox, { appliedCoupon: appliedCouponSample, language: 'en' })
);
assert(htmlAppliedEn.includes('Remove'), 'Contains "Remove" button in English');
assert(htmlAppliedEn.includes('aria-label="Remove coupon"'), 'Remove button has English accessible aria-label');
assert(htmlAppliedEn.includes('Discount: ₹50'), 'Contains English discount label');

// 4. Loading State on Action Button
console.log('\n🔹 4. Loading State:');
const htmlLoading = renderToString(
  React.createElement(CartCouponBox, { defaultExpanded: true, isLoading: true, language: 'bn' })
);
assert(htmlLoading.includes('animate-spin'), 'Renders loading spinner icon when submitting/loading');

// 5. Accessible Error Message Alert
console.log('\n🔹 5. Error & Status Messages:');
const htmlError = renderToString(
  React.createElement(CartCouponBox, {
    defaultExpanded: true,
    errorMessage: 'অবৈধ প্রমো কোড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
    language: 'bn',
  })
);
assert(htmlError.includes('role="alert"'), 'Error message container uses role="alert"');
assert(htmlError.includes('text-red-600'), 'Error message styled in red');
assert(htmlError.includes('অবৈধ প্রমো কোড'), 'Renders specified error message content');

const htmlSuccess = renderToString(
  React.createElement(CartCouponBox, {
    defaultExpanded: true,
    successMessage: 'প্রমো কোড সফলভাবে যোগ করা হয়েছে!',
    language: 'bn',
  })
);
assert(htmlSuccess.includes('role="status"'), 'Success message container uses role="status"');
assert(htmlSuccess.includes('text-emerald-700'), 'Success message styled in emerald green');

// 6. WCAG 2.1 AA Keyboard & Accessibility Attributes
console.log('\n🔹 6. Keyboard Navigation & ARIA Compliance:');
assert(htmlExpanded.includes('aria-controls='), 'Toggle button has aria-controls linking to panel');
assert(htmlExpanded.includes('aria-labelledby='), 'Panel has aria-labelledby linking to header toggle');
assert(htmlExpanded.includes('aria-label='), 'Form inputs and buttons include accessible aria-labels');

console.log('\n================================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed} TASK 33 SPECIFICATION CHECKS PASSED!`);
} else {
  console.error(`❌ ${failed} CHECKS FAILED (${passed} passed)`);
  process.exit(1);
}
console.log('================================================================\n');
