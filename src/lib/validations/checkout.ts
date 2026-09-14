/**
 * MM Book House - Module 12: Checkout Zod Validations & Sanitizers
 * 
 * Provides strict validation schemas for:
 * - Indian GSTIN (Goods and Services Tax Identification Number)
 * - Delivery speeds and payment methods
 * - 4-Digit COD Anti-Fraud OTP (Item 26)
 * - Order placement payload (Zero Client Trust)
 * - Coupon code format
 */

import { z } from 'zod';
import { DeliverySpeedId, PaymentMethodType, CheckoutMode } from '@/types/checkout';

/**
 * Official Indian 15-character GSTIN Regex:
 * Example: "19AAAAA0000A1Z5" (19 = West Bengal)
 * - 2 digits: State code (01 - 38)
 * - 10 characters: PAN number (5 letters, 4 digits, 1 letter)
 * - 1 character: Entity number of same PAN in the state (1-9 or A-Z)
 * - 1 character: 'Z' by default
 * - 1 character: Check digit checksum (alphanumeric)
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * 4-Digit Numeric COD OTP Verification Regex (Item 26)
 */
export const COD_OTP_REGEX = /^\d{4}$/;

/**
 * Coupon Code Regex: 3 to 20 uppercase alphanumeric characters
 */
export const COUPON_CODE_REGEX = /^[A-Z0-9_-]{3,20}$/;

/**
 * Sanitizes GSTIN: removes spaces, dashes, and converts to uppercase
 */
export function sanitizeGstin(input: string): string {
  if (!input) return '';
  return input.replace(/[^0-9a-zA-Z]/g, '').toUpperCase().trim();
}

/**
 * Sanitizes Coupon Code: removes spaces, uppercase
 */
export function sanitizeCouponCode(input: string): string {
  if (!input) return '';
  return input.replace(/[^0-9a-zA-Z_-]/g, '').toUpperCase().trim();
}

/**
 * Validates Indian GSTIN structure and extracts state code
 */
export function validateGstin(gstin: string): {
  isValid: boolean;
  stateCode?: string;
  isWestBengal?: boolean;
  error?: string;
} {
  const clean = sanitizeGstin(gstin);
  if (!clean) {
    return { isValid: false, error: 'GSTIN is required for GST tax invoice' };
  }
  if (clean.length !== 15) {
    return {
      isValid: false,
      error: `GSTIN must be exactly 15 characters (provided: ${clean.length})`,
    };
  }
  if (!GSTIN_REGEX.test(clean)) {
    return {
      isValid: false,
      error: 'Invalid GSTIN format. Valid format: 19AAAAA0000A1Z5',
    };
  }

  const stateCode = clean.substring(0, 2);
  return {
    isValid: true,
    stateCode,
    isWestBengal: stateCode === '19',
  };
}

/**
 * GST Business Billing Schema (Item 27)
 */
export const gstBillingSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, { message: 'প্রতিষ্ঠানের নাম কমপক্ষে ২ অক্ষরের হতে হবে (Company name too short)' })
    .max(120, { message: 'প্রতিষ্ঠানের নাম ১২০ অক্ষরের কম হতে হবে (Company name too long)' }),
  gstin: z
    .string()
    .trim()
    .transform(sanitizeGstin)
    .refine((val) => GSTIN_REGEX.test(val), {
      message: 'সঠিক ১৫-সংখ্যার ভারতীয় জিএসটি নম্বর দিন (e.g. 19AAAAA0000A1Z5)',
    }),
  registeredAddress: z
    .string()
    .trim()
    .max(250, { message: 'ঠিকানা ২৫০ অক্ষরের মধ্যে হতে হবে' })
    .optional(),
  stateCode: z.string().length(2).optional(),
});

/**
 * Delivery Speed Option Schema (Item 23)
 */
export const deliverySpeedSchema = z.enum(['standard', 'express_sameday', 'store_pickup'], {
  message: 'অবৈধ ডেলিভারি স্পিড নির্বাচন করা হয়েছে (Invalid delivery speed)',
});

/**
 * Payment Method Schema (Item 25)
 */
export const paymentMethodSchema = z.enum(['upi', 'cod', 'card', 'netbanking'], {
  message: 'অবৈধ পেমেন্ট মেথড নির্বাচন করা হয়েছে (Invalid payment method)',
});

/**
 * Coupon Code Zod Schema (Item 37)
 */
