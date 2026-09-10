/**
 * Module 8: Edge & In-Memory Pincode Geo-Serviceability Data & Lookup Engine
 * M.M Book House Malda - E-Commerce Platform
 * Fast O(1) <10ms response time with prefix rules & cookie persistence.
 */

import {
  DeliveryZone,
  PincodeLookupResult,
  PincodeServiceability,
} from '@/types/delivery';
import {
  addBusinessDays,
  formatAmazonDeliveryDate,
} from '@/lib/services/holidayCalendar';

export const PINCODE_COOKIE_NAME = 'mm_pincode';
export const DEFAULT_PINCODE = '732101';

export function isMaldaTownPincode(pincode: string): boolean {
  if (!pincode) return false;
  const cleaned = pincode.replace(/\D/g, '');
  return cleaned.startsWith('732') || cleaned === DEFAULT_PINCODE;
}

/**
 * Bengali numeric characters mapping
 */
const BENGALI_TO_ENGLISH_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const ENGLISH_TO_BENGALI_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const BENGALI_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

/**
 * Normalize any Bengali digits to standard ASCII digits 0-9
 */
export function normalizePincodeDigits(input: string): string {
  if (!input) return '';
  return input.replace(/[০-৯]/g, (char) => BENGALI_TO_ENGLISH_DIGITS[char] ?? char);
}

/**
 * Convert ASCII numbers to Bengali script numbers
 */
export function toBengaliScript(input: number | string): string {
  const str = String(input);
  return str.replace(/[0-9]/g, (char) => ENGLISH_TO_BENGALI_DIGITS[char] ?? char);
}

/**
 * Validates Indian 6-digit postal code using regex ^[1-9][0-9]{5}$
 */
export function validateIndianPincode(input: string): {
  isValid: boolean;
  normalizedPincode: string;
  error?: string;
} {
  if (!input) {
    return {
      isValid: false,
      normalizedPincode: '',
      error: 'পিনকোড প্রদান করুন',
    };
  }

  // Convert Bengali numerals to ASCII digits
  const normalized = normalizePincodeDigits(input).trim();
  // Remove common separators (spaces and hyphens)
  const cleaned = normalized.replace(/[\s\-]/g, '');

  if (cleaned.length === 0) {
    return {
      isValid: false,
      normalizedPincode: '',
      error: 'পিনকোড প্রদান করুন',
    };
  }

  // Reject if any non-digit remains
  if (/\D/.test(cleaned)) {
    return {
      isValid: false,
      normalizedPincode: cleaned,
      error: 'পিনকোডে শুধুমাত্র সংখ্যা গ্রহণযোগ্য',
    };
  }

  if (cleaned.length !== 6) {
    return {
      isValid: false,
      normalizedPincode: cleaned,
      error: 'পিনকোড অবশ্যই ৬ সংখ্যার হতে হবে',
    };
  }

  const isValidFormat = /^[1-9][0-9]{5}$/.test(cleaned);
  if (!isValidFormat) {
    return {
      isValid: false,
      normalizedPincode: cleaned,
      error: 'সঠিক ৬-ডিজিটের ভারতীয় পিনকোড দিন (প্রথম সংখ্যা ০ হতে পারে না)',
    };
  }

  return {
    isValid: true,
    normalizedPincode: cleaned,
  };
}

/**
 * Cookie Persistence Helpers
 */
export function getDeliveryPincodeCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + PINCODE_COOKIE_NAME + '=([^;]*)')
  );
  if (match && match[2]) {
    const val = decodeURIComponent(match[2]).trim();
    if (/^[1-9][0-9]{5}$/.test(val)) {
      return val;
    }
  }
  return null;
}

export function setDeliveryPincodeCookie(pincode: string, days = 365): void {
  if (typeof document === 'undefined') return;
  const val = normalizePincodeDigits(pincode).trim();
  if (!/^[1-9][0-9]{5}$/.test(val)) return;

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = '; expires=' + date.toUTCString();
  document.cookie = `${PINCODE_COOKIE_NAME}=${encodeURIComponent(val)}${expires}; path=/; SameSite=Lax`;
}

