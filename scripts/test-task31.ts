import React from 'react';
import { renderToString } from 'react-dom/server';
import { FreeDeliveryProgressBar } from '../src/components/cart/FreeDeliveryProgressBar';
import { formatINR, toBengaliNumerals } from '../src/lib/utils/currency';

console.log('================================================================');
console.log('🚚 Task 31 Verification: FreeDeliveryProgressBar Component');
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

// 1. Currency & Bengali numeral utilities check
console.log('🔹 1. Currency & Bengali Numerals:');
assert(toBengaliNumerals(149) === '১৪৯', 'toBengaliNumerals(149) correctly converts to Bengali digits "১৪৯"');
assert(toBengaliNumerals(499) === '৪৯৯', 'toBengaliNumerals(499) correctly converts to "৪৯৯"');
assert(formatINR(499, 'bn') === '₹৪৯৯', 'formatINR(499, "bn") returns "₹৪৯৯"');
assert(formatINR(499, 'en') === '₹499', 'formatINR(499, "en") returns "₹499"');
assert(formatINR(1250, 'bn') === '₹১,২৫০', 'formatINR(1250, "bn") returns Indian comma formatted "₹১,২৫০"');

// 2. Component rendering when subtotal < threshold in Bengali
console.log('\n🔹 2. Subtotal < Threshold (Bengali mode):');
const htmlBnLocked = renderToString(
  React.createElement(FreeDeliveryProgressBar, { subtotal: 350, threshold: 499, language: 'bn' })
);

assert(htmlBnLocked.includes('আর মাত্র'), 'Contains "আর মাত্র" shortfall prefix');
assert(htmlBnLocked.includes('₹১৪৯'), 'Contains shortfall amount formatted in Bengali numerals "₹১৪৯"');
assert(htmlBnLocked.includes('সম্পূর্ণ ফ্রি ডেলিভারি!'), 'Contains "সম্পূর্ণ ফ্রি ডেলিভারি!"');
assert(htmlBnLocked.includes('role="progressbar"'), 'Contains role="progressbar" for ARIA compliance');
assert(htmlBnLocked.includes('aria-valuenow="350"'), 'ARIA valuenow reflects subtotal (350)');
assert(htmlBnLocked.includes('aria-valuemin="0"'), 'ARIA valuemin is 0');
assert(htmlBnLocked.includes('aria-valuemax="499"'), 'ARIA valuemax is 499');
assert(htmlBnLocked.includes('animate-pulse'), 'Truck icon has pulse animation when locked');
assert(htmlBnLocked.includes('bg-amber-50'), 'Contains amber warning styling when threshold not yet reached');

// 3. Component rendering when subtotal < threshold in English
console.log('\n🔹 3. Subtotal < Threshold (English mode):');
const htmlEnLocked = renderToString(
  React.createElement(FreeDeliveryProgressBar, { subtotal: 300, threshold: 499, language: 'en' })
);

assert(htmlEnLocked.includes('Add'), 'Contains "Add" in English');
assert(htmlEnLocked.includes('₹199'), 'Contains English shortfall amount "₹199"');
assert(htmlEnLocked.includes('more to get'), 'Contains "more to get"');
assert(htmlEnLocked.includes('FREE Delivery!'), 'Contains "FREE Delivery!"');
assert(htmlEnLocked.includes('aria-valuenow="300"'), 'ARIA valuenow reflects subtotal (300)');

// 4. Component rendering when subtotal >= threshold in Bengali (Unlocked)
console.log('\n🔹 4. Subtotal >= Threshold (Bengali unlocked mode):');
const htmlBnUnlocked = renderToString(
  React.createElement(FreeDeliveryProgressBar, { subtotal: 550, threshold: 499, language: 'bn' })
);

assert(
  htmlBnUnlocked.includes('অভিনন্দন! এই অর্ডারে আপনি পাচ্ছেন সম্পূর্ণ ফ্রি ডেলিভারি!'),
  'Displays exact congratulatory unlock message: "অভিনন্দন! এই অর্ডারে আপনি পাচ্ছেন সম্পূর্ণ ফ্রি ডেলিভারি!"'
);
assert(htmlBnUnlocked.includes('bg-emerald-50'), 'Emerald green container styling applied when unlocked');
assert(htmlBnUnlocked.includes('border-emerald-300'), 'Emerald green border applied when unlocked');
assert(htmlBnUnlocked.includes('width:100%'), 'Visual progress bar fill reaches 100%');
assert(htmlBnUnlocked.includes('aria-valuenow="499"'), 'ARIA valuenow clamped to max threshold');

// 5. Component rendering when subtotal >= threshold in English (Unlocked)
console.log('\n🔹 5. Subtotal >= Threshold (English unlocked mode):');
const htmlEnUnlocked = renderToString(
  React.createElement(FreeDeliveryProgressBar, { subtotal: 499, threshold: 499, language: 'en' })
);

assert(
  htmlEnUnlocked.includes("Congratulations! You&#x27;ve unlocked FREE Delivery on this order!") ||
  htmlEnUnlocked.includes("Congratulations! You've unlocked FREE Delivery on this order!"),
  'Displays English congratulatory unlock message'
);
assert(htmlEnUnlocked.includes('Unlocked'), 'Pill shows "Unlocked" in English');
assert(htmlEnUnlocked.includes('width:100%'), 'Progress bar is at 100%');

// 6. Dynamic Custom Threshold tracking
console.log('\n🔹 6. Dynamic Custom Threshold (e.g. ₹999):');
const htmlCustomThreshold = renderToString(
  React.createElement(FreeDeliveryProgressBar, { subtotal: 500, threshold: 999, language: 'en' })
);

assert(htmlCustomThreshold.includes('aria-valuemax="999"'), 'ARIA valuemax adapts to custom threshold (999)');
assert(htmlCustomThreshold.includes('₹499'), 'Calculates shortfall of 999 - 500 = 499');
assert(htmlCustomThreshold.includes('width:50%'), 'Visual progress bar calculates 500/999 = 50%');

console.log('\n================================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed} TASK 31 SPECIFICATION CHECKS PASSED!`);
} else {
  console.error(`❌ ${failed} CHECKS FAILED (${passed} passed)`);
  process.exit(1);
}
console.log('================================================================\n');
