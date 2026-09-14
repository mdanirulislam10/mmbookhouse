/**
 * Module 13 - Task 3: COD Anti-Fraud, ₹2,500 Cap, Handling Fee & RTO Blacklist Engine
 * 
 * Complies with:
 * - Item 11: COD Trust for first-time buyers in Malda/North Bengal.
 * - Item 12: 4-digit OTP SMS/WhatsApp verification.
 * - Item 13: ₹2,500 hard cap on COD orders.
 * - Item 14: Transparent ₹35 COD handling fee.
 * - Item 15: Automatic RTO Blacklisting algorithm (>= 2 ungrounded returns).
 * - Item 16: Digital COD (Cashless Doorstep QR collection for delivery riders).
 * - Item 17: Pre-dispatch WhatsApp confirmation message & button generator.
 * - Item 18: 1-Click cancellation guard before courier dispatch.
 * - Item 20: Prepaid incentive ribbon ("Pay Online & Save ₹30 Flat").
 */

import crypto from 'crypto';
import { CodEligibilityResult, CodPolicyConfig } from '@/types/payment';
import { buildNpciUpiUri } from './upiPaymentService';

export const DEFAULT_COD_CONFIG: CodPolicyConfig = {
  max_limit: 2500, // Item 13: ₹2,500 Hard cap
  handling_fee: 35, // Item 14: ₹35 handling charge
  max_rto_allowed: 2, // Item 15: >= 2 ungrounded returns trigger blacklist
  prepaid_discount_amount: 30, // Item 20: ₹30 flat savings on online payment
  is_otp_mandatory: true, // Item 12: 4-digit OTP
};

// In-memory / persistent mock for RTO tracking (phone -> count)
const rtoStore = new Map<string, { count: number; lastRtoDate: string; reasons: string[] }>();

/**
 * Records an ungrounded return to origins (RTO) for a given phone number
 */
export function recordCustomerRto(phone: string, reason: string = 'Refused at doorstep'): void {
  const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
  const existing = rtoStore.get(cleanPhone) || { count: 0, lastRtoDate: '', reasons: [] };
  existing.count += 1;
  existing.lastRtoDate = new Date().toISOString();
  existing.reasons.push(reason);
  rtoStore.set(cleanPhone, existing);
}

/**
 * Gets customer RTO history
 */
export function getCustomerRtoRecord(phone: string) {
  const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
  return rtoStore.get(cleanPhone) || { count: 0, lastRtoDate: '', reasons: [] };
}

/**
 * Clears RTO store (useful for tests or admin pardon)
 */
export function resetRtoStore(): void {
  rtoStore.clear();
}

/**
 * Item 13, 14, 15: Evaluates whether a customer and order are eligible for Cash on Delivery (COD)
 */
export function evaluateCodEligibility(
  amount: number,
  phone?: string,
  config: CodPolicyConfig = DEFAULT_COD_CONFIG
): CodEligibilityResult {
  const cleanPhone = phone ? phone.trim().replace(/\D/g, '').slice(-10) : '';
  const rtoRecord = cleanPhone ? getCustomerRtoRecord(cleanPhone) : { count: 0 };
  const isBlacklisted = rtoRecord.count >= config.max_rto_allowed;

  // Check 1: RTO Blacklist (Item 15)
  if (isBlacklisted) {
    return {
      eligible: false,
      reason: `Cash on Delivery is unavailable for this mobile number due to past delivery rejections (${rtoRecord.count} RTOs). Please pay online.`,
      reason_bn: `পূর্বে ২ বা ততোধিক পার্সেল প্রত্যাখ্যাত (RTO) হওয়ায় এই মোবাইল নম্বরে ক্যাশ অন ডেলিভারি স্থগিত করা হয়েছে। অনুগ্রহ করে ইউপিআই বা কার্ডের মাধ্যমে অর্ডার সম্পন্ন করুন।`,
      handling_fee: 0,
      prepaid_savings: config.prepaid_discount_amount,
      requires_otp: true,
      is_blacklisted: true,
      max_allowed: config.max_limit,
    };
  }

  // Check 2: ₹2,500 Hard Cap (Item 13)
  if (amount > config.max_limit) {
    return {
      eligible: false,
      reason: `Cash on Delivery is limited to orders up to ₹${config.max_limit}. For this cart (₹${amount.toFixed(2)}), please pay online.`,
      reason_bn: `নিরাপত্তা কারণে সর্বোচ্চ ₹${config.max_limit} পর্যন্ত অর্ডারে ক্যাশ অন ডেলিভারি প্রযোজ্য। আপনার কার্টের মূল্য ₹${amount.toFixed(2)}—অনুগ্রহ করে অনলাইনে পেমেন্ট করুন।`,
      handling_fee: 0,
      prepaid_savings: config.prepaid_discount_amount,
      requires_otp: true,
      is_blacklisted: false,
      max_allowed: config.max_limit,
    };
  }

  // Eligible for COD
  return {
    eligible: true,
    handling_fee: config.handling_fee,
    prepaid_savings: config.prepaid_discount_amount + config.handling_fee, // Online saves ₹30 discount + eliminates ₹35 COD fee
    requires_otp: config.is_otp_mandatory,
    is_blacklisted: false,
    max_allowed: config.max_limit,
  };
}