export function removeDeliveryPincodeCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${PINCODE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

/**
 * Calculates human readable delivery dates in Bengali and English
 * Taking into account Sunday closures and official government holidays.
 */
export function computeDeliveryDateTexts(days: number): {
  dateTextBn: string;
  dateTextEn: string;
  tagBn: string;
  tagEn: string;
  formattedDate: string;
} {
  const now = new Date();
  const targetDate = addBusinessDays(now, days);
  const formatted = formatAmazonDeliveryDate(targetDate);

  if (days <= 0) {
    return {
      dateTextBn: `আজ সন্ধ্যা ৭টার মধ্যে নিশ্চিত ডেলিভারি (${formatted.formattedBn})`,
      dateTextEn: `Guaranteed Delivery Today by 7 PM (${formatted.formattedEn})`,
      tagBn: 'আজকের মধ্যে ডেলিভারি',
      tagEn: 'Same-Day Delivery',
      formattedDate: formatted.formattedBn,
    };
  }

  if (days === 1) {
    return {
      dateTextBn: `আগামীকাল বিকেল ৫টার মধ্যে নিশ্চিত ডেলিভারি (${formatted.formattedBn})`,
      dateTextEn: `Guaranteed Delivery Tomorrow by 5 PM (${formatted.formattedEn})`,
      tagBn: 'কালকের মধ্যে ডেলিভারি',
      tagEn: 'Delivery by Tomorrow',
      formattedDate: formatted.formattedBn,
    };
  }

  return {
    dateTextBn: `ডেলিভারি হবে ${formatted.formattedBn}-এর মধ্যে (${toBengaliScript(days)} কার্যদিবস)`,
    dateTextEn: `Delivery by ${formatted.formattedEn} (${days} business days)`,
    tagBn: `${toBengaliScript(days)} দিনের মধ্যে ডেলিভারি`,
    tagEn: `Delivery in ${days} Days`,
    formattedDate: formatted.formattedBn,
  };
}

/**
 * High-Speed In-Memory Cache of Exact Known Serviceability Hubs (<1ms)
 */
export const EXACT_PINCODES_CACHE: Record<string, PincodeServiceability> = {
  // Malda District Hubs (Local Malda)
  '732101': {
    pincode: '732101',
    postOffice: 'English Bazar (Malda Town H.O.)',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 1,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: true,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'মালদা সদর: একই দিন বা কালকের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Malda Town: Same-day or Tomorrow Delivery',
  },
  '732102': {
    pincode: '732102',
    postOffice: 'Old Malda S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 1,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: true,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'ওল্ড মালদা: ২৪ ঘণ্টার মধ্যে দ্রুত ডেলিভারি',
    deliveryPromiseEn: 'Old Malda: Fast 24-hour Delivery',
  },
  '732103': {
    pincode: '732103',
    postOffice: 'Mangalbari S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 1,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: true,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'মঙ্গলবাড়ি: ২৪ ঘণ্টার মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Mangalbari: 24-hour Delivery',
  },
  '732124': {
    pincode: '732124',
    postOffice: 'Chanchal S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'চাঁচল: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Chanchal: 1-2 Days Delivery',
  },
  '732125': {
    pincode: '732125',
    postOffice: 'Gazole S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'গাজোল: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Gazole: 1-2 Days Delivery',
  },
  '732138': {
    pincode: '732138',
    postOffice: 'Ratua S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'রতুয়া: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Ratua: 1-2 Days Delivery',
  },
  '732142': {
    pincode: '732142',
    postOffice: 'Samsi S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'সামসি: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Samsi: 1-2 Days Delivery',
  },
  '732201': {
    pincode: '732201',
    postOffice: 'Kaliachak S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'কালিয়াচক: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Kaliachak: 1-2 Days Delivery',
  },
  '732126': {
    pincode: '732126',
    postOffice: 'Harischandrapur S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'হরিশ্চন্দ্রপুর: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Harischandrapur: 1-2 Days Delivery',
  },
  '732128': {
    pincode: '732128',
    postOffice: 'Sujapur S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 1,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: true,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'সুজাপুর: ২৪ ঘণ্টার মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Sujapur: Fast 24-hour Delivery',
  },
  '732141': {
    pincode: '732141',
    postOffice: 'Bhaluka S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'ভালুকা: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Bhaluka: 1-2 Days Delivery',
  },
  '732202': {
    pincode: '732202',
    postOffice: 'Baishnabnagar S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'বৈষ্ণবনগর: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Baishnabnagar: 1-2 Days Delivery',
  },
  '732203': {
    pincode: '732203',
    postOffice: 'Manikchak S.O.',
    district: 'Malda',
    state: 'West Bengal',
    deliveryZone: 'local_malda',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'মানিকচক: ১-২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Manikchak: 1-2 Days Delivery',
  },

  // Dinajpur (North Bengal)
  '733129': {
    pincode: '733129',
    postOffice: 'Raiganj Town',
    district: 'Uttar Dinajpur',
    state: 'West Bengal',
    deliveryZone: 'regional_north_bengal',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'রায়গঞ্জ: ২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Raiganj: 2 Days Delivery',
  },
  '733134': {
    pincode: '733134',
    postOffice: 'Balurghat Town',
    district: 'Dakshin Dinajpur',
    state: 'West Bengal',
    deliveryZone: 'regional_north_bengal',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'বালুরঘাট: ২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Balurghat: 2 Days Delivery',
  },

  // Siliguri (Darjeeling / North Bengal)
  '734001': {
    pincode: '734001',
    postOffice: 'Siliguri Town H.O.',
    district: 'Darjeeling',
    state: 'West Bengal',
    deliveryZone: 'regional_north_bengal',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'শিলিগুড়ি: ২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Siliguri: 2 Days Delivery',
  },

  // Murshidabad (South Bengal)
  '742101': {
    pincode: '742101',
    postOffice: 'Berhampore Town H.O.',
    district: 'Murshidabad',
    state: 'West Bengal',
    deliveryZone: 'south_bengal',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'বহরমপুর: ২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Berhampore: 2 Days Delivery',
  },

  // Kolkata (South Bengal)
  '700001': {
    pincode: '700001',
    postOffice: 'Kolkata G.P.O.',
    district: 'Kolkata',
    state: 'West Bengal',
    deliveryZone: 'south_bengal',
    estimatedDeliveryDays: 3,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'কলকাতা জিপিও: ২-৩ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Kolkata GPO: 2-3 Days Delivery',
  },
  '700073': {
    pincode: '700073',
    postOffice: 'College Street (Boipara) S.O.',
    district: 'Kolkata',
    state: 'West Bengal',
    deliveryZone: 'south_bengal',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: true,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'কলেজ স্ট্রিট (বইপাড়া): দ্রুত ২ দিনের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'College Street (Boipara): Fast 2-Day Delivery',
  },

  // Other Major Bengal Hubs
  '713201': {
    pincode: '713201',
    postOffice: 'Durgapur City Centre',
    district: 'Paschim Bardhaman',
    state: 'West Bengal',
    deliveryZone: 'south_bengal',
    estimatedDeliveryDays: 3,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'দুর্গাপুর: ২-৩ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Durgapur: 2-3 Days Delivery',
  },
  '713301': {
    pincode: '713301',
    postOffice: 'Asansol H.O.',
    district: 'Paschim Bardhaman',
    state: 'West Bengal',
    deliveryZone: 'south_bengal',
    estimatedDeliveryDays: 3,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'আসানসোল: ২-৩ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Asansol: 2-3 Days Delivery',
  },
  '711101': {
    pincode: '711101',
    postOffice: 'Howrah H.O.',
    district: 'Howrah',
    state: 'West Bengal',
    deliveryZone: 'south_bengal',
    estimatedDeliveryDays: 3,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'হাওড়া: ২-৩ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Howrah: 2-3 Days Delivery',
  },
  '721301': {
    pincode: '721301',
    postOffice: 'Kharagpur Town',
    district: 'Paschim Medinipur',
    state: 'West Bengal',
    deliveryZone: 'south_bengal',
    estimatedDeliveryDays: 3,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'খড়গপুর: ৩ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Kharagpur: 3 Days Delivery',
  },
  '735101': {
    pincode: '735101',
    postOffice: 'Jalpaiguri H.O.',
    district: 'Jalpaiguri',
    state: 'West Bengal',
    deliveryZone: 'regional_north_bengal',
    estimatedDeliveryDays: 2,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'জলপাইগুড়ি: ২ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Jalpaiguri: 2 Days Delivery',
  },
  '736101': {
    pincode: '736101',
    postOffice: 'Cooch Behar H.O.',
    district: 'Cooch Behar',
    state: 'West Bengal',
    deliveryZone: 'regional_north_bengal',
    estimatedDeliveryDays: 3,
    isCodAvailable: true,
    codHandlingFee: 0,
    isExpressAvailable: false,
    minOrderFreeShipping: 499,
    deliveryPromiseBn: 'কোচবিহার: ২-৩ কার্যদিবসের মধ্যে ডেলিভারি',
    deliveryPromiseEn: 'Cooch Behar: 2-3 Days Delivery',
  },
};

/**
 * Standard Offline / Graceful Error Fallback Message
 * "সাধারণত পশ্চিমবঙ্গে ২-৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়"
 */
export const OFFLINE_FALLBACK_MESSAGE_BN =
  'সাধারণত পশ্চিমবঙ্গে ২-৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়';
export const OFFLINE_FALLBACK_MESSAGE_EN =
  'Standard delivery across West Bengal usually takes 2-3 business days';

/**
 * Fast O(1) Edge and In-Memory Serviceability Lookup (<10ms)
 * Evaluates exact hub matches or applies intelligent zonal postal prefix rules.
 */
export function lookupPincodeServiceability(rawPincode: string): PincodeLookupResult {
  const validation = validateIndianPincode(rawPincode);
  const pincode = validation.isValid ? validation.normalizedPincode : DEFAULT_PINCODE;

  // 1. Exact Database Cache Lookup
  const exact = EXACT_PINCODES_CACHE[pincode];
  if (exact) {
    const { dateTextBn, dateTextEn, tagBn, tagEn, formattedDate } =
      computeDeliveryDateTexts(exact.estimatedDeliveryDays);

    return {
      pincode: exact.pincode,
      postOffice: exact.postOffice,
      area: exact.postOffice,
      district: exact.district,
      state: exact.state,
      deliveryZone: exact.deliveryZone,
      estimatedDeliveryDays: exact.estimatedDeliveryDays,
      isDeliverable: true,
      isCodAvailable: exact.isCodAvailable,
      codHandlingFee: exact.codHandlingFee,
      isExpressAvailable: exact.isExpressAvailable,
      minOrderFreeShipping: exact.minOrderFreeShipping,
      deliveryDateTextBn: dateTextBn,
      deliveryDateTextEn: dateTextEn,
      deliveryTagBn: tagBn,
      deliveryTagEn: tagEn,
      isFallback: false,
      source: 'exact_db',
      formattedExpectedDate: formattedDate,
    };
  }

  // 2. Intelligent Postal Prefix Rules (India Post / Bengal Hierarchy)
  let zone: DeliveryZone = 'national';
  let days = 4;
  let area = 'লোকাল এলাকা';
  let district = 'ভারত';
  let state = 'ভারত';
  let isExpress = false;

  const prefix3 = pincode.substring(0, 3);
  const prefix2 = pincode.substring(0, 2);
  const prefix1 = pincode.substring(0, 1);

  if (prefix3 === '732') {
    // Malda District Rural/Sub-divisions
    zone = 'local_malda';
    days = 2;
    area = 'মালদা জেলা';
    district = 'মালদা';
    state = 'পশ্চিমবঙ্গ';
    isExpress = false;
  } else if (prefix3 === '733') {
    // Dinajpur
    zone = 'regional_north_bengal';
    days = 2;
    area = 'দিনাজপুর অঞ্চল';
    district = 'দিনাজপুর';
    state = 'পশ্চিমবঙ্গ';
  } else if (prefix3 === '734') {
    // Darjeeling / Siliguri
    zone = 'regional_north_bengal';
    days = 2;
    area = 'শিলিগুড়ি / দার্জিলিং';
    district = 'দার্জিলিং';
    state = 'পশ্চিমবঙ্গ';
  } else if (prefix3 === '735' || prefix3 === '736') {
    // Jalpaiguri, Alipurduar, Cooch Behar
    zone = 'regional_north_bengal';
    days = 3;
    area = 'উত্তরবঙ্গ অঞ্চল';
    district = prefix3 === '735' ? 'জলপাইগুড়ি' : 'কোচবিহার';
    state = 'পশ্চিমবঙ্গ';
  } else if (prefix3 === '742') {
    // Murshidabad
    zone = 'south_bengal';
    days = 2;
    area = 'মুর্শিদাবাদ জেলা';
    district = 'মুর্শিদাবাদ';
    state = 'পশ্চিমবঙ্গ';
  } else if (
    ['700', '711', '712', '713', '721', '722', '723', '741', '743'].includes(prefix3)
  ) {
    // Kolkata & South Bengal
    zone = 'south_bengal';
    days = 3;
    area = prefix3 === '700' ? 'কলকাতা মেট্রো' : 'দক্ষিণবঙ্গ';
    district = prefix3 === '700' ? 'কলকাতা' : 'পশ্চিমবঙ্গ';
    state = 'পশ্চিমবঙ্গ';
  } else if (prefix1 === '7') {
    // Eastern Zone
    zone = 'national';
    days = 4;
    area = 'পূর্বাঞ্চল';
    district = 'পূর্ব ভারত';
    state = 'ভারত';
  } else {
    // All India National
    zone = 'national';
    days = 5;
    area = 'সর্বভারতীয় ডেলিভারি';
    district = 'ভারত ডেলিভারি';
    state = 'ভারত';
  }

  // Check for remote / hill / island regions where private courier is unavailable
  const isRemoteArea = ['790', '791', '792', '793', '794', '795', '796', '797', '798', '799', '190', '191', '192', '193', '194', '744'].some(
    (prefix) => pincode.startsWith(prefix)
  );

  const isCod = !isRemoteArea;
  const codFee = zone === 'local_malda' ? 0 : 30;

  const { dateTextBn, dateTextEn, tagBn, tagEn, formattedDate } =
    computeDeliveryDateTexts(days);

  return {
    pincode,
    postOffice: area,
    area,
    district,
    state,
    deliveryZone: zone,
    estimatedDeliveryDays: days,
    isDeliverable: true,
    isCodAvailable: isCod,
    codHandlingFee: codFee,
    isExpressAvailable: isExpress,
    minOrderFreeShipping: 499,
    deliveryDateTextBn: dateTextBn,
    deliveryDateTextEn: dateTextEn,
    deliveryTagBn: tagBn,
    deliveryTagEn: tagEn,
    isFallback: !validation.isValid,
    source: validation.isValid ? 'prefix_rule' : 'offline_fallback',
    formattedExpectedDate: formattedDate,
  };
}

/**
 * Task 23 & 24: Store Pickup (BOPIS) Malda Showroom Configuration
 */
export const MALDA_STORE_INFO = {
  storeName: 'M.M Book House Malda Showroom',
  storeNameBn: 'এম.এম বুক হাউস, নেতাজি সুভাষ রোড, মালদা',
  storeAddress: 'Netaji Subhash Road (Near Foara More), Malda Town - 732101',
  storeAddressBn: 'নেতাজি সুভাষ রোড (ফোয়ারা মোড় সংলগ্ন), মালদা টাউন - ৭৩২১০১',
  landmarkBn: 'ফোয়ারা মোড় সংলগ্ন',
  landmarkEn: 'Near Foara More',
  phone: '9733085000',
  phoneDisplay: '+91 97330 85000',
  openHoursBn: 'সোম – শনি: সকাল ৯:০০ – রাত ৯:৩০ | রবি: সকাল ১০:০০ – দুপুর ২:০০',
  openHoursEn: 'Mon – Sat: 9:00 AM – 9:30 PM | Sun: 10:00 AM – 2:00 PM',
  mapUrl: 'https://maps.google.com/?q=Netaji+Subhash+Road+Malda',
};

/**
 * Dynamically computes BOPIS ready estimate depending on order time
 */
export function computePickupReadyTime(now: Date = new Date()): {
  readyTextBn: string;
  readyTextEn: string;
  readySubtextBn: string;
  readySubtextEn: string;
  isReadySameDay: boolean;
} {
  const currentHour = now.getHours();

  if (currentHour < 15) {
    return {
      readyTextBn: 'আজ বিকেল ৫টার পর প্রস্তুত থাকবে',
      readyTextEn: 'Ready today after 5:00 PM',
      readySubtextBn: 'কাউন্টারে কোনো লাইন ছাড়াই সরাসরি গ্রহণ করুন',
      readySubtextEn: 'Zero queue, instant pickup at express counter',
      isReadySameDay: true,
    };
  }

  if (currentHour < 19) {
    return {
      readyTextBn: 'আজ রাত ৮:৩০-এর মধ্যে প্রস্তুত থাকবে',
      readyTextEn: 'Ready today by 8:30 PM',
      readySubtextBn: 'দোকান বন্ধ হওয়ার পূর্বে এসে সংগ্রহ করুন',
      readySubtextEn: 'Collect before store closing at 9:30 PM',
      isReadySameDay: true,
    };
  }

  return {
    readyTextBn: 'আগামীকাল সকাল ১০টার পর প্রস্তুত থাকবে',
    readyTextEn: 'Ready tomorrow after 10:00 AM',
    readySubtextBn: 'সকাল ১০টায় শোরুম খোলার সাথে সাথেই পার্সেল প্রস্তুত থাকবে',
    readySubtextEn: 'Your package will be ready right as the showroom opens at 10 AM',
    isReadySameDay: false,
  };
}

