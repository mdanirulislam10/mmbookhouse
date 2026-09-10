/**
 * Module 8: Holiday Calendar & Business Day Delivery Calculation Engine
 * M.M Book House Malda - E-Commerce Platform
 * Accurately excludes Sundays and official West Bengal & National public holidays.
 */

import { HolidayEntry } from '@/types/delivery';

export const BENGALI_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export const ENGLISH_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const BENGALI_MONTHS = [
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

export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const BENGALI_DIGITS: Record<string, string> = {
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

/**
 * Convert numbers or ASCII string to Bengali numerals
 */
export function toBengaliNumerals(value: number | string): string {
  return String(value).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[digit] ?? digit);
}

/**
 * Official West Bengal & National Gazetted Holidays (2025, 2026, 2027)
 */
export const OFFICIAL_HOLIDAYS_MAP: Record<string, HolidayEntry> = {
  // --- 2025 ---
  '2025-01-23': { date: '2025-01-23', nameEn: 'Netaji Birthday', nameBn: 'নেতাজি সুভাষচন্দ্র বসু জন্মজয়ন্তী', isNational: false },
  '2025-01-26': { date: '2025-01-26', nameEn: 'Republic Day', nameBn: 'প্রজাতন্ত্র দিবস', isNational: true },
  '2025-02-02': { date: '2025-02-02', nameEn: 'Saraswati Puja', nameBn: 'সরস্বতী পূজা', isNational: false },
  '2025-02-26': { date: '2025-02-26', nameEn: 'Maha Shivratri', nameBn: 'মহা শিবরাত্রি', isNational: false },
  '2025-03-14': { date: '2025-03-14', nameEn: 'Dol Jatra / Holi', nameBn: 'দোলযাত্রা / হোলি', isNational: false },
  '2025-03-31': { date: '2025-03-31', nameEn: 'Eid-ul-Fitr', nameBn: 'ঈদুল ফিতর', isNational: true },
  '2025-04-15': { date: '2025-04-15', nameEn: 'Bengali New Year (Poila Boishakh)', nameBn: 'পয়লা বৈশাখ (শুভ নববর্ষ)', isNational: false },
  '2025-04-18': { date: '2025-04-18', nameEn: 'Good Friday', nameBn: 'গুড ফ্রাইডে', isNational: true },
  '2025-05-01': { date: '2025-05-01', nameEn: 'May Day', nameBn: 'মে দিবস (আন্তর্জাতিক শ্রমিক দিবস)', isNational: true },
  '2025-05-09': { date: '2025-05-09', nameEn: 'Rabindra Jayanti', nameBn: 'রবীন্দ্র জয়ন্তী', isNational: false },
  '2025-06-07': { date: '2025-06-07', nameEn: 'Eid-uz-Zoha (Bakrid)', nameBn: 'ঈদুজ্জোহা (বকরি ঈদ)', isNational: true },
  '2025-07-06': { date: '2025-07-06', nameEn: 'Muharram', nameBn: 'পবিত্র মহরম', isNational: true },
  '2025-08-15': { date: '2025-08-15', nameEn: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', isNational: true },
  '2025-08-16': { date: '2025-08-16', nameEn: 'Janmashtami', nameBn: 'শ্রীকৃষ্ণ জন্মাষ্টমী', isNational: true },
  '2025-09-30': { date: '2025-09-30', nameEn: 'Durga Puja Maha Saptami', nameBn: 'দুর্গাপূজা মহাসপ্তমী', isNational: false },
  '2025-10-01': { date: '2025-10-01', nameEn: 'Durga Puja Maha Ashtami', nameBn: 'দুর্গাপূজা মহাষ্টমী', isNational: false },
  '2025-10-02': { date: '2025-10-02', nameEn: 'Gandhi Jayanti & Navami', nameBn: 'গান্ধী জয়ন্তী ও মহানবমী', isNational: true },
  '2025-10-03': { date: '2025-10-03', nameEn: 'Vijaya Dashami', nameBn: 'বিজয়া দশমী', isNational: true },
  '2025-10-06': { date: '2025-10-06', nameEn: 'Lakshmi Puja', nameBn: 'লক্ষ্মীপূজা', isNational: false },
  '2025-10-20': { date: '2025-10-20', nameEn: 'Kali Puja / Diwali', nameBn: 'কালীপূজা / দীপাবলি', isNational: true },
  '2025-10-22': { date: '2025-10-22', nameEn: 'Bhai Phota', nameBn: 'ভ্রাতৃদ্বিতীয়া (ভাইফোঁটা)', isNational: false },
  '2025-11-05': { date: '2025-11-05', nameEn: 'Guru Nanak Jayanti', nameBn: 'গুরু নানক জয়ন্তী', isNational: true },
  '2025-12-25': { date: '2025-12-25', nameEn: 'Christmas Day', nameBn: 'বড়দিন (ক্রিসমাস)', isNational: true },

  // --- 2026 ---
  '2026-01-23': { date: '2026-01-23', nameEn: 'Netaji Birthday', nameBn: 'নেতাজি সুভাষচন্দ্র বসু জন্মজয়ন্তী', isNational: false },
  '2026-01-26': { date: '2026-01-26', nameEn: 'Republic Day', nameBn: 'প্রজাতন্ত্র দিবস', isNational: true },
  '2026-02-15': { date: '2026-02-15', nameEn: 'Maha Shivratri', nameBn: 'মহা শিবরাত্রি', isNational: false },
  '2026-02-23': { date: '2026-02-23', nameEn: 'Saraswati Puja', nameBn: 'সরস্বতী পূজা', isNational: false },
  '2026-03-04': { date: '2026-03-04', nameEn: 'Dol Jatra / Holi', nameBn: 'দোলযাত্রা / হোলি', isNational: false },
  '2026-03-21': { date: '2026-03-21', nameEn: 'Eid-ul-Fitr', nameBn: 'ঈদুল ফিতর', isNational: true },
  '2026-04-03': { date: '2026-04-03', nameEn: 'Good Friday', nameBn: 'গুড ফ্রাইডে', isNational: true },
  '2026-04-15': { date: '2026-04-15', nameEn: 'Bengali New Year (Poila Boishakh)', nameBn: 'পয়লা বৈশাখ (শুভ নববর্ষ)', isNational: false },
  '2026-05-01': { date: '2026-05-01', nameEn: 'May Day', nameBn: 'মে দিবস', isNational: true },
  '2026-05-09': { date: '2026-05-09', nameEn: 'Rabindra Jayanti', nameBn: 'রবীন্দ্র জয়ন্তী', isNational: false },
  '2026-05-28': { date: '2026-05-28', nameEn: 'Eid-uz-Zoha (Bakrid)', nameBn: 'ঈদুজ্জোহা (বকরি ঈদ)', isNational: true },
  '2026-06-26': { date: '2026-06-26', nameEn: 'Muharram', nameBn: 'পবিত্র মহরম', isNational: true },
  '2026-08-15': { date: '2026-08-15', nameEn: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', isNational: true },
  '2026-09-04': { date: '2026-09-04', nameEn: 'Janmashtami', nameBn: 'শ্রীকৃষ্ণ জন্মাষ্টমী', isNational: true },
  '2026-10-02': { date: '2026-10-02', nameEn: 'Gandhi Jayanti', nameBn: 'গান্ধী জয়ন্তী', isNational: true },
  '2026-10-18': { date: '2026-10-18', nameEn: 'Durga Puja Maha Saptami', nameBn: 'দুর্গাপূজা মহাসপ্তমী', isNational: false },
  '2026-10-19': { date: '2026-10-19', nameEn: 'Durga Puja Maha Ashtami', nameBn: 'দুর্গাপূজা মহাষ্টমী', isNational: false },
  '2026-10-20': { date: '2026-10-20', nameEn: 'Durga Puja Maha Navami', nameBn: 'দুর্গাপূজা মহানবমী', isNational: false },
  '2026-10-21': { date: '2026-10-21', nameEn: 'Vijaya Dashami', nameBn: 'বিজয়া দশমী', isNational: true },
  '2026-10-25': { date: '2026-10-25', nameEn: 'Lakshmi Puja', nameBn: 'লক্ষ্মীপূজা', isNational: false },
  '2026-11-08': { date: '2026-11-08', nameEn: 'Kali Puja / Diwali', nameBn: 'কালীপূজা / দীপাবলি', isNational: true },
  '2026-11-10': { date: '2026-11-10', nameEn: 'Bhai Phota', nameBn: 'ভ্রাতৃদ্বিতীয়া (ভাইফোঁটা)', isNational: false },
  '2026-11-24': { date: '2026-11-24', nameEn: 'Guru Nanak Jayanti', nameBn: 'গুরু নানক জয়ন্তী', isNational: true },
  '2026-12-25': { date: '2026-12-25', nameEn: 'Christmas Day', nameBn: 'বড়দিন (ক্রিসমাস)', isNational: true },

  // --- 2027 ---
  '2027-01-23': { date: '2027-01-23', nameEn: 'Netaji Birthday', nameBn: 'নেতাজি সুভাষচন্দ্র বসু জন্মজয়ন্তী', isNational: false },
  '2027-01-26': { date: '2027-01-26', nameEn: 'Republic Day', nameBn: 'প্রজাতন্ত্র দিবস', isNational: true },
  '2027-03-22': { date: '2027-03-22', nameEn: 'Dol Jatra / Holi', nameBn: 'দোলযাত্রা / হোলি', isNational: false },
  '2027-04-15': { date: '2027-04-15', nameEn: 'Bengali New Year', nameBn: 'পয়লা বৈশাখ', isNational: false },
  '2027-05-01': { date: '2027-05-01', nameEn: 'May Day', nameBn: 'মে দিবস', isNational: true },
  '2027-08-15': { date: '2027-08-15', nameEn: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', isNational: true },
  '2027-10-02': { date: '2027-10-02', nameEn: 'Gandhi Jayanti', nameBn: 'গান্ধী জয়ন্তী', isNational: true },
  '2027-12-25': { date: '2027-12-25', nameEn: 'Christmas Day', nameBn: 'বড়দিন', isNational: true },
};

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if a given date falls on a Sunday (couriers & transit hubs closed)
 */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Returns holiday entry if the date is an official national or state holiday
 */
export function getHolidayInfo(date: Date): HolidayEntry | null {
  const key = formatDateToKey(date);
  return OFFICIAL_HOLIDAYS_MAP[key] ?? null;
}

/**
 * Checks if date is a valid operating business day (not Sunday, not holiday)
 */
export function isBusinessDay(date: Date): boolean {
  if (isSunday(date)) return false;
  if (getHolidayInfo(date)) return false;
  return true;
}

/**
 * Add business days to a starting date, skipping Sundays and official public holidays.
 */
export function addBusinessDays(startDate: Date, businessDaysCount: number): Date {
  const cursor = new Date(startDate.getTime());
  let added = 0;

  // If businessDaysCount is 0 (e.g. Same Day), verify if cursor is a business day
  if (businessDaysCount <= 0) {
    while (!isBusinessDay(cursor)) {
      cursor.setDate(cursor.getDate() + 1);
    }
    return cursor;
  }

  while (added < businessDaysCount) {
    cursor.setDate(cursor.getDate() + 1);
    if (isBusinessDay(cursor)) {
      added++;
    }
  }

  return cursor;
}

/**
 * Get next available business day from cursor
 */
export function getNextBusinessDay(date: Date): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + 1);
  while (!isBusinessDay(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Amazon-Style Date Formatter
 * Formats like "বুধবার, ১২ মার্চ" and "Wednesday, 12 March"
 * Contextually detects Today and Tomorrow for authentic Amazon urgency.
 */
export function formatAmazonDeliveryDate(
  date: Date,
  referenceDate: Date = new Date()
): {
  dayOfWeekBn: string;
  dayOfWeekEn: string;
  dateBn: string;
  dateEn: number;
  monthBn: string;
  monthEn: string;
  formattedBn: string;
  formattedEn: string;
  fullPromiseBn: string;
  fullPromiseEn: string;
  isToday: boolean;
  isTomorrow: boolean;
} {
  const dayIndex = date.getDay();
  const monthIndex = date.getMonth();
  const dayOfMonth = date.getDate();

  const dayOfWeekBn = BENGALI_DAYS[dayIndex];
  const dayOfWeekEn = ENGLISH_DAYS[dayIndex];

  const monthBn = BENGALI_MONTHS[monthIndex];
  const monthEn = ENGLISH_MONTHS[monthIndex];

  const dateBn = toBengaliNumerals(dayOfMonth);
  const dateEn = dayOfMonth;

  const formattedBn = `${dayOfWeekBn}, ${dateBn} ${monthBn}`;
  const formattedEn = `${dayOfWeekEn}, ${dateEn} ${monthEn}`;

  const refDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const isToday = targetDay === refDay;
  const isTomorrow = targetDay === refDay + oneDayMs;

  let fullPromiseBn: string;
  let fullPromiseEn: string;

  if (isToday) {
    fullPromiseBn = `আজ বিকেল ৫টার মধ্যে নিশ্চিত ডেলিভারি হবে (${formattedBn})`;
    fullPromiseEn = `Guaranteed Delivery Today by 5 PM (${formattedEn})`;
  } else if (isTomorrow) {
    fullPromiseBn = `আগামীকাল ${formattedBn}-এর মধ্যে নিশ্চিত ডেলিভারি হবে`;
    fullPromiseEn = `Guaranteed Delivery Tomorrow by 5 PM (${formattedEn})`;
  } else {
    fullPromiseBn = `ডেলিভারি হবে ${formattedBn}-এর মধ্যে`;
    fullPromiseEn = `Delivery by ${formattedEn}`;
  }

  return {
    dayOfWeekBn,
    dayOfWeekEn,
    dateBn,
    dateEn,
    monthBn,
    monthEn,
    formattedBn,
    formattedEn,
    fullPromiseBn,
    fullPromiseEn,
    isToday,
    isTomorrow,
  };
}

/**
 * Task 49: Festival Holiday Scheduler & Buffer Adjuster
 * Applies administrative festival buffer days (e.g. Durga Puja, Eid, Diwali)
 */
export const FESTIVAL_SCHEDULES: Record<string, {
  nameBn: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  bufferDays: number;
  advisoryBn: string;
  advisoryEn: string;
}> = {
  durga_puja_2026: {
    nameBn: 'শারদীয়া দুর্গাপূজা ২০২৬',
    nameEn: 'Durga Puja Festival 2026',
    startDate: '2026-10-18',
    endDate: '2026-10-24',
    bufferDays: 2,
    advisoryBn: 'পূজার ছুটির কারণে ডেলিভারিতে ১-২ দিন অতিরিক্ত সময় লাগতে পারে',
    advisoryEn: 'Deliveries may take 1-2 extra days due to Durga Puja holidays',
  },
  eid_2026: {
    nameBn: 'পবিত্র ঈদুল ফিতর ২০২৬',
    nameEn: 'Eid-ul-Fitr 2026',
    startDate: '2026-03-20',
    endDate: '2026-03-23',
    bufferDays: 1,
    advisoryBn: 'ঈদের ছুটির কারণে কুরিয়ার সার্ভিসে সামান্য বিলম্ব হতে পারে',
    advisoryEn: 'Courier dispatch may experience slight delay during Eid festival',
  },
};

export function getFestivalAdjustedDeliveryDate(
  baseDeliveryDate: Date,
  festivalKey?: string
): {
  adjustedDate: Date;
  isFestivalPeriod: boolean;
  festivalNameBn?: string;
  bufferDaysAdded: number;
  advisoryBn?: string;
} {
  const dateStr = baseDeliveryDate.toISOString().slice(0, 10);

  // If explicit festivalKey provided
  if (festivalKey && FESTIVAL_SCHEDULES[festivalKey]) {
    const fest = FESTIVAL_SCHEDULES[festivalKey];
    const adjusted = addBusinessDays(baseDeliveryDate, fest.bufferDays);
    return {
      adjustedDate: adjusted,
      isFestivalPeriod: true,
      festivalNameBn: fest.nameBn,
      bufferDaysAdded: fest.bufferDays,
      advisoryBn: fest.advisoryBn,
    };
  }

  // Auto-detect if date lands inside active festival range
  for (const fest of Object.values(FESTIVAL_SCHEDULES)) {
    if (dateStr >= fest.startDate && dateStr <= fest.endDate) {
      const adjusted = addBusinessDays(baseDeliveryDate, fest.bufferDays);
      return {
        adjustedDate: adjusted,
        isFestivalPeriod: true,
        festivalNameBn: fest.nameBn,
        bufferDaysAdded: fest.bufferDays,
        advisoryBn: fest.advisoryBn,
      };
    }
  }

  return {
    adjustedDate: baseDeliveryDate,
    isFestivalPeriod: false,
    bufferDaysAdded: 0,
  };
}

