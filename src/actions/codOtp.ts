'use server';

/**
 * Module 12: COD OTP Server Actions
 * Handles generation and verification of 4-digit numeric anti-fraud OTP for COD orders.
 */

import {
  generateCodOtp,
  verifyCodOtp,
  maskPhoneNumber,
  VerifyCodOtpResult,
} from '@/lib/services/codOtpService';

export interface GenerateCodOtpResponse {
  success: boolean;
  maskedPhone?: string;
  cooldownSeconds?: number;
  error?: string;
  errorBn?: string;
  /** In development/testing, returns raw OTP for auto-fill or testing verification */
  devOtp?: string;
}

/**
 * Server Action: Triggers COD OTP Generation & Dispatch
 */
export async function requestCodOtpAction(
  sessionId: string,
  phone: string
): Promise<GenerateCodOtpResponse> {
  if (!sessionId || !phone) {
    return {
      success: false,
      error: 'Session ID and phone number are required',
      errorBn: 'সেশন আইডি এবং মোবাইল নম্বর আবশ্যক।',
    };
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return {
      success: false,
      error: 'Invalid phone number format',
      errorBn: 'সঠিক ১০-সংখ্যার মোবাইল নম্বর প্রদান করুন।',
    };
  }

  const res = generateCodOtp(sessionId, cleanPhone);

  if (!res.success || !res.result) {
    return {
      success: false,
      error: res.error || 'Failed to generate OTP',
      errorBn: res.errorBn || 'ওটিপি তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে অপেক্ষা করে আবার চেষ্টা করুন।',
    };
  }

  // In production, integrate SMS/WhatsApp dispatch here (e.g. notificationProviderService)
  // For seamless testing/demo: expose devOtp in non-production or test environments
  const isDevOrTest = process.env.NODE_ENV !== 'production';

  return {
    success: true,
    maskedPhone: res.result.maskedPhone,
    cooldownSeconds: res.result.cooldownSeconds,
    devOtp: isDevOrTest ? res.result.rawOtp : undefined,
  };
}

/**
 * Server Action: Validates Submitted 4-Digit COD OTP
 */
export async function verifyCodOtpAction(
  sessionId: string,
  phone: string,
  otp: string
): Promise<VerifyCodOtpResult> {
  if (!sessionId || !phone || !otp) {
    return {
      success: false,
      isLocked: false,
      remainingAttempts: 0,
      error: 'Missing verification parameters',
      errorBn: 'প্রয়োজনীয় তথ্য অনুপস্থিত।',
    };
  }

  return verifyCodOtp(sessionId, phone, otp);
}
