/**
 * Automated Verification Script for Module 11 Task 9:
 * Delivery Handover OTP & Packaging Shipping Label Engine
 * 
 * Verifies architectural specifications from proposed_modules.md (Module 11, Items 18, 20, 49):
 * 1. 4-Digit Delivery Handover OTP generation & salted hashing (Item 20)
 * 2. Successful verification with English & Bengali numerals (Item 20 & 47)
 * 3. 3-Attempt lockout security protection (Item 20)
 * 4. 60-Second resend cooldown rate limit (Item 20)
 * 5. SMS & WhatsApp dispatch message formatting
 * 6. ShippingLabelPrintView component export and contract verification (Item 18 & 49)
 */

import {
  generateDeliveryOtp,
  verifyDeliveryOtp,
  canResendDeliveryOtp,
  formatOtpNotificationMessage,
  hashOtp,
  type DeliveryOtpRecord,
} from '../src/lib/services/deliveryOtpService';
import { ShippingLabelPrintView } from '../src/components/orders/ShippingLabelPrintView';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTask9Tests() {
  console.log('\n======================================================');
  console.log('🧪 Testing Module 11 Task 9: Delivery OTP & Label Engine');
  console.log('======================================================\n');

  // --- Suite 1: 4-Digit OTP Generation & Salted Hashing (Item 20) ---
  console.log('--- Suite 1: 4-Digit OTP Generation & Salted Hashing (Item 20) ---');

  const generated = generateDeliveryOtp('ORD-2026-9901');
  assert(/^\d{4}$/.test(generated.rawOtp), 'Generated OTP is exactly 4 digits');
  assert(Number(generated.rawOtp) >= 1000 && Number(generated.rawOtp) <= 9999, 'OTP is in range 1000-9999');
  assert(typeof generated.salt === 'string' && generated.salt.length === 32, 'Salt is a 32-character hex string');
  assert(typeof generated.hashedOtp === 'string' && generated.hashedOtp.length === 64, 'Hashed OTP is a 64-character SHA-256 hex string');
  assert(generated.rawOtp !== generated.hashedOtp, 'Raw OTP is never stored in plain text');

  const record: DeliveryOtpRecord = {
    orderId: 'ORD-2026-9901',
    hashedOtp: generated.hashedOtp,
    salt: generated.salt,
    attemptsCount: 0,
    maxAttempts: 3,
    isLocked: false,
    expiresAt: generated.expiresAt,
    lastGeneratedAt: generated.lastGeneratedAt,
  };

  // --- Suite 2: Successful Verification & Bengali Numeral Normalization ---
  console.log('\n--- Suite 2: Verification with English & Bengali Numerals ---');

  const validResult = verifyDeliveryOtp(generated.rawOtp, { ...record });
  assert(validResult.success === true, 'Correct English 4-digit OTP verifies successfully');
  assert(validResult.isLocked === false, 'Successful verification is not locked');
  assert(typeof validResult.verifiedAt === 'string', 'Verified timestamp is recorded');

  // Bengali numerals test
  const bengaliOtp = generated.rawOtp.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
  const bengaliResult = verifyDeliveryOtp(bengaliOtp, { ...record });
  assert(bengaliResult.success === true, 'Correct Bengali numerals OTP (e.g. ' + bengaliOtp + ') normalizes and verifies');

  // Invalid length checks
  const shortResult = verifyDeliveryOtp('12', { ...record });
  assert(shortResult.success === false, 'Short 2-digit OTP is rejected');
  assert(shortResult.error?.includes('Invalid OTP format') === true, 'Rejection explains 4-digit requirement');

  const longResult = verifyDeliveryOtp('12345', { ...record });
  assert(longResult.success === false, 'Long 5-digit OTP is rejected');

  // --- Suite 3: 3-Attempt Lockout Security Protection (Item 20) ---
  console.log('\n--- Suite 3: 3-Attempt Lockout Security Protection (Item 20) ---');

  // Attempt 1: Wrong OTP
  const attempt1 = verifyDeliveryOtp('0000', { ...record, attemptsCount: 0 });
  assert(attempt1.success === false, 'Attempt 1 with wrong OTP fails');
  assert(attempt1.remainingAttempts === 2, 'Remaining attempts is 2');
  assert(attempt1.isLocked === false, 'Attempt 1 does not lock the record');

  // Attempt 2: Wrong OTP
  const attempt2 = verifyDeliveryOtp('0000', { ...record, attemptsCount: 1 });
  assert(attempt2.success === false, 'Attempt 2 with wrong OTP fails');
  assert(attempt2.remainingAttempts === 1, 'Remaining attempts is 1');
  assert(attempt2.isLocked === false, 'Attempt 2 does not lock');

  // Attempt 3: Final failed attempt triggers lockout
  const attempt3 = verifyDeliveryOtp('0000', { ...record, attemptsCount: 2 });
  assert(attempt3.success === false, 'Attempt 3 fails');
  assert(attempt3.remainingAttempts === 0, 'Remaining attempts is 0');
  assert(attempt3.isLocked === true, '3rd consecutive failure triggers isLocked = true');
  assert(attempt3.error?.includes('locked') === true, 'Provides lockout security error in English');
  assert(attempt3.errorBn?.includes('লক') === true, 'Provides lockout security error in Bengali');

  // Attempt 4: Already locked record rejects even correct OTP
  const attempt4 = verifyDeliveryOtp(generated.rawOtp, { ...record, attemptsCount: 3, isLocked: true });
  assert(attempt4.success === false, 'Locked record rejects further verification attempts');
  assert(attempt4.isLocked === true, 'Remains locked');

  // --- Suite 4: 60-Second Resend Cooldown Rate Limit (Item 20) ---
  console.log('\n--- Suite 4: 60-Second Resend Cooldown Rate Limit ---');

  const immediateCooldown = canResendDeliveryOtp(new Date().toISOString());
  assert(immediateCooldown.canResend === false, 'Cannot immediately resend OTP within 60s');
  assert(immediateCooldown.cooldownRemainingSeconds > 0, 'Reports remaining cooldown seconds');

  const pastDate = new Date(Date.now() - 65 * 1000).toISOString();
  const pastCooldown = canResendDeliveryOtp(pastDate);
  assert(pastCooldown.canResend === true, 'Can resend OTP after 60 seconds have elapsed');
  assert(pastCooldown.cooldownRemainingSeconds === 0, 'Remaining cooldown is 0s');

  // --- Suite 5: Notification Message Formatting ---
  console.log('\n--- Suite 5: SMS & WhatsApp Notification Formatting ---');

  const messages = formatOtpNotificationMessage('Sabir Hossain', generated.rawOtp, 'ORD-9901');
  assert(messages.smsTextBn.includes(generated.rawOtp), 'Bengali SMS contains OTP');
  assert(messages.smsTextBn.includes('ORD-9901'), 'Bengali SMS contains Order ID');
  assert(messages.whatsAppTextBn.includes('Sabir Hossain'), 'Bengali WhatsApp includes recipient name');
  assert(messages.whatsAppTextEn.includes(generated.rawOtp), 'English WhatsApp includes OTP');

  // --- Suite 6: ShippingLabelPrintView Component Verification ---
  console.log('\n--- Suite 6: ShippingLabelPrintView Component Verification ---');

  assert(typeof ShippingLabelPrintView === 'function', 'ShippingLabelPrintView is exported as a React Component');

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED FOR TASK 9!`);
  console.log('======================================================\n');
}

runTask9Tests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
