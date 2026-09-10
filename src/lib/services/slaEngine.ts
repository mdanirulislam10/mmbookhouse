/**
 * Module 8: SLA Engine & Accurate Delivery Calculator
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements:
 * - Task 11: Amazon-style exact delivery date format with Bengali/English days & dates
 * - Task 12: Malda Town SLA (Same-Day before 2 PM / Next-Day after 2 PM)
 * - Task 13: Regional SLA (North/South Dinajpur & Murshidabad 1-2 Business Days)
 * - Task 14: Kolkata & West Bengal SLA (2-3 Business Days)
 * - Task 15: National SLA (All-India 4-6 Business Days)
 * - Task 20: Malda Municipality 2-Hour Super-Express Delivery (₹30 add-on)
 */

import { DeliveryZone, SlaCalculationResult } from '@/types/delivery';
import {
  addBusinessDays,
  formatAmazonDeliveryDate,
  isBusinessDay,
  toBengaliNumerals,
} from './holidayCalendar';
import { normalizePincodeDigits, validateIndianPincode } from '../data/pincodeData';

// Malda Town Municipality Core Pincodes (English Bazar & Old Malda urban core)
export const MALDA_TOWN_PINCODES = new Set(['732101', '732102', '732103']);

// Daily Cutoff Hours in IST (Indian Standard Time)
export const MALDA_SAME_DAY_CUTOFF_HOUR = 14; // 2:00 PM IST
export const STANDARD_DISPATCH_CUTOFF_HOUR = 17; // 5:00 PM IST
export const MALDA_2HR_EXPRESS_FEE = 30; // ₹30 for 2-hour delivery

/**
 * Returns current Indian Standard Time (IST = UTC + 5:30)
 */
export function getIndiaStandardTime(date: Date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
}

/**
 * Check if pincode belongs to Malda Town municipality core
 */
export function isMaldaTownPincode(pincode: string): boolean {
  const clean = normalizePincodeDigits(pincode).trim();
  return MALDA_TOWN_PINCODES.has(clean);
}

/**
 * Determine the Delivery Zone based on Indian 6-digit postal code hierarchy
 */
export function determineDeliveryZone(pincode: string): {
  zone: DeliveryZone;
  district: string;
  state: string;
  isMaldaTown: boolean;
} {
  const clean = normalizePincodeDigits(pincode).trim();
  const prefix3 = clean.substring(0, 3);
  const prefix2 = clean.substring(0, 2);

  if (MALDA_TOWN_PINCODES.has(clean)) {
    return {
      zone: 'local_malda',
      district: 'Malda',
      state: 'West Bengal',
      isMaldaTown: true,
    };
  }

  // Malda District Subdivisions (Chanchal, Samsi, Gazole, Ratua, Kaliachak, etc.)
  if (prefix3 === '732') {
    return {
      zone: 'local_malda',
      district: 'Malda',
      state: 'West Bengal',
      isMaldaTown: false,
    };
  }

  // Regional North Bengal: Uttar & Dakshin Dinajpur (733) & Darjeeling/Siliguri (734), Jalpaiguri/Coochbehar (735, 736)
  if (prefix3 === '733') {
    return {
      zone: 'regional_north_bengal',
      district: 'Dinajpur',
      state: 'West Bengal',
      isMaldaTown: false,
    };
  }

  // Regional Murshidabad (742)
  if (prefix3 === '742') {
    return {
      zone: 'regional_north_bengal', // Grouped with regional neighbor SLA
      district: 'Murshidabad',
      state: 'West Bengal',
      isMaldaTown: false,
    };
  }

  // Kolkata Metro & Other West Bengal Districts (70, 71, 72, 734, 735, 736, 741, 743)
  if (
    ['700', '711', '712', '713', '721', '722', '723', '734', '735', '736', '741', '743'].includes(prefix3) ||
    ['70', '71', '72', '73', '74'].includes(prefix2)
  ) {
    return {
      zone: 'south_bengal',
      district: prefix3 === '700' ? 'Kolkata' : 'West Bengal',
      state: 'West Bengal',
      isMaldaTown: false,
    };
  }

  // All-India National
  return {
    zone: 'national',
    district: 'India',
    state: 'India',
    isMaldaTown: false,
  };
}

