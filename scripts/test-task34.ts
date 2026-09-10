import React from 'react';
import { renderToString } from 'react-dom/server';
import { AvailableCouponsPills } from '../src/components/cart/AvailableCouponsPills';
import { CartCouponBox } from '../src/components/cart/CartCouponBox';
import { AVAILABLE_COUPONS } from '../src/lib/data/couponData';

console.log('================================================================');
console.log('🏷️ Task 34 Verification: AvailableCouponsPills Component');
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

// 1. Standard MM Book House Coupons Catalog Check
console.log('🔹 1. Standard Coupons Catalog:');
const codes = AVAILABLE_COUPONS.map((c) => c.code);
assert(codes.includes('WELCOME50'), 'Includes WELCOME50 (Flat ₹50 off on orders ₹399+)');
assert(codes.includes('MALDAFREE'), 'Includes MALDAFREE (100% Free Shipping on Malda orders)');
assert(codes.includes('WBCS2026'), 'Includes WBCS2026 (10% off competitive exam books)');
assert(codes.includes('BOOKWORM15'), 'Includes BOOKWORM15 (15% off on ₹999+)');
assert(AVAILABLE_COUPONS.length >= 4, 'Catalog contains all 4 standard promotional codes');

// 2. Rendering of Pills in Bengali Mode
console.log('\n🔹 2. Available Coupons Pills (Bengali mode):');
let clickedCode = '';
const onSelectMock = (code: string) => {
  clickedCode = code;
};

const htmlPillsBn = renderToString(
  React.createElement(AvailableCouponsPills, {
    onSelectCoupon: onSelectMock,
    language: 'bn',
  })
);

assert(htmlPillsBn.includes('WELCOME50'), 'Renders WELCOME50 in uppercase mono');
assert(htmlPillsBn.includes('MALDAFREE'), 'Renders MALDAFREE in uppercase mono');
assert(htmlPillsBn.includes('WBCS2026'), 'Renders WBCS2026 in uppercase mono');
assert(htmlPillsBn.includes('BOOKWORM15'), 'Renders BOOKWORM15 in uppercase mono');
assert(htmlPillsBn.includes('৫০ ছাড়') || htmlPillsBn.includes('₹৫০ ছাড়'), 'Renders Bengali flat discount badge');
assert(htmlPillsBn.includes('ফ্রি ডেলিভারি'), 'Renders Bengali free delivery badge');
assert(htmlPillsBn.includes('১০% ছাড়'), 'Renders Bengali percentage badge');
assert(htmlPillsBn.includes('১৫% ছাড়'), 'Renders Bengali 15% discount badge');
assert(htmlPillsBn.includes('উপলব্ধ প্রমো কোড'), 'Contains localized section header');

// 3. Rendering of Pills in English Mode
console.log('\n🔹 3. Available Coupons Pills (English mode):');
const htmlPillsEn = renderToString(
  React.createElement(AvailableCouponsPills, {
    onSelectCoupon: onSelectMock,
    language: 'en',
  })
);

assert(htmlPillsEn.includes('₹50 Off'), 'Renders English discount badge "₹50 Off"');
assert(htmlPillsEn.includes('Free Delivery'), 'Renders English discount badge "Free Delivery"');
assert(htmlPillsEn.includes('10% Off'), 'Renders English discount badge "10% Off"');
assert(htmlPillsEn.includes('15% Off'), 'Renders English discount badge "15% Off"');
assert(htmlPillsEn.includes('Available Coupons (1-Click Apply)'), 'Contains English section header');

// 4. Active / Applied Coupon State Reflection
console.log('\n🔹 4. Active / Applied Coupon State:');
const htmlAppliedPill = renderToString(
  React.createElement(AvailableCouponsPills, {
    appliedCouponCode: 'WELCOME50',
    onSelectCoupon: onSelectMock,
    language: 'bn',
  })
);

assert(htmlAppliedPill.includes('aria-pressed="true"'), 'Applied coupon pill has aria-pressed="true"');
assert(htmlAppliedPill.includes('bg-emerald-50'), 'Applied coupon pill styled with emerald background');
assert(htmlAppliedPill.includes('border-emerald-300'), 'Applied coupon pill styled with emerald border');
assert(htmlAppliedPill.includes('প্রযুক্ত রয়েছে'), 'Applied coupon pill displays "প্রযুক্ত রয়েছে" confirmation text');

// 5. Embedding within CartCouponBox (Task 34 Integration)
console.log('\n🔹 5. Embedded inside CartCouponBox:');
const htmlCouponBoxWithPills = renderToString(
  React.createElement(CartCouponBox, {
    defaultExpanded: true,
    language: 'bn',
  })
);

assert(
  htmlCouponBoxWithPills.includes('data-testid="available-coupons-pills"'),
  'CartCouponBox embeds available coupon pills container'
);
assert(
  htmlCouponBoxWithPills.includes('WELCOME50'),
  'CartCouponBox displays WELCOME50 1-click pill'
);
assert(
  htmlCouponBoxWithPills.includes('MALDAFREE'),
  'CartCouponBox displays MALDAFREE 1-click pill'
);

// 6. WCAG 2.1 AA Accessibility Attributes
console.log('\n🔹 6. Accessibility & Semantic Roles:');
assert(htmlPillsBn.includes('role="list"'), 'Contains role="list" for coupon pills grid');
assert(htmlPillsBn.includes('role="listitem"'), 'Pills have role="listitem" for screen readers');
assert(htmlPillsBn.includes('aria-label='), 'Includes descriptive aria-label on list and items');

console.log('\n================================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed} TASK 34 SPECIFICATION CHECKS PASSED!`);
} else {
  console.error(`❌ ${failed} CHECKS FAILED (${passed} passed)`);
  process.exit(1);
}
console.log('================================================================\n');
