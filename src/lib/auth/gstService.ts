'use client';

export const INDIAN_GST_STATE_CODES: Record<string, string> = {
  '19': 'পশ্চিমবঙ্গ (West Bengal)',
  '10': 'বিহার (Bihar)',
  '20': 'ঝাড়খণ্ড (Jharkhand)',
  '21': 'ওড়িশা (Odisha)',
  '18': 'আসাম (Assam)',
  '16': 'ত্রিপুরা (Tripura)',
  '07': 'দিল্লি (Delhi)',
  '27': 'মহারাষ্ট্র (Maharashtra)',
  '09': 'উত্তর প্রদেশ (Uttar Pradesh)',
  '06': 'হরিয়ানা (Haryana)',
  '29': 'কর্ণাটক (Karnataka)',
  '33': 'তামিলনাড়ু (Tamil Nadu)',
  '32': 'কেরালা (Kerala)',
};

export interface GstValidationResult {
  isValid: boolean;
  cleanGstin: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  error?: string;
}

/**
 * Task 33: Business GSTIN & Institution Profile Validation Engine
 * Ensures valid 15-character Indian GST format for B2B Input Tax Credit (ITC).
 */
export const gstService = {
  /**
   * Validate Indian 15-digit GSTIN
   * Format: 2 digits (State) + 10 chars (PAN) + 1 char (Entity) + 'Z' + 1 char (Checksum)
   */
  validateGstin(rawGstin: string): GstValidationResult {
    const clean = rawGstin.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!clean) {
      return { isValid: false, cleanGstin: '', error: 'জিএসটিআইএন (GSTIN) নম্বর প্রদান আবশ্যক।' };
    }

    if (clean.length !== 15) {
      return {
        isValid: false,
        cleanGstin: clean,
        error: `জিএসটি নম্বরটি ১৫ অক্ষরের হতে হবে (বর্তমানে ${clean.length} অক্ষর রয়েছে)।`,
      };
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(clean)) {
      return {
        isValid: false,
        cleanGstin: clean,
        error: 'ভুল জিএসটি ফরম্যাট! সঠিক ভারতীয় ১৫-ডিজিটের GSTIN লিখুন (যেমন: 19ABCDE1234F1Z5)।',
      };
    }

    const stateCode = clean.slice(0, 2);
    const pan = clean.slice(2, 12);
    const stateName = INDIAN_GST_STATE_CODES[stateCode] || `অন্যান্য রাজ্য (কোড: ${stateCode})`;

    return {
      isValid: true,
      cleanGstin: clean,
      stateCode,
      stateName,
      pan,
    };
  },

  /**
   * Format GSTIN with spaces for readability:
   * e.g. "19ABCDE1234F1Z5" -> "19 ABCDE1234F 1 Z 5"
   */
  formatGstin(gstin: string): string {
    const clean = gstin.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 15) return clean;
    return `${clean.slice(0, 2)} ${clean.slice(2, 12)} ${clean.slice(12, 13)} ${clean.slice(13, 14)} ${clean.slice(14, 15)}`;
  },
};