export interface CalculateSlaOptions {
  orderDate?: Date;
  isSuperExpressSelected?: boolean; // Task 20: 2-Hour delivery
}

/**
 * Master SLA Delivery Calculator
 * Calculates precise business days, cutoff countdown, delivery date and Amazon-style promises.
 */
export function calculateSLA(
  rawPincode: string,
  options: CalculateSlaOptions = {}
): SlaCalculationResult {
  const validated = validateIndianPincode(rawPincode);
  const pincode = validated.isValid ? validated.normalizedPincode : '732101';
  const orderDate = options.orderDate ?? new Date();
  const istDate = getIndiaStandardTime(orderDate);

  const { zone, isMaldaTown } = determineDeliveryZone(pincode);
  const currentHour = istDate.getHours();
  const currentMinute = istDate.getMinutes();

  let estimatedDays = 1;
  let slaBadgeBn = '';
  let slaBadgeEn = '';
  let fullPromiseBn = '';
  let fullPromiseEn = '';
  let deliveryTargetDate: Date;
  let isSameDayEligible = false;
  let isTomorrow = false;
  let cutoffHour = STANDARD_DISPATCH_CUTOFF_HOUR;
  let cutoffMinute = 0;
  let carrierRecommended: 'MM Local Rider' | 'Delhivery' | 'Shiprocket' | 'India Post' = 'Delhivery';

  // --------------------------------------------------------------------------
  // TASK 20: MALDA MUNICIPALITY 2-HOUR SUPER-EXPRESS DELIVERY
  // --------------------------------------------------------------------------
  if (isMaldaTown && options.isSuperExpressSelected) {
    // 2-Hour Delivery via M.M Local Dedicated Rider
    const delivery2Hr = new Date(orderDate.getTime() + 2 * 60 * 60 * 1000);
    const dateFormatted = formatAmazonDeliveryDate(delivery2Hr);

    return {
      pincode,
      zone: 'local_malda',
      estimatedDays: 0,
      deliveryDate: delivery2Hr,
      formattedDateBn: dateFormatted.formattedBn,
      formattedDateEn: dateFormatted.formattedEn,
      fullPromiseBn: 'মালদা পৌরসভা ২-ঘণ্টা সুপার-এক্সপ্রেস: আজই ২ ঘণ্টার মধ্যে সরাসরি ডেলিভারি',
      fullPromiseEn: 'Malda Municipality 2-Hour Super-Express: Delivered within 2 hours today',
      slaBadgeBn: '⚡ ২ ঘণ্টার মধ্যে সুপার-এক্সপ্রেস ডেলিভারি',
      slaBadgeEn: '⚡ Super-Express 2-Hour Delivery',
      isMaldaTown: true,
      isSameDayEligible: true,
      isTomorrow: false,
      cutoffHour: 20, // till 8 PM
      cutoffMinute: 0,
      isCutoffPassed: currentHour >= 20,
      cutoffRemainingMs: Math.max(0, (20 * 60 - (currentHour * 60 + currentMinute)) * 60000),
      isExpressOptionAvailable: true,
      expressFee: MALDA_2HR_EXPRESS_FEE,
      carrierRecommended: 'MM Local Rider',
    };
  }

  // --------------------------------------------------------------------------
  // TASK 12: MALDA TOWN SLA (732101 - 732103)
  // --------------------------------------------------------------------------
  if (isMaldaTown) {
    cutoffHour = MALDA_SAME_DAY_CUTOFF_HOUR; // 2:00 PM IST
    carrierRecommended = 'MM Local Rider';

    const isBeforeSameDayCutoff = currentHour < MALDA_SAME_DAY_CUTOFF_HOUR;
    const isTodayBusinessDay = isBusinessDay(istDate);

    if (isBeforeSameDayCutoff && isTodayBusinessDay) {
      // Same Day Delivery
      isSameDayEligible = true;
      estimatedDays = 0;
      deliveryTargetDate = new Date(istDate.getTime());
      
      const dateFormatted = formatAmazonDeliveryDate(deliveryTargetDate);
      fullPromiseBn = `আজ সন্ধ্যা ৭টার মধ্যে নিশ্চিত ডেলিভারি (${dateFormatted.formattedBn})`;
      fullPromiseEn = `Guaranteed Delivery Today by 7 PM (${dateFormatted.formattedEn})`;
      slaBadgeBn = 'আজ দুপুর ২টার মধ্যে অর্ডার করলে আজই ডেলিভারি';
      slaBadgeEn = 'Order before 2 PM for Delivery Today';
    } else {
      // Next Day Delivery (Order placed after 2 PM or today is Sunday/holiday)
      isSameDayEligible = false;
      isTomorrow = true;
      estimatedDays = 1;
      deliveryTargetDate = addBusinessDays(istDate, 1);

      const dateFormatted = formatAmazonDeliveryDate(deliveryTargetDate);
      fullPromiseBn = `মালদা টাউনে আগামীকাল বিকেলের মধ্যে নিশ্চিত ফ্রি ডেলিভারি (${dateFormatted.formattedBn})`;
      fullPromiseEn = `Guaranteed Free Delivery in Malda Town by Tomorrow afternoon (${dateFormatted.formattedEn})`;
      slaBadgeBn = 'মালদা টাউনে আগামীকাল বিকেলের মধ্যে নিশ্চিত ফ্রি ডেলিভারি';
      slaBadgeEn = 'Guaranteed Free Delivery by Tomorrow in Malda Town';
      cutoffHour = STANDARD_DISPATCH_CUTOFF_HOUR; // Next cycle cutoff is 5 PM
    }
  }

  // --------------------------------------------------------------------------
  // TASK 13: REGIONAL SLA (North & South Dinajpur & Murshidabad)
  // --------------------------------------------------------------------------
  else if (zone === 'regional_north_bengal' || ['733', '742'].some((p) => pincode.startsWith(p))) {
    cutoffHour = STANDARD_DISPATCH_CUTOFF_HOUR; // 5:00 PM IST
    carrierRecommended = 'Delhivery';
    const isPastCutoff = currentHour >= STANDARD_DISPATCH_CUTOFF_HOUR;
    
    // 1 to 2 business days
    const baseDays = isPastCutoff ? 2 : 1;
    estimatedDays = baseDays;
    deliveryTargetDate = addBusinessDays(istDate, baseDays);

    const dateFormatted = formatAmazonDeliveryDate(deliveryTargetDate);
    fullPromiseBn = `ডেলিভারি হবে ${dateFormatted.formattedBn}-এর মধ্যে (১ থেকে ২ কার্যদিবসের মধ্যে ডেলিভারি)`;
    fullPromiseEn = `Delivery by ${dateFormatted.formattedEn} (1 to 2 business days)`;
    slaBadgeBn = '১ থেকে ২ কার্যদিবসের মধ্যে ডেলিভারি';
    slaBadgeEn = 'Fast Delivery in 1-2 Business Days';
  }

  // --------------------------------------------------------------------------
  // TASK 14: KOLKATA & REST OF WEST BENGAL SLA
  // --------------------------------------------------------------------------
  else if (zone === 'south_bengal') {
    cutoffHour = STANDARD_DISPATCH_CUTOFF_HOUR;
    carrierRecommended = 'Delhivery';
    const isPastCutoff = currentHour >= STANDARD_DISPATCH_CUTOFF_HOUR;

    // 2 to 3 days
    const baseDays = isPastCutoff ? 3 : 2;
    estimatedDays = baseDays;
    deliveryTargetDate = addBusinessDays(istDate, baseDays);

    const dateFormatted = formatAmazonDeliveryDate(deliveryTargetDate);
    fullPromiseBn = `ডেলিভারি হবে ${dateFormatted.formattedBn}-এর মধ্যে (২ থেকে ৩ দিনের মধ্যে এক্সপ্রেস ডেলিভারি)`;
    fullPromiseEn = `Delivery by ${dateFormatted.formattedEn} (2 to 3 days express delivery)`;
    slaBadgeBn = '২ থেকে ৩ দিনের মধ্যে এক্সপ্রেস ডেলিভারি';
    slaBadgeEn = 'Express Delivery in 2-3 Days';
  }

  // --------------------------------------------------------------------------
  // TASK 15: NATIONAL SLA (ALL INDIA)
  // --------------------------------------------------------------------------
  else {
    cutoffHour = STANDARD_DISPATCH_CUTOFF_HOUR;
    carrierRecommended = 'India Post';
    const isPastCutoff = currentHour >= STANDARD_DISPATCH_CUTOFF_HOUR;

    // 4 to 6 business days
    const baseDays = isPastCutoff ? 5 : 4;
    estimatedDays = baseDays;
    deliveryTargetDate = addBusinessDays(istDate, baseDays);

    const dateFormatted = formatAmazonDeliveryDate(deliveryTargetDate);
    fullPromiseBn = `ডেলিভারি হবে ${dateFormatted.formattedBn}-এর মধ্যে (৪ থেকে ৬ কার্যদিবসের মধ্যে ডেলিভারি)`;
    fullPromiseEn = `Delivery by ${dateFormatted.formattedEn} (4 to 6 business days delivery)`;
    slaBadgeBn = '৪ থেকে ৬ কার্যদিবসের মধ্যে ডেলিভারি';
    slaBadgeEn = 'All-India Delivery in 4-6 Business Days';
  }

  // --------------------------------------------------------------------------
  // TASK 11: AMAZON-STYLE FORMATTED DELIVERY DATE
  // --------------------------------------------------------------------------
  const finalFormatted = formatAmazonDeliveryDate(deliveryTargetDate);

  // Cutoff Remaining Calculation
  const currentTotalMins = currentHour * 60 + currentMinute;
  const cutoffTotalMins = cutoffHour * 60 + cutoffMinute;
  const isCutoffPassed = currentTotalMins >= cutoffTotalMins;

  let remainingMs = 0;
  if (!isCutoffPassed) {
    const targetTime = new Date(istDate.getTime());
    targetTime.setHours(cutoffHour, cutoffMinute, 0, 0);
    remainingMs = Math.max(0, targetTime.getTime() - istDate.getTime());
  } else {
    // Countdown to tomorrow's dispatch cutoff
    const tomorrowTarget = new Date(istDate.getTime());
    tomorrowTarget.setDate(tomorrowTarget.getDate() + 1);
    tomorrowTarget.setHours(cutoffHour, cutoffMinute, 0, 0);
    remainingMs = Math.max(0, tomorrowTarget.getTime() - istDate.getTime());
  }

  return {
    pincode,
    zone,
    estimatedDays,
    deliveryDate: deliveryTargetDate,
    formattedDateBn: finalFormatted.formattedBn,
    formattedDateEn: finalFormatted.formattedEn,
    fullPromiseBn,
    fullPromiseEn,
    slaBadgeBn,
    slaBadgeEn,
    isMaldaTown,
    isSameDayEligible,
    isTomorrow,
    cutoffHour,
    cutoffMinute,
    isCutoffPassed,
    cutoffRemainingMs: remainingMs,
    isExpressOptionAvailable: isMaldaTown,
    expressFee: MALDA_2HR_EXPRESS_FEE,
    carrierRecommended,
  };
}