/**
 * Item 12: Generates a cryptographically secure 4-digit COD OTP
 */
export function generateCodOtp(): string {
  return crypto.randomInt(1000, 10000).toString();
}

/**
 * Item 16: Digital COD (Cashless doorstep UPI QR generation for delivery riders)
 */
export function generateDigitalCodCollectionData(orderId: string, amount: number, riderId?: string) {
  const note = `Digital COD Collection - ${orderId} (Rider: ${riderId || 'MMB-Rider'})`;
  const upiUri = buildNpciUpiUri({
    orderId: `DCOD-${orderId}`,
    amount,
    note,
  });

  return {
    orderId,
    amount,
    upiUri,
    doorstepCashlessOption: true,
    instruction: 'Customer can scan this dynamic QR on delivery rider smartphone to pay cashless via PhonePe/GPay.',
    instruction_bn: 'পার্সেল হাতে পাওয়ার পর ক্যাশের বদলে গ্রাহক ডেলিভারি বয়ের ফোনে থাকা এই কিউআর স্ক্যান করে ইউপিআই-তে পেমেন্ট করতে পারবেন।',
  };
}

/**
 * Item 17: Pre-dispatch WhatsApp confirmation message generator
 */
export function generateCodPreDispatchConfirmationMessage(params: {
  orderId: string;
  customerName: string;
  totalAmount: number;
  deliveryDate: string;
}): { message: string; message_bn: string; actionButtonText: string } {
  const message = `Namaste ${params.customerName}! Your M.M Book House COD order #${params.orderId} for ₹${params.totalAmount} is ready for packing. Expected delivery by ${params.deliveryDate}. Please confirm your availability by tapping the button below.`;

  const message_bn = `নমস্কার ${params.customerName}! আপনার এম.এম বুক হাউসের সিওডি অর্ডার #${params.orderId} (মোট মূল্য ₹${params.totalAmount}) প্যাকিংয়ের জন্য প্রস্তুত। আনুমানিক ডেলিভারি: ${params.deliveryDate}। ডেলিভারির সময় উপস্থিত থাকার নিশ্চয়তা দিতে নিচের বোতামে চাপুন।`;

  return {
    message,
    message_bn,
    actionButtonText: 'Confirm Order (অর্ডার নিশ্চিত করুন)',
  };
}

/**
 * Item 18: 1-Click Cancel prior to dispatch guard
 */
export function canCancelCodOrder(orderStatus: string): { canCancel: boolean; reason?: string } {
  const nonCancellableStatuses = ['DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'];
  const normalized = orderStatus.toUpperCase();

  if (nonCancellableStatuses.includes(normalized)) {
    return {
      canCancel: false,
      reason: 'Order has already been dispatched with courier partner and cannot be self-cancelled. Please contact support or refuse upon delivery.',
    };
  }

  return {
    canCancel: true,
  };
}

/**
 * Item 20: Prepaid incentive ribbon calculation
 */
export function getPrepaidIncentiveBanner(
  amount: number,
  config: CodPolicyConfig = DEFAULT_COD_CONFIG
) {
  const totalSavings = config.prepaid_discount_amount + config.handling_fee;
  return {
    discountAmount: config.prepaid_discount_amount,
    handlingFeeSaved: config.handling_fee,
    totalSavings,
    bannerText: `Pay Online & Save ₹${config.prepaid_discount_amount} Flat + Avoid ₹${config.handling_fee} COD Fee (Total Benefit ₹${totalSavings})!`,
    bannerText_bn: `অনলাইনে পেমেন্ট করলে ফ্ল্যাট ₹${config.prepaid_discount_amount} ছাড় ও ₹${config.handling_fee} সিওডি ফি মকুব (মোট সাশ্রয় ₹${totalSavings})!`,
  };
}
