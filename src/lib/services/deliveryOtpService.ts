/**
 * Module 11 Task 9: Delivery Handover OTP Engine
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Item 20):
 * - 4-Digit cryptographically secure delivery handover OTP
 * - Salted SHA-256 hash storage (raw OTP is never persisted in database)
 * - Maximum 3 failed attempts lockout protection
 * - 60-second cooldown rate limit between OTP resends
 * - 24-hour expiration window
 * - Bilingual SMS and WhatsApp dispatch message generators
 */

import crypto from 'crypto';

export const OTP_MAX_ATTEMPTS = 3;
export const OTP_COOLDOWN_SECONDS = 60;
export const OTP_EXPIRY_HOURS = 24;

export interface DeliveryOtpRecord {
  orderId: string;
  hashedOtp: string;
  salt: string;
  attemptsCount: number;
  maxAttempts: number;
  isLocked: boolean;
  expiresAt: string;
  lastGeneratedAt: string;
  deliveryVerifiedAt?: string | null;
}

export interface GeneratedOtpResult {
  /** The 4-digit raw numeric OTP (Returned ONLY at generation time for SMS/WhatsApp dispatch) */
  rawOtp: string;
  hashedOtp: string;
  salt: string;
  expiresAt: string;
  lastGeneratedAt: string;
}

export interface VerifyOtpResult {
  success: boolean;
  isLocked: boolean;
  remainingAttempts: number;
  error?: string;
  errorBn?: string;
  verifiedAt?: string;
}

/**
 * Computes salted SHA-256 hash of the 4-digit OTP
 */
export function hashOtp(rawOtp: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(`${rawOtp.trim()}::${salt.trim()}`, 'utf8')
    .digest('hex');
}

/**
 * Generates a cryptographically secure 4-digit numeric delivery OTP and salted hash
 */
export function generateDeliveryOtp(orderId: string): GeneratedOtpResult {
  // Generate secure 4-digit number between 1000 and 9999
  const rawNum = crypto.randomInt(1000, 10000);
  const rawOtp = String(rawNum);

  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = hashOtp(rawOtp, salt);

  const now = new Date();
  const expires = new Date(now.getTime() + OTP_EXPIRY_HOURS * 3600 * 1000);

  return {
    rawOtp,
    hashedOtp,
    salt,
    expiresAt: expires.toISOString(),
    lastGeneratedAt: now.toISOString(),
  };
}

/**
 * Checks if a new OTP can be requested (enforces 60-second cooldown rate limit)
 */
export function canResendDeliveryOtp(lastGeneratedAt: string): {
  canResend: boolean;
  cooldownRemainingSeconds: number;
} {
  const lastTime = new Date(lastGeneratedAt).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - lastTime) / 1000);

  if (elapsedSeconds < OTP_COOLDOWN_SECONDS) {
    return {
      canResend: false,
      cooldownRemainingSeconds: OTP_COOLDOWN_SECONDS - elapsedSeconds,
    };
  }

  return {
    canResend: true,
    cooldownRemainingSeconds: 0,
  };
}

/**
 * Verifies a 4-digit OTP provided by the recipient during parcel delivery handover
 */
