/**
 * Module 11: Customer Address Book Validation Schema & Sanitization Engine
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 1, 4, 5, 6, 9, 10, 11, 40, 44):
 * - 7 Mandatory Fields (Item 1)
 * - Strict Indian phone regex: ^[6-9]\d{9}$ (Item 44)
 * - Standard Indian postal code regex: ^[1-9][0-9]{5}$ (Item 2)
 * - XSS and Injection Sanitization (Item 9)
 * - Bilingual error messages (Item 10)
 * - Address categories (Item 11) & Delivery instructions (Items 13-17)
 */

import { z } from 'zod';
import type {
  AddressFormData,
  AddressSnapshot,
  AddressType,
  CustomerAddress,
  DeliveryPreferences,
} from '@/types/address';

/**
 * Sanitizes input strings by removing dangerous HTML tags, scripts, and excessive whitespace.
 * Protects against XSS and stored script injections (Item 9).
 */
export function sanitizeInputString(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip javascript pseudo-protocols
    .replace(/on\w+\s*=/gi, '') // Strip event handlers like onclick=
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control characters
    .trim();
}

/**
 * Delivery Preferences Sub-Schema
 */
export const deliveryPreferencesSchema = z.object({
  callBeforeDelivery: z.boolean().default(true),
  leaveWithSecurity: z.boolean().default(false),
  doNotRingBell: z.boolean().default(false),
  leaveWithNeighbor: z
    .object({
      enabled: z.boolean().default(false),
      neighborName: z.string().max(100).optional(),
      neighborFlat: z.string().max(50).optional(),
    })
    .optional(),
  isWeekendClosed: z.boolean().default(false),
  specialInstructions: z.string().max(300, 'বিশেষ নির্দেশিকা সর্বোচ্চ ৩০০ অক্ষরের মধ্যে রাখুন').optional(),
  preferredTimeSlot: z.enum(['morning_10_to_1', 'evening_4_to_7', 'anytime']).default('anytime'),
});

/**
 * Address Form Validation Schema
 * Enforces the 7 mandatory fields and strict Indian standards
 */
export const addressFormSchema = z
  .object({
    // 1. Recipient Full Name (Mandatory)
    recipient_name: z
      .string()
      .trim()
      .min(2, 'প্রাপকের নাম ন্যূনতম ২ অক্ষরের হতে হবে (Recipient name is required)')
      .max(100, 'প্রাপকের নাম সর্বোচ্চ ১০০ অক্ষরের মধ্যে রাখুন')
      .transform(sanitizeInputString),

    // 2. 10-Digit Indian Mobile Phone (Mandatory)
    recipient_phone: z
      .string()
      .trim()
      .regex(
        /^[6-9]\d{9}$/,
        'সঠিক ১০-সংখ্যার ভারতীয় মোবাইল নম্বর লিখুন (যেমন: 9876543210)'
      ),

    // Optional Alternate Phone (Must be valid 10 digits if provided)
    alternate_phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => !val || /^[6-9]\d{9}$/.test(val),
        'বিকল্প নম্বর দিলে সেটিও সঠিক ১০-সংখ্যার ভারতীয় নম্বর হতে হবে'
      ),

    // 3. 6-Digit Indian Postal Code (Mandatory)
    pincode: z
      .string()
      .trim()
      .regex(
        /^[1-9][0-9]{5}$/,
        'সঠিক ৬-সংখ্যার ভারতীয় পিনকোড লিখুন (যেমন: 732101)'
      ),

    // 4. House / Flat / Building / Floor No (Address Line 1 - Mandatory)
    address_line1: z
      .string()
      .trim()
      .min(3, 'বাড়ি, ফ্ল্যাট বা বিল্ডিং নম্বর আবশ্যক (যেমন: Flat 3B, Anandam)')
      .max(200, 'বাড়ি বা ফ্ল্যাট নম্বর সর্বোচ্চ ২০০ অক্ষরের মধ্যে রাখুন')
      .transform(sanitizeInputString),

    // 5. Street / Road / Village / Area (Address Line 2 - Mandatory)
    address_line2: z
      .string()
      .trim()
      .min(3, 'রাস্তা, এলাকা বা গ্রামের নাম আবশ্যক (যেমন: Rathbari Mor, Post Office Road)')
      .max(200, 'এলাকা বা গ্রামের নাম সর্বোচ্চ ২০০ অক্ষরের মধ্যে রাখুন')
      .transform(sanitizeInputString),

    // 6. Landmark (Mandatory for accurate semi-urban/rural deliveries)
    landmark: z
      .string()
      .trim()
      .min(2, 'ডেলিভারি সহজ করতে পরিচিত ল্যান্ডমার্ক লিখুন (যেমন: গৌড় কলেজ গেটের পাশে)')
      .max(150, 'ল্যান্ডমার্ক সর্বোচ্চ ১৫০ অক্ষরের মধ্যে রাখুন')
      .transform(sanitizeInputString),

    // 7. City, District, State (Mandatory)
    city: z
      .string()
      .trim()
      .min(2, 'শহরের নাম আবশ্যক (City is required)')
      .max(100)
      .transform(sanitizeInputString),

    district: z
      .string()
      .trim()
      .min(2, 'জেলার নাম আবশ্যক (District is required)')
      .max(100)
      .default('Malda')
      .transform(sanitizeInputString),

    state: z
      .string()
      .trim()
      .min(2, 'রাজ্যের নাম আবশ্যক (State is required)')
      .max(100)
      .default('West Bengal')
      .transform(sanitizeInputString),

    // Address Type Tag
    address_type: z
      .enum(['home', 'work', 'hostel', 'other'])
      .default('home'),

    // Default Address Flag
    is_default: z.boolean().default(false),

    // Delivery Instructions & Preferences
    delivery_preferences: deliveryPreferencesSchema.optional(),
  })
  .refine(
    (data) => {
      // Alternate phone should not be identical to primary recipient phone
      if (data.alternate_phone && data.alternate_phone === data.recipient_phone) {
        return false;
      }
      return true;
    },
    {
      message: 'বিকল্প নম্বরটি মূল ফোন নম্বর থেকে আলাদা হতে হবে',
      path: ['alternate_phone'],
    }
  );

