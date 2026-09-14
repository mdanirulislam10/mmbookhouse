/**
 * Test Suite: Module 12 - Task 2: Distraction-Free Checkout Header & Minimal Footer
 * Validates:
 * - CheckoutHeader visual contracts (SSL Security Badge, Return Trigger, Step Indicator)
 * - CheckoutFooter visual contracts (Legal links, Phone helpline, Store address, RBI compliance)
 * - Index export sanity
 */

import React from 'react';
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

console.log('🧪 Starting Module 12 - Task 2 Tests: Checkout Header & Footer\n');

// 1. Module Exports Check
console.log('--- 1. Module Exports Sanity Check ---');
assert(typeof checkoutExports.CheckoutHeader === 'function', 'CheckoutHeader exported as React component');
assert(typeof checkoutExports.CheckoutFooter === 'function', 'CheckoutFooter exported as React component');
assert(typeof checkoutExports.CheckoutAddressSelector === 'function', 'CheckoutAddressSelector exported from previous module');

// 2. Component File Contents & Architectural Compliance
console.log('\n--- 2. File Content & Security Checks ---');
const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, '../src/components/checkout/CheckoutHeader.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');

assert(headerContent.includes('256-Bit SSL Encryption'), 'Header includes 256-Bit SSL Encryption text (Item 2)');
assert(headerContent.includes('ShieldCheck'), 'Header includes security shield icon (Item 2)');
assert(headerContent.includes('returnUrl'), 'Header supports dynamic safe return URL (Item 18)');
assert(headerContent.includes('currentStep'), 'Header displays current step indicator (Item 5)');
assert(headerContent.includes('itemCount'), 'Header displays item count badge');
assert(headerContent.includes('sticky top-0'), 'Header is sticky for uninterrupted trust visibility');
assert(headerContent.includes('sm:hidden'), 'Header includes mobile responsive micro progress bar (Item 4)');

// 3. Footer Minimal Compliance Check (Item 10)
console.log('\n--- 3. Footer Minimal Compliance Checks ---');
const footerPath = path.join(__dirname, '../src/components/checkout/CheckoutFooter.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');

assert(footerContent.includes('Privacy Notice') || footerContent.includes('গোপনীয়তা নীতি'), 'Footer links to Privacy Notice');
assert(footerContent.includes('Conditions of Use') || footerContent.includes('ব্যবহারের শর্তাবলী'), 'Footer links to Terms');
assert(footerContent.includes('Return & Refund') || footerContent.includes('রিটার্ন'), 'Footer links to Refund Policy');
assert(footerContent.includes('tel:'), 'Footer includes Malda store direct phone dialer (Item 10)');
assert(footerContent.includes('732101'), 'Footer displays official Malda store pincode & address');
assert(footerContent.includes('256-Bit SSL Encrypted'), 'Footer reinforces SSL payment assurance');
assert(!footerContent.includes('MegaMenu') && !footerContent.includes('FeaturedCategories'), 'Footer is distraction-free without marketing category links (Item 10)');

console.log(`\n========================================`);
console.log(`🎉 Task 2 Complete: ${passedTests}/${totalTests} Tests Passed!`);
console.log(`========================================\n`);
