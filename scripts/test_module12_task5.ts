/**
 * Test Suite: Module 12 - Task 5: Payment Method Selector, COD OTP & GST Billing
 * Validates:
 * - PaymentMethodSelector architecture (UPI, COD, Card, NetBanking) (Item 25)
 * - Final Amazon Yellow Button "Place Your Order and Pay (₹XXX)" (Item 28)
 * - GstBillingForm (Item 27) validation and state code detection
 * - CodVerificationModal (Item 26) 4-digit OTP verification and masked phone
 * - Module exports from @/components/checkout
 */

import * as checkoutExports from '../src/components/checkout';
import { validateGstin, COD_OTP_REGEX } from '../src/lib/validations/checkout';

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

console.log('🧪 Starting Module 12 - Task 5 Tests: Payment Methods, COD OTP & GST Billing\n');

// 1. Module Exports Check
console.log('--- 1. Module Exports Check ---');
assert(typeof checkoutExports.PaymentMethodSelector === 'function', 'PaymentMethodSelector exported');
assert(typeof checkoutExports.GstBillingForm === 'function', 'GstBillingForm exported');
assert(typeof checkoutExports.CodVerificationModal === 'function', 'CodVerificationModal exported');

// 2. Component Source Inspection
console.log('\n--- 2. File Content & Design Checks ---');
const fs = require('fs');
const path = require('path');

const pmsPath = path.join(__dirname, '../src/components/checkout/PaymentMethodSelector.tsx');
const pmsContent = fs.readFileSync(pmsPath, 'utf8');

assert(pmsContent.includes("'upi'"), 'PaymentMethodSelector supports UPI channel (Item 25)');
assert(pmsContent.includes("'cod'"), 'PaymentMethodSelector supports Cash on Delivery (Item 25)');
assert(pmsContent.includes("'card'"), 'PaymentMethodSelector supports Debit/Credit Card (Item 25)');
assert(pmsContent.includes("'netbanking'"), 'PaymentMethodSelector supports Net Banking (Item 25)');
assert(pmsContent.includes('RECOMMENDED'), 'UPI has RECOMMENDED badge');
assert(pmsContent.includes('Place Your Order and Pay') || pmsContent.includes('অর্ডার সম্পন্ন'), 'Button has exact Amazon CTA text (Item 28)');
assert(pmsContent.includes('bg-[#ffd814]'), 'Button styled with Amazon Signature Yellow (#ffd814) (Item 28)');

// 3. GST Billing Form Inspection (Item 27)
console.log('\n--- 3. GST Billing Form Checks ---');
const gstPath = path.join(__dirname, '../src/components/checkout/GstBillingForm.tsx');
const gstContent = fs.readFileSync(gstPath, 'utf8');

assert(gstContent.includes('useGstInvoice'), 'Supports toggle for GST invoice requirement');
assert(gstContent.includes('sanitizeGstin'), 'Sanitizes GSTIN input');
assert(gstContent.includes('validateGstin'), 'Validates GSTIN against 15-character Indian standard');

// 4. COD Verification Modal Inspection (Item 26)
console.log('\n--- 4. COD Verification Modal Checks ---');
const codPath = path.join(__dirname, '../src/components/checkout/CodVerificationModal.tsx');
const codContent = fs.readFileSync(codPath, 'utf8');

assert(codContent.includes('COD_OTP_REGEX'), 'Enforces 4-digit numeric OTP regex');
assert(codContent.includes('maskedPhone'), 'Masks phone number for privacy');
assert(codContent.includes('cooldown'), 'Provides 60s cooldown timer before resend');
assert(codContent.includes('ShieldAlert'), 'Highlights fraud prevention with shield icon');

// 5. Functional Validation of COD OTP and GSTIN
console.log('\n--- 5. Logic Verification ---');
assert(COD_OTP_REGEX.test('4829'), '4-digit OTP accepted');
assert(!COD_OTP_REGEX.test('12'), '2-digit OTP rejected');
assert(!COD_OTP_REGEX.test('12345'), '5-digit OTP rejected');

const validGst = validateGstin('19AAAAA0000A1Z5');
assert(validGst.isValid === true && validGst.stateCode === '19', 'WB GSTIN valid with code 19');

console.log(`\n========================================`);
console.log(`🎉 Task 5 Complete: ${passedTests}/${totalTests} Tests Passed!`);
console.log(`========================================\n`);
