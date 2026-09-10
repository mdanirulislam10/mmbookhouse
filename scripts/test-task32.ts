import React from 'react';
import { renderToString } from 'react-dom/server';
import { FreeDeliveryCelebration } from '../src/components/cart/FreeDeliveryCelebration';

console.log('================================================================');
console.log('🎉 Task 32 Verification: FreeDeliveryCelebration Component');
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

// 1. Rendering condition when subtotal < threshold (default ₹499)
console.log('🔹 1. Subtotal < Threshold (Default ₹499):');
const htmlSubtotal300 = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 300, threshold: 499 })
);
assert(htmlSubtotal300 === '', 'Component returns empty (null) when subtotal (300) < threshold (499)');

const htmlSubtotal498 = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 498, threshold: 499 })
);
assert(htmlSubtotal498 === '', 'Boundary check: 498 < 499 returns empty (null)');

// 2. Rendering condition when subtotal >= threshold
console.log('\n🔹 2. Subtotal >= Threshold (Boundary and Unlocked):');
const htmlSubtotal499 = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 499, threshold: 499, language: 'bn' })
);
assert(htmlSubtotal499 !== '', 'Boundary check: subtotal exactly 499 renders celebration badge');

const htmlSubtotal650 = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 650, threshold: 499, language: 'bn' })
);
assert(htmlSubtotal650 !== '', 'Subtotal 650 renders celebration badge');

// 3. forceShow override
console.log('\n🔹 3. Force Show Override:');
const htmlForced = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 100, threshold: 499, forceShow: true, language: 'bn' })
);
assert(htmlForced !== '', 'Renders when forceShow=true even if subtotal is below threshold');

// 4. Custom threshold dynamic tracking
console.log('\n🔹 4. Custom Threshold (e.g. ₹799):');
const htmlCustomBelow = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 600, threshold: 799 })
);
assert(htmlCustomBelow === '', 'Custom threshold ₹799: subtotal 600 does NOT render');

const htmlCustomAbove = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 800, threshold: 799 })
);
assert(htmlCustomAbove !== '', 'Custom threshold ₹799: subtotal 800 renders celebration');

// 5. Localized Bilingual Messaging (Bengali Mode)
console.log('\n🔹 5. Bengali Localized Messaging:');
const htmlBn = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 550, threshold: 499, language: 'bn' })
);
assert(
  htmlBn.includes('🎉 অভিনন্দন! আপনি সম্পূর্ণ ফ্রি ডেলিভারি পেয়ে গেছেন!'),
  'Contains exact Bengali headline: "🎉 অভিনন্দন! আপনি সম্পূর্ণ ফ্রি ডেলিভারি পেয়ে গেছেন!"'
);
assert(
  htmlBn.includes('অর্ডার করার সময় কোনো শিপিং চার্জ প্রযোজ্য হবে না'),
  'Contains Bengali subtext explanation regarding zero shipping fee'
);
assert(
  htmlBn.includes('Zero Shipping Fee applied at checkout'),
  'Contains bilingual English translation "(Zero Shipping Fee applied at checkout)"'
);
assert(htmlBn.includes('ফ্রি শিপিং'), 'Contains Bengali pill badge text "ফ্রি শিপিং"');

// 6. Localized Bilingual Messaging (English Mode)
console.log('\n🔹 6. English Localized Messaging:');
const htmlEn = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 550, threshold: 499, language: 'en' })
);
assert(
  htmlEn.includes('🎉 Congratulations! You have unlocked FREE Delivery on this order!'),
  'Contains exact English headline: "🎉 Congratulations! You have unlocked FREE Delivery on this order!"'
);
assert(
  htmlEn.includes('Zero Shipping Fee applied at checkout'),
  'Contains English subtext explanation'
);
assert(htmlEn.includes('FREE SHIPPING'), 'Contains English pill badge text "FREE SHIPPING"');

// 7. Visual Styling & Celebratory Elements
console.log('\n🔹 7. Visual Styling & Celebratory Elements:');
assert(htmlBn.includes('border-emerald-300'), 'Uses emerald green border (border-emerald-300)');
assert(htmlBn.includes('from-emerald-50'), 'Uses emerald gradient background');
assert(htmlBn.includes('text-emerald-950'), 'Uses high-contrast accessible emerald text styling');
assert(htmlBn.includes('ring-emerald-200'), 'Uses subtle emerald ring for high visual fidelity');

// 8. Confetti burst effect and CSS keyframe styles
console.log('\n🔹 8. Confetti Burst Particles & CSS Keyframes:');
assert(htmlBn.includes('animate-confetti'), 'Contains confetti particle elements');
assert(htmlBn.includes('@keyframes confetti-fall'), 'Contains embedded CSS keyframe animation for confetti burst');

const htmlNoConfetti = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 550, threshold: 499, disableConfetti: true })
);
assert(!htmlNoConfetti.includes('animate-confetti'), 'disableConfetti=true omits confetti particles for reduced motion');

// 9. Compact Badge Mode
console.log('\n🔹 9. Compact Badge Mode:');
const htmlCompact = renderToString(
  React.createElement(FreeDeliveryCelebration, { subtotal: 550, threshold: 499, compact: true, language: 'bn' })
);
assert(
  htmlCompact.includes('data-testid="free-delivery-celebration-compact"'),
  'Renders compact container with data-testid="free-delivery-celebration-compact"'
);
assert(
  htmlCompact.includes('🎉 অভিনন্দন! আপনি সম্পূর্ণ ফ্রি ডেলিভারি পেয়ে গেছেন!'),
  'Compact mode includes celebratory headline'
);
assert(htmlCompact.includes('rounded-full'), 'Compact mode renders sleek rounded-full pill');

// 10. Dismiss Button
console.log('\n🔹 10. Dismissibility:');
const onDismissMock = () => {};
const htmlDismissible = renderToString(
  React.createElement(FreeDeliveryCelebration, {
    subtotal: 550,
    threshold: 499,
    onDismiss: onDismissMock,
    language: 'bn',
  })
);
assert(htmlDismissible.includes('aria-label="বিজ্ঞপ্তি বন্ধ করুন"'), 'Renders dismiss close button when onDismiss prop is provided');

const htmlDismissibleEn = renderToString(
  React.createElement(FreeDeliveryCelebration, {
    subtotal: 550,
    threshold: 499,
    onDismiss: onDismissMock,
    language: 'en',
  })
);
assert(htmlDismissibleEn.includes('aria-label="Dismiss celebration"'), 'Renders localized English dismiss button');

// 11. WCAG 2.1 AA Accessibility & ARIA compliance
console.log('\n🔹 11. Accessibility & ARIA:');
assert(htmlBn.includes('role="status"'), 'Uses role="status" for live screen reader announcement');
assert(htmlBn.includes('aria-live="polite"'), 'Uses aria-live="polite" to avoid interrupting user speech');
assert(htmlBn.includes('aria-label='), 'Includes descriptive aria-label');

console.log('\n================================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed} TASK 32 SPECIFICATION CHECKS PASSED!`);
} else {
  console.error(`❌ ${failed} CHECKS FAILED (${passed} passed)`);
  process.exit(1);
}
console.log('================================================================\n');
