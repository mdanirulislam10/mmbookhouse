/**
 * MM Book House - Module 12: Delivery Speed & Guaranteed SLA Engine
 * 
 * Implements:
 * - 3 Delivery Speed Channels: Standard, Same-Day Express, and Store Pickup (Item 23)
 * - Dynamic Calendar Delivery Promise in Bengali & English (Item 24)
 * - Pincode Serviceability & Same-Day Cutoff Logic (4 PM IST)
 * - Store Pickup Free Shipping Override
 */

import { DeliverySpeedId, DeliverySpeedOption } from '@/types/checkout';
import { isMaldaTownPincode } from '@/lib/services/pincodeService';

const BENGALI_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string): string {
  return String(num).replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d, 10)]);
}

/**
 * Formats a Date object into Bengali human-readable format:
 * e.g., "বুধবার, ১২ মার্চ"
 */
export function formatBengaliDate(date: Date): string {
  const dayName = BENGALI_DAYS[date.getDay()];
  const dayNum = toBengaliNumber(date.getDate());
  const monthName = BENGALI_MONTHS[date.getMonth()];
  return `${dayName}, ${dayNum} ${monthName}`;
}

/**
 * Formats a Date object into English human-readable format:
 * e.g., "Wednesday, 12 Mar"
 */
export function formatEnglishDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  };
  return date.toLocaleDateString('en-IN', options);
}

export interface DeliverySpeedCalculationResult {
  options: DeliverySpeedOption[];
  selectedSpeed: DeliverySpeedId;
  additionalSpeedFee: number;
}

/**
 * Returns available delivery speeds and guaranteed delivery dates based on pincode and current time (Item 23, 24)
 */
export function getAvailableDeliverySpeeds(
  pincode: string,
  now: Date = new Date()
): DeliverySpeedOption[] {
  const isLocal = isMaldaTownPincode(pincode);
  const currentHour = now.getHours();
  const isBeforeCutoff = currentHour < 16; // 4:00 PM IST cutoff

  // 1. Standard Delivery (2-3 business days)
  const standardDate = new Date(now);
  standardDate.setDate(standardDate.getDate() + (isLocal ? 2 : 3));
  // Skip Sunday for delivery promise
  if (standardDate.getDay() === 0) {
    standardDate.setDate(standardDate.getDate() + 1);
  }

  const standardOption: DeliverySpeedOption = {
    id: 'standard',
    title: 'Standard Delivery',
    titleBn: 'স্ট্যান্ডার্ড হোম ডেলিভারি',
    subtitle: 'Safe postal / courier parcel delivery',
    subtitleBn: 'নিরাপদ কুরিয়ার ও ডাকযোগে হোম ডেলিভারি',
    fee: 0,
    estimatedDeliveryDate: standardDate.toISOString(),
    guaranteedDeliveryDateBn: `${formatBengaliDate(standardDate)}-এর মধ্যে নিশ্চিত ডেলিভারি`,
    isGuaranteed: true,
    isAvailableForPincode: true,
  };

  // 2. Same-Day Express Delivery (Malda Town local only)
  let expressAvailable = isLocal;
  const expressDate = new Date(now);
  let cutoffNoticeBn = '';

  if (isLocal) {
    if (isBeforeCutoff) {
      cutoffNoticeBn = 'আজ বিকাল ৪টার আগে অর্ডার করায় আজই ডেলিভারি পাচ্ছেন';
    } else {
      expressDate.setDate(expressDate.getDate() + 1);
      cutoffNoticeBn = 'বিকাল ৪টার পর অর্ডার হওয়ায় আগামীকাল দুপুর ১টায় ডেলিভারি পাবেন';
    }
  }

  const expressOption: DeliverySpeedOption = {
    id: 'express_sameday',
    title: 'Same-Day Express Delivery',
    titleBn: 'সেইম-ডে এক্সপ্রেস ডেলিভারি',
    subtitle: isLocal
      ? isBeforeCutoff
        ? 'Delivered today by 7:00 PM'
        : 'Delivered tomorrow by 1:00 PM'
      : 'Available only within Malda Town',
    subtitleBn: isLocal
      ? isBeforeCutoff
        ? 'আজ সন্ধ্যা ৭টার মধ্যে সুপারফাস্ট ডেলিভারি'
        : 'আগামীকাল দুপুর ১টার মধ্যে ডেলিভারি'
      : 'শুধুমাত্র মালদা টাউন এলাকার জন্য প্রযোজ্য',
    fee: 25, // ₹25 speed surcharge for express courier
    estimatedDeliveryDate: expressDate.toISOString(),
    guaranteedDeliveryDateBn: isLocal
      ? isBeforeCutoff
        ? 'আজ সন্ধ্যা ৭টার মধ্যে নিশ্চিত ডেলিভারি'
        : 'আগামীকাল দুপুর ১টার মধ্যে নিশ্চিত ডেলিভারি'
      : 'মালদা টাউন ছাড়া প্রযোজ্য নয়',
    isGuaranteed: isLocal,
    isAvailableForPincode: expressAvailable,
    cutoffTimeNoticeBn: cutoffNoticeBn,
  };

  // 3. Store Pickup (Always free self-collection at store)
  const storePickupOption: DeliverySpeedOption = {
    id: 'store_pickup',
    title: 'Store Pickup (Self Collection)',
    titleBn: 'দোকান থেকে ফ্রি সংগ্রহ (স্টোর পিকআপ)',
    subtitle: 'M.M Book House, Netaji Subhash Road, Malda (10 AM - 9 PM)',
    subtitleBn: 'এম.এম বুক হাউস, রথবাড়ি মালদা শাখা (সকাল ১০টা - রাত ৯টা)',
    fee: 0, // ₹0 Free collection
    estimatedDeliveryDate: now.toISOString(),
    guaranteedDeliveryDateBn: 'আজই দোকান থেকে সরাসরি সংগ্রহ করুন (সম্পূর্ণ ফ্রি)',
    isGuaranteed: true,
    isAvailableForPincode: true,
  };

  return [standardOption, expressOption, storePickupOption];
}

/**
 * Calculates net shipping adjustment based on speed selection
 */
export function calculateSpeedAdjustment(
  speedId: DeliverySpeedId,
  baseZoneShippingFee: number
): { speedFee: number; finalShippingFee: number; isPickup: boolean } {
  if (speedId === 'store_pickup') {
    // Store pickup waives all shipping fees to ₹0
    return { speedFee: 0, finalShippingFee: 0, isPickup: true };
  }

  if (speedId === 'express_sameday') {
    return {
      speedFee: 25,
      finalShippingFee: baseZoneShippingFee + 25,
      isPickup: false,
    };
  }

  // Standard
  return {
    speedFee: 0,
    finalShippingFee: baseZoneShippingFee,
    isPickup: false,
  };
}