export type ValidatedAddressFormData = z.infer<typeof addressFormSchema>;

/**
 * Combines address_line1 and address_line2 into a single street_address string
 * for PostgreSQL schema compatibility.
 */
export function combineStreetAddress(line1: string, line2: string): string {
  const clean1 = sanitizeInputString(line1);
  const clean2 = sanitizeInputString(line2);
  if (!clean1) return clean2;
  if (!clean2) return clean1;
  return `${clean1}, ${clean2}`;
}

/**
 * Splits a combined street_address back into address_line1 and address_line2.
 */
export function splitStreetAddress(streetAddress: string): { address_line1: string; address_line2: string } {
  if (!streetAddress) {
    return { address_line1: '', address_line2: '' };
  }
  const parts = streetAddress.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { address_line1: streetAddress.trim(), address_line2: '' };
  }
  const address_line1 = parts[0];
  const address_line2 = parts.slice(1).join(', ');
  return { address_line1, address_line2 };
}

/**
 * Creates an immutable frozen address snapshot for storing in orders.shipping_address_snapshot
 * (proposed_modules.md Items 31-34).
 */
export function createAddressSnapshot(address: CustomerAddress | AddressFormData): AddressSnapshot {
  const line1 = 'address_line1' in address && address.address_line1 ? address.address_line1 : '';
  const line2 = 'address_line2' in address && address.address_line2 ? address.address_line2 : '';
  const street_address =
    'street_address' in address && address.street_address
      ? address.street_address
      : combineStreetAddress(line1, line2);

  return {
    recipient_name: sanitizeInputString(address.recipient_name),
    recipient_phone: address.recipient_phone.trim(),
    alternate_phone: address.alternate_phone?.trim() || null,
    street_address,
    address_line1: line1,
    address_line2: line2,
    landmark: sanitizeInputString(address.landmark),
    city: sanitizeInputString(address.city),
    district: sanitizeInputString(address.district),
    state: sanitizeInputString(address.state),
    pincode: address.pincode.trim(),
    address_type: address.address_type as AddressType,
    delivery_preferences: address.delivery_preferences || null,
    snapshot_timestamp: new Date().toISOString(),
  };
}

/**
 * Formats a customer address into a clean single or multi-line string for UI display or shipping labels.
 */
export function formatAddressSingleLine(
  address: Partial<CustomerAddress> | Partial<AddressFormData> | Partial<AddressSnapshot>
): string {
  const parts: string[] = [];

  if (address.address_line1) parts.push(address.address_line1);
  if (address.address_line2) parts.push(address.address_line2);
  const street = 'street_address' in address && typeof address.street_address === 'string' ? address.street_address : '';
  if (!address.address_line1 && !address.address_line2 && street) {
    parts.push(street);
  }
  if (address.landmark) parts.push(`(Near ${address.landmark})`);
  if (address.city) parts.push(address.city);
  if (address.district && address.district !== address.city) parts.push(address.district);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(`- ${address.pincode}`);

  return parts.filter(Boolean).join(', ');
}