export const couponCodeSchema = z
  .string()
  .trim()
  .transform(sanitizeCouponCode)
  .refine((val) => val === '' || COUPON_CODE_REGEX.test(val), {
    message: 'কুপন কোড ৩ থেকে ২০টি অক্ষরের ইংরেজি বড় হাতের বা সংখ্যা হতে হবে (Invalid coupon code)',
  });

/**
 * COD Anti-Fraud OTP Verification Schema (Item 26)
 */
export const codVerificationSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, { message: 'সঠিক ১০-সংখ্যার ভারতীয় মোবাইল নম্বর আবশ্যক' }),
  otp: z
    .string()
    .trim()
    .regex(COD_OTP_REGEX, { message: '৪-সংখ্যার সঠিক ওটিপি দিন (Invalid 4-digit OTP)' }),
});

/**
 * Single Item Payload Schema for Checkout
 */
export const checkoutItemInputSchema = z.object({
  bookId: z.string().trim().min(1, { message: 'বইয়ের আইডি আবশ্যক (Book ID required)' }),
  variantId: z.string().optional(),
  quantity: z
    .number()
    .int()
    .min(1, { message: 'পরিমাণ কমপক্ষে ১ হতে হবে' })
    .max(20, { message: 'একবারে সর্বোচ্চ ২০টি বই নেওয়া যাবে' }),
  binding: z.enum(['paperback', 'hardcover']).optional(),
  condition: z.enum(['new', 'used']).optional(),
  giftOptions: z
    .object({
      hasGiftOptions: z.boolean().optional(),
      isGiftWrapSelected: z.boolean().optional(),
      giftWrapFee: z.number().default(0).optional(),
      giftWrapType: z.enum(['standard', 'festive', 'none']).optional(),
      giftMessage: z.string().max(250).optional(),
      senderName: z.string().max(50).optional(),
      recipientName: z.string().max(50).optional(),
      hidePriceOnInvoice: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Complete Order Placement Request Schema (Item 39, 40)
 * Evaluated on Server Action with Zero Client Trust.
 */
export const placeOrderSchema = z
  .object({
    sessionId: z.string().trim().min(1, { message: 'সেশন আইডি আবশ্যক (Session ID required)' }),
    idempotencyKey: z
      .string()
      .trim()
      .min(8, { message: 'আইডেমপোটেন্সি কি আবশ্যক (Idempotency key required)' }),
    mode: z.enum(['cart', 'buy_now']),
    items: z
      .array(checkoutItemInputSchema)
      .min(1, { message: 'চেকআউটে অন্তত একটি বই নির্বাচন করতে হবে' }),
    shippingAddressId: z
      .string()
      .trim()
      .min(1, { message: 'ডেলিভারি ঠিকানা নির্বাচন আবশ্যক (Shipping address required)' }),
    billingAddressId: z.string().trim().optional(),
    deliverySpeed: deliverySpeedSchema,
    paymentMethod: paymentMethodSchema,
    couponCode: z.string().trim().optional(),
    useGstInvoice: z.boolean().default(false),
    gstDetails: gstBillingSchema.optional(),
    isGiftOrder: z.boolean().default(false),
    giftMessage: z
      .string()
      .trim()
      .max(250, { message: 'গিফট বার্তা ২৫০ অক্ষরের মধ্যে হতে হবে' })
      .optional(),
    codOtpCode: z
      .string()
      .trim()
      .optional(),
    isPaymentVerified: z.boolean().optional(),
    paymentTransactionId: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      // If GST Invoice is requested, gstDetails must be provided and valid
      if (data.useGstInvoice) {
        return !!data.gstDetails && GSTIN_REGEX.test(data.gstDetails.gstin);
      }
      return true;
    },
    {
      message: 'জিএসটি চালানের জন্য সঠিক কোম্পানির নাম ও জিএসটি নম্বর প্রদান করুন',
      path: ['gstDetails'],
    }
  )
  .refine(
    (data) => {
      // If COD is selected and an OTP was challenged, codOtpCode must be 4 digits
      if (data.paymentMethod === 'cod' && data.codOtpCode) {
        return COD_OTP_REGEX.test(data.codOtpCode);
      }
      return true;
    },
    {
      message: 'সিওডি অর্ডারের জন্য ৪-সংখ্যার সঠিক ওটিপি দিন',
      path: ['codOtpCode'],
    }
  );

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type GstBillingInput = z.infer<typeof gstBillingSchema>;
export type CodVerificationInput = z.infer<typeof codVerificationSchema>;
