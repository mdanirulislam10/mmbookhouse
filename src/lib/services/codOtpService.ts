/**
 * Module 12: Cash on Delivery (COD) Anti-Fraud OTP Verification Service
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements Item 26 from proposed_modules.md:
 * - 4-Digit cryptographically secure OTP generation (crypto.randomInt)
 * - Salted SHA-256 hash storage (raw OTP is never persisted)
 * - 60-second cooldown rate limiting between resends
 * - 10-minute validity window
 * - Maximum 3 failed attempts lockout
 * - Server-side validation gate before placing COD orders
 */

import crypto from 'crypto';

export const COD_OTP_COOLDOWN_SECONDS = 60;
export const COD_OTP_EXPIRY_MINUTES = 10;
export const COD_OTP_MAX_ATTEMPTS = 3;

export interface CodOtpRecord {
  phone: string;
  sessionId: string;
  hashedOtp: string;
  salt: string;
  attemptsCount: number;
  maxAttempts: number;
  isLocked: boolean;
  isVerified: boolean;
  expiresAt: number; // Unix ms
  lastGeneratedAt: number; // Unix ms
}

export interface GeneratedCodOtpResult {
  rawOtp: string; // Used for SMS/WhatsApp dispatch
  maskedPhone: string;
  expiresAt: number;
  cooldownSeconds: number;
}

export interface VerifyCodOtpResult {
  success: boolean;
  isLocked: boolean;
  remainingAttempts: number;
  error?: string;
  errorBn?: string;
}

// In-memory active verification store (keyed by `${sessionId}_${phone}`)
const activeCodOtpStore = new Map<string, CodOtpRecord>();

function getStorageKey(sessionId: string, phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  return `${sessionId.trim()}_${cleanPhone}`;
}

/**
 * Computes salted SHA-256 hash of the 4-digit OTP
 */
export function hashCodOtp(rawOtp: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(`${rawOtp.trim()}::${salt.trim()}`, 'utf8')
    .digest('hex');
}

/**
 * Mask phone number for security display: 98******45
 */
export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const last10 = clean.slice(-10);
    return `${last10.slice(0, 2)}******${last10.slice(-2)}`;
  }
  return phone;
}

/**
 * Generates a cryptographically secure 4-digit COD OTP
 */
export function generateCodOtp(
  sessionId: string,
  phone: string
): { success: boolean; result?: GeneratedCodOtpResult; error?: string; errorBn?: string } {
  const key = getStorageKey(sessionId, phone);
  const existing = activeCodOtpStore.get(key);
  const now = Date.now();

  if (existing) {
    const elapsedSeconds = Math.floor((now - existing.lastGeneratedAt) / 1000);
    if (elapsedSeconds < COD_OTP_COOLDOWN_SECONDS) {
      const waitRemaining = COD_OTP_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        error: `Please wait ${waitRemaining} seconds before requesting a new OTP`,
        errorBn: `নতুন ওটিপি পাওয়ার জন্য আরও ${waitRemaining} সেকেন্ড অপেক্ষা করুন।`,
      };
    }
  }

  // Generate secure 4-digit numeric OTP between 1000 and 9999
  const rawNum = crypto.randomInt(1000, 10000);
  const rawOtp = String(rawNum);

  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = hashCodOtp(rawOtp, salt);
  const expiresAt = now + COD_OTP_EXPIRY_MINUTES * 60 * 1000;

  const record: CodOtpRecord = {
    phone: phone.replace(/\D/g, '').slice(-10),
    sessionId,
    hashedOtp,
    salt,
    attemptsCount: 0,
    maxAttempts: COD_OTP_MAX_ATTEMPTS,
    isLocked: false,
    isVerified: false,
    expiresAt,
    lastGeneratedAt: now,
  };

  activeCodOtpStore.set(key, record);

  return {
    success: true,
    result: {
      rawOtp,
      maskedPhone: maskPhoneNumber(phone),
      expiresAt,
      cooldownSeconds: COD_OTP_COOLDOWN_SECONDS,
    },
  };
}

/**
 * Verifies the 4-digit OTP provided by the customer
 */
export function verifyCodOtp(
  sessionId: string,
  phone: string,
  candidateOtp: string
): VerifyCodOtpResult {
  const key = getStorageKey(sessionId, phone);
  const record = activeCodOtpStore.get(key);
  const now = Date.now();

  if (!record) {
    return {
      success: false,
      isLocked: false,
      remainingAttempts: 0,
      error: 'No active OTP verification session found. Please request a new code.',
      errorBn: 'কোনো সক্রিয় ওটিপি পাওয়া যায়নি। অনুগ্রহ করে পুনরায় ওটিপি কোড চান।',
    };
  }

  if (record.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingAttempts: 0,
      error: 'Maximum attempts exceeded. This verification session is locked for security.',
      errorBn: 'সর্বোচ্চ সীমা অতিক্রম করায় এই ওটিপি সেশনটি লক করা হয়েছে। নতুন ওটিপি চান।',
    };
  }

  if (now > record.expiresAt) {
    activeCodOtpStore.delete(key);
    return {
      success: false,
      isLocked: false,
      remainingAttempts: 0,
      error: 'OTP has expired. Please request a fresh code.',
      errorBn: 'ওটিপির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন ওটিপি চান।',
    };
  }

  const computedHash = hashCodOtp(candidateOtp, record.salt);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(record.hashedOtp, 'hex')
  );

  if (!isMatch) {
    record.attemptsCount += 1;
    const remaining = Math.max(0, record.maxAttempts - record.attemptsCount);

    if (record.attemptsCount >= record.maxAttempts) {
      record.isLocked = true;
      return {
        success: false,
        isLocked: true,
        remainingAttempts: 0,
        error: 'Incorrect OTP. Maximum verification attempts reached.',
        errorBn: 'ভুল ওটিপি কোড। সর্বোচ্চ চেষ্টার সীমা শেষ হয়ে গেছে।',
      };
    }

    return {
      success: false,
      isLocked: false,
      remainingAttempts: remaining,
      error: `Invalid OTP code. ${remaining} attempts remaining.`,
      errorBn: `ভুল ওটিপি কোড। আপনার আর ${remaining}টি সুযোগ অবশিষ্ট আছে।`,
    };
  }

  // Verified successfully!
  record.isVerified = true;
  return {
    success: true,
    isLocked: false,
    remainingAttempts: record.maxAttempts - record.attemptsCount,
  };
}

/**
 * Validates whether a given session & phone has an active, verified COD OTP record
 * Called by placeOrderAction server-side.
 */
export function isCodOtpAuthorized(
  sessionId: string,
  phone: string,
  submittedOtp?: string
): boolean {
  const key = getStorageKey(sessionId, phone);
  const record = activeCodOtpStore.get(key);
  const now = Date.now();

  if (!record) return false;
  if (now > record.expiresAt || record.isLocked) return false;

  // If already verified via verifyCodOtp
  if (record.isVerified) return true;

  // Alternatively, if submitted alongside payload, verify directly
  if (submittedOtp && submittedOtp.length === 4) {
    const result = verifyCodOtp(sessionId, phone, submittedOtp);
    return result.success;
  }

  return false;
}

/**
 * Clears OTP state upon order confirmation
 */
export function consumeCodOtp(sessionId: string, phone: string): void {
  const key = getStorageKey(sessionId, phone);
  activeCodOtpStore.delete(key);
}

/**
 * Resets store for testing
 */
export function resetCodOtpStoreForTesting(): void {
  activeCodOtpStore.clear();
}