export function verifyDeliveryOtp(
  inputOtp: string,
  record: DeliveryOtpRecord
): VerifyOtpResult {
  // 1. Check if already locked due to previous 3 failed attempts
  if (record.isLocked || record.attemptsCount >= record.maxAttempts) {
    return {
      success: false,
      isLocked: true,
      remainingAttempts: 0,
      error: 'Delivery OTP is locked due to 3 consecutive failed attempts. Contact support.',
      errorBn: '৩ বার ভুল ওটিপি দেওয়ার কারণে ডেলিভারি ভেরিফিকেশন সাময়িকভাবে লক করা হয়েছে। সহায়তার জন্য যোগাযোগ করুন।',
    };
  }

  // 2. Check expiration
  const now = new Date();
  if (new Date(record.expiresAt) < now) {
    return {
      success: false,
      isLocked: false,
      remainingAttempts: record.maxAttempts - record.attemptsCount,
      error: 'Delivery OTP has expired. Please request a new OTP.',
      errorBn: 'ডেলিভারি ওটিপি-এর মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন ওটিপি সংগ্রহ করুন।',
    };
  }

  // 3. Normalize input (accepts both English '1234' and Bengali '১২৩৪' numerals)
  const normalizedOtp = inputOtp
    .replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit).toString())
    .trim();

  if (!/^\d{4}$/.test(normalizedOtp)) {
    return {
      success: false,
      isLocked: false,
      remainingAttempts: record.maxAttempts - record.attemptsCount,
      error: 'Invalid OTP format. Please enter exactly 4 digits.',
      errorBn: 'ভুল ওটিপি ফরম্যাট। অনুগ্রহ করে ঠিক ৪টি সংখ্যা প্রবেশ করান।',
    };
  }

  // 4. Constant-time hash comparison.
  // Guard buffer lengths first: crypto.timingSafeEqual throws a RangeError when
  // the two buffers differ in size (e.g. empty or malformed stored hash), which
  // would crash handover verification instead of failing gracefully.
  const inputHash = hashOtp(normalizedOtp, record.salt);
  const inputBuffer = Buffer.from(inputHash, 'hex');
  const storedBuffer = Buffer.from(record.hashedOtp || '', 'hex');
  const isMatch =
    inputBuffer.length > 0 &&
    inputBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, storedBuffer);

  if (isMatch) {
    return {
      success: true,
      isLocked: false,
      remainingAttempts: record.maxAttempts - record.attemptsCount,
      verifiedAt: new Date().toISOString(),
    };
  }

  // Failed attempt
  const updatedAttempts = record.attemptsCount + 1;
  const isNowLocked = updatedAttempts >= record.maxAttempts;
  const remaining = Math.max(0, record.maxAttempts - updatedAttempts);

  return {
    success: false,
    isLocked: isNowLocked,
    remainingAttempts: remaining,
    error: isNowLocked
      ? '3 consecutive failed attempts. Delivery verification is now locked.'
      : `Incorrect OTP. You have ${remaining} attempt(s) remaining.`,
    errorBn: isNowLocked
      ? '৩ বার ভুল ওটিপি দেওয়া হয়েছে। ডেলিভারি ওটিপি লক করা হলো।'
      : `ভুল ওটিপি। আপনার কাছে আর মাত্র ${remaining}টি সুযোগ অবশিষ্ট আছে।`,
  };
}

/**
 * Generates transactional SMS / WhatsApp notification texts for dispatching the OTP to customer
 */
export function formatOtpNotificationMessage(
  recipientName: string,
  rawOtp: string,
  orderId: string
): {
  smsTextBn: string;
  smsTextEn: string;
  whatsAppTextBn: string;
  whatsAppTextEn: string;
} {
  const smsTextBn = `M.M Book House: অর্ডার #${orderId}-এর ডেলিভারি ওটিপি হলো ${rawOtp}। পার্সেল পাওয়ার পর রাইডারকে এই কোডটি বলুন। এটি কাউকে শেয়ার করবেন না।`;
  const smsTextEn = `M.M Book House: Delivery OTP for Order #${orderId} is ${rawOtp}. Share this with delivery rider only upon receiving the package.`;

  const whatsAppTextBn = `📚 *M.M Book House Malda - ডেলিভারি আপডেট*\n\nনমস্কার *${recipientName}*,\nআপনার অর্ডার *#${orderId}* ডেলিভারি রাইডারের সাথে আপনার ঠিকানায় আসছে।\n\n🔒 *ডেলিভারি ওটিপি: ${rawOtp}*\n\n⚠️ পার্সেলটি হাতে পাওয়ার পরেই কেবল ডেলিভারি রাইডারকে এই ওটিপিটি প্রদান করুন।`;
  const whatsAppTextEn = `📚 *M.M Book House Malda - Delivery Handover*\n\nHello *${recipientName}*,\nYour order *#${orderId}* is out for delivery with our rider.\n\n🔒 *Delivery OTP: ${rawOtp}*\n\n⚠️ Share this OTP with the rider only after receiving your package.`;

  return { smsTextBn, smsTextEn, whatsAppTextBn, whatsAppTextEn };
}
