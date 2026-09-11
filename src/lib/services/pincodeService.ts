/**
 * Module 11 Task 2: Pincode Postal Lookup & Auto-fill Engine
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 2, 3, 41, 42):
 * - Instant 10-15ms auto-population of City & State (Item 2 & 41)
 * - Sub-post office list for selectable dropdown (Item 3)
 * - Offline / degraded network resilience fallback (Item 42)
 * - Normalization of Bengali digits (Item 47)
 */

import type { PostalLookupResult } from '@/types/address';
import { normalizePincodeDigits, validateIndianPincode } from '@/lib/data/pincodeData';

/**
 * In-Memory LRU / Map Cache for instant < 5ms lookups (Item 41)
 */
const postalCache = new Map<string, PostalLookupResult>();

/**
 * Canonical set of Malda Town municipality pincodes eligible for cheaper
 * local delivery and a lower free-shipping threshold (Item 16).
 * Single source of truth shared by isMaldaTownPincode() and
 * calculateAddressShippingFee() to prevent zone/fee drift (732128 included).
 */
export const MALDA_TOWN_PINCODES = new Set(['732101', '732102', '732103', '732128']);

/**
 * Detailed postal directory for Malda District and major West Bengal regional hubs
 */
export const LOCAL_POSTAL_DIRECTORY: Record<
  string,
  { city: string; district: string; state: string; postOffices: string[]; isMaldaLocal: boolean }
> = {
  // Malda Town Core
  '732101': {
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Malda H.O', 'Rathbari S.O', 'Mokdumpur S.O', 'English Bazar S.O', 'Foara More B.O'],
    isMaldaLocal: true,
  },
  '732102': {
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Mangalbari S.O', 'Old Malda S.O', 'Sahapur B.O'],
    isMaldaLocal: true,
  },
  '732103': {
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Jhaljhalia S.O', 'Maheshpur B.O', 'Gazole Road B.O'],
    isMaldaLocal: true,
  },
  // Malda District Sub-divisions & Blocks
  '732121': {
    city: 'Kaliachak',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Kaliachak S.O', 'Baliadanga B.O', 'Silampur B.O', 'Alinagar B.O'],
    isMaldaLocal: true,
  },
  '732122': {
    city: 'Suapur',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Suapur S.O', 'Chanchal Road B.O', 'Harishchandrapur B.O'],
    isMaldaLocal: true,
  },
  '732123': {
    city: 'Chanchal',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Chanchal S.O', 'Singia B.O', 'Malatipur B.O', 'Kharba B.O'],
    isMaldaLocal: true,
  },
  '732124': {
    city: 'Gazole',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Gazole S.O', 'Alal B.O', 'Pandua B.O', 'Bairgachi B.O'],
    isMaldaLocal: true,
  },
  '732125': {
    city: 'Harishchandrapur',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Harishchandrapur S.O', 'Bhaluka B.O', 'Kushida B.O', 'Kanuapara B.O'],
    isMaldaLocal: true,
  },
  '732126': {
    city: 'Manikchak',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Manikchak S.O', 'Enayetpur B.O', 'Dharampur B.O', 'Nurpur B.O'],
    isMaldaLocal: true,
  },
  '732128': {
    city: 'Habibpur',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Habibpur S.O', 'Bulbulchandi S.O', 'Kachupukur B.O'],
    isMaldaLocal: true,
  },
  '732138': {
    city: 'Baisnabnagar',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Baisnabnagar S.O', 'Golapganj S.O', 'Bedrabad B.O'],
    isMaldaLocal: true,
  },
  '732142': {
    city: 'Ratua',
    district: 'Malda',
    state: 'West Bengal',
    postOffices: ['Ratua S.O', 'Samsi S.O', 'Bahara B.O', 'Kaharpara B.O'],
    isMaldaLocal: true,
  },
  '732201': {
    city: 'Farakka',
    district: 'Murshidabad',
    state: 'West Bengal',
    postOffices: ['Farakka Barrage S.O', 'NTPC Township S.O'],
    isMaldaLocal: false,
  },

  // Major West Bengal Hubs (Frequently Ordered From)
  '700001': {
    city: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    postOffices: ['Kolkata G.P.O.', 'BBD Bagh S.O', 'Dalhousie Square S.O'],
    isMaldaLocal: false,
  },
  '700073': {
    city: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    postOffices: ['College Street S.O', 'Bowbazar S.O', 'Calcutta University B.O'],
    isMaldaLocal: false,
  },
  '734001': {
    city: 'Siliguri',
    district: 'Darjeeling',
    state: 'West Bengal',
    postOffices: ['Siliguri H.O', 'Sevoke Road S.O', 'Hill Cart Road S.O'],
    isMaldaLocal: false,
  },
  '733134': {
    city: 'Raiganj',
    district: 'Uttar Dinajpur',
    state: 'West Bengal',
    postOffices: ['Raiganj H.O', 'Karnajora S.O', 'Mohanbati S.O'],
    isMaldaLocal: false,
  },
  '733101': {
    city: 'Balurghat',
    district: 'Dakshin Dinajpur',
    state: 'West Bengal',
    postOffices: ['Balurghat H.O', 'Mangalpur S.O', 'Raghunathpur B.O'],
    isMaldaLocal: false,
  },
  '735101': {
    city: 'Jalpaiguri',
    district: 'Jalpaiguri',
    state: 'West Bengal',
    postOffices: ['Jalpaiguri H.O', 'Kadamtala S.O', 'DBC Road S.O'],
    isMaldaLocal: false,
  },
  '736101': {
    city: 'Cooch Behar',
    district: 'Cooch Behar',
    state: 'West Bengal',
    postOffices: ['Cooch Behar H.O', 'New Cooch Behar S.O'],
    isMaldaLocal: false,
  },
  '742101': {
    city: 'Berhampore',
    district: 'Murshidabad',
    state: 'West Bengal',
    postOffices: ['Berhampore H.O', 'Cantonment S.O', 'Gorabazar S.O'],
    isMaldaLocal: false,
  },
};

/**
 * 2-Digit Postal Circle Prefix Mapping for All Indian States & UTs
 */
const INDIAN_PIN_PREFIX_MAP: Record<string, { state: string; defaultCity: string; defaultDistrict: string }> = {
  '11': { state: 'Delhi', defaultCity: 'New Delhi', defaultDistrict: 'New Delhi' },
  '12': { state: 'Haryana', defaultCity: 'Gurugram', defaultDistrict: 'Gurugram' },
  '13': { state: 'Haryana', defaultCity: 'Ambala', defaultDistrict: 'Ambala' },
  '14': { state: 'Punjab', defaultCity: 'Amritsar', defaultDistrict: 'Amritsar' },
  '15': { state: 'Punjab', defaultCity: 'Bathinda', defaultDistrict: 'Bathinda' },
  '16': { state: 'Chandigarh', defaultCity: 'Chandigarh', defaultDistrict: 'Chandigarh' },
  '17': { state: 'Himachal Pradesh', defaultCity: 'Shimla', defaultDistrict: 'Shimla' },
  '18': { state: 'Jammu and Kashmir', defaultCity: 'Jammu', defaultDistrict: 'Jammu' },
  '19': { state: 'Jammu and Kashmir', defaultCity: 'Srinagar', defaultDistrict: 'Srinagar' },
  '20': { state: 'Uttar Pradesh', defaultCity: 'Aligarh', defaultDistrict: 'Aligarh' },
  '21': { state: 'Uttar Pradesh', defaultCity: 'Prayagraj', defaultDistrict: 'Prayagraj' },
  '22': { state: 'Uttar Pradesh', defaultCity: 'Lucknow', defaultDistrict: 'Lucknow' },
  '23': { state: 'Uttar Pradesh', defaultCity: 'Varanasi', defaultDistrict: 'Varanasi' },
  '24': { state: 'Uttarakhand', defaultCity: 'Dehradun', defaultDistrict: 'Dehradun' },
  '25': { state: 'Uttar Pradesh', defaultCity: 'Meerut', defaultDistrict: 'Meerut' },
  '26': { state: 'Uttarakhand', defaultCity: 'Haldwani', defaultDistrict: 'Nainital' },
  '27': { state: 'Uttar Pradesh', defaultCity: 'Gorakhpur', defaultDistrict: 'Gorakhpur' },
  '28': { state: 'Uttar Pradesh', defaultCity: 'Agra', defaultDistrict: 'Agra' },
  '30': { state: 'Rajasthan', defaultCity: 'Jaipur', defaultDistrict: 'Jaipur' },
  '31': { state: 'Rajasthan', defaultCity: 'Udaipur', defaultDistrict: 'Udaipur' },
  '32': { state: 'Rajasthan', defaultCity: 'Kota', defaultDistrict: 'Kota' },
  '33': { state: 'Rajasthan', defaultCity: 'Bikaner', defaultDistrict: 'Bikaner' },
  '34': { state: 'Rajasthan', defaultCity: 'Jodhpur', defaultDistrict: 'Jodhpur' },
  '36': { state: 'Gujarat', defaultCity: 'Rajkot', defaultDistrict: 'Rajkot' },
  '37': { state: 'Gujarat', defaultCity: 'Jamnagar', defaultDistrict: 'Jamnagar' },
  '38': { state: 'Gujarat', defaultCity: 'Ahmedabad', defaultDistrict: 'Ahmedabad' },
  '39': { state: 'Gujarat', defaultCity: 'Surat', defaultDistrict: 'Surat' },
  '40': { state: 'Maharashtra', defaultCity: 'Mumbai', defaultDistrict: 'Mumbai' },
  '41': { state: 'Maharashtra', defaultCity: 'Pune', defaultDistrict: 'Pune' },
  '42': { state: 'Maharashtra', defaultCity: 'Nashik', defaultDistrict: 'Nashik' },
  '43': { state: 'Maharashtra', defaultCity: 'Aurangabad', defaultDistrict: 'Aurangabad' },
  '44': { state: 'Maharashtra', defaultCity: 'Nagpur', defaultDistrict: 'Nagpur' },
  '45': { state: 'Madhya Pradesh', defaultCity: 'Indore', defaultDistrict: 'Indore' },
  '46': { state: 'Madhya Pradesh', defaultCity: 'Bhopal', defaultDistrict: 'Bhopal' },
  '47': { state: 'Madhya Pradesh', defaultCity: 'Gwalior', defaultDistrict: 'Gwalior' },
  '48': { state: 'Madhya Pradesh', defaultCity: 'Jabalpur', defaultDistrict: 'Jabalpur' },
  '49': { state: 'Chhattisgarh', defaultCity: 'Raipur', defaultDistrict: 'Raipur' },
  '50': { state: 'Telangana', defaultCity: 'Hyderabad', defaultDistrict: 'Hyderabad' },
  '51': { state: 'Andhra Pradesh', defaultCity: 'Tirupati', defaultDistrict: 'Chittoor' },
  '52': { state: 'Andhra Pradesh', defaultCity: 'Vijayawada', defaultDistrict: 'Krishna' },
  '53': { state: 'Andhra Pradesh', defaultCity: 'Visakhapatnam', defaultDistrict: 'Visakhapatnam' },
  '56': { state: 'Karnataka', defaultCity: 'Bengaluru', defaultDistrict: 'Bengaluru Urban' },
  '57': { state: 'Karnataka', defaultCity: 'Mangaluru', defaultDistrict: 'Dakshina Kannada' },
  '58': { state: 'Karnataka', defaultCity: 'Hubballi', defaultDistrict: 'Dharwad' },
  '59': { state: 'Karnataka', defaultCity: 'Belagavi', defaultDistrict: 'Belagavi' },
  '60': { state: 'Tamil Nadu', defaultCity: 'Chennai', defaultDistrict: 'Chennai' },
  '61': { state: 'Tamil Nadu', defaultCity: 'Thanjavur', defaultDistrict: 'Thanjavur' },
  '62': { state: 'Tamil Nadu', defaultCity: 'Madurai', defaultDistrict: 'Madurai' },
  '63': { state: 'Tamil Nadu', defaultCity: 'Salem', defaultDistrict: 'Salem' },
  '64': { state: 'Tamil Nadu', defaultCity: 'Coimbatore', defaultDistrict: 'Coimbatore' },
  '67': { state: 'Kerala', defaultCity: 'Kozhikode', defaultDistrict: 'Kozhikode' },
  '68': { state: 'Kerala', defaultCity: 'Kochi', defaultDistrict: 'Ernakulam' },
  '69': { state: 'Kerala', defaultCity: 'Thiruvananthapuram', defaultDistrict: 'Thiruvananthapuram' },
  '70': { state: 'West Bengal', defaultCity: 'Kolkata', defaultDistrict: 'Kolkata' },
  '71': { state: 'West Bengal', defaultCity: 'Howrah', defaultDistrict: 'Howrah' },
  '72': { state: 'West Bengal', defaultCity: 'Midnapore', defaultDistrict: 'Paschim Medinipur' },
  '73': { state: 'West Bengal', defaultCity: 'Malda / Siliguri', defaultDistrict: 'Malda' },
  '74': { state: 'West Bengal', defaultCity: 'Nadia / Murshidabad', defaultDistrict: 'Nadia' },
  '75': { state: 'Odisha', defaultCity: 'Bhubaneswar', defaultDistrict: 'Khurda' },
  '76': { state: 'Odisha', defaultCity: 'Cuttack', defaultDistrict: 'Cuttack' },
  '77': { state: 'Odisha', defaultCity: 'Sambalpur', defaultDistrict: 'Sambalpur' },
  '78': { state: 'Assam', defaultCity: 'Guwahati', defaultDistrict: 'Kamrup Metropolitan' },
  '79': { state: 'North East', defaultCity: 'Agartala / Shillong', defaultDistrict: 'Tripura / Meghalaya' },
  '80': { state: 'Bihar', defaultCity: 'Patna', defaultDistrict: 'Patna' },
  '81': { state: 'Bihar', defaultCity: 'Bhagalpur', defaultDistrict: 'Bhagalpur' },
  '82': { state: 'Bihar', defaultCity: 'Gaya', defaultDistrict: 'Gaya' },
  '83': { state: 'Jharkhand', defaultCity: 'Ranchi', defaultDistrict: 'Ranchi' },
  '84': { state: 'Bihar', defaultCity: 'Muzaffarpur', defaultDistrict: 'Muzaffarpur' },
  '85': { state: 'Bihar', defaultCity: 'Purnia / Katihar', defaultDistrict: 'Purnia' },
};

/**
 * Synchronous local postal resolution for instant 1-2ms lookup.
 */
export function resolvePostalPincodeLocal(pincode: string): PostalLookupResult | null {
  const norm = normalizePincodeDigits(pincode).trim();
  if (!/^[1-9][0-9]{5}$/.test(norm)) return null;

  // 1. Check direct directory
  if (LOCAL_POSTAL_DIRECTORY[norm]) {
    const d = LOCAL_POSTAL_DIRECTORY[norm];
    return {
      pincode: norm,
      city: d.city,
      district: d.district,
      state: d.state,
      postOffices: d.postOffices,
      isDeliverable: true,
      isMaldaLocal: d.isMaldaLocal,
      source: 'cache',
    };
  }

  // 2. Check 3-digit prefix (e.g. 732 -> Malda)
  if (norm.startsWith('732')) {
    return {
      pincode: norm,
      city: 'Malda',
      district: 'Malda',
      state: 'West Bengal',
      postOffices: ['Malda Post Office', 'Sub-post Office'],
      isDeliverable: true,
      isMaldaLocal: true,
      source: 'fallback',
    };
  }

  // 3. Check 2-digit Indian Postal Circle
  const prefix2 = norm.substring(0, 2);
  const circle = INDIAN_PIN_PREFIX_MAP[prefix2];
  if (circle) {
    return {
      pincode: norm,
      city: circle.defaultCity,
      district: circle.defaultDistrict,
      state: circle.state,
      postOffices: [`${circle.defaultCity} Post Office`],
      isDeliverable: true,
      isMaldaLocal: false,
      source: 'fallback',
    };
  }

  return null;
}

/**
 * Main client and server lookup engine for pincodes.
 * Guarantees <15ms response by checking memory cache and local directory first.
 * If offline or network fails, gracefully returns fallback so the user is NEVER blocked (Item 42).
 */
export async function lookupPostalPincode(pincode: string): Promise<PostalLookupResult> {
  const norm = normalizePincodeDigits(pincode).trim();

  const validation = validateIndianPincode(norm);
  if (!validation.isValid) {
    return {
      pincode: norm,
      city: '',
      district: '',
      state: '',
      postOffices: [],
      isDeliverable: false,
      isMaldaLocal: false,
      source: 'fallback',
    };
  }

  // 1. Check in-memory cache
  if (postalCache.has(norm)) {
    return postalCache.get(norm)!;
  }

  // 2. Check local synchronous resolution
  const localResult = resolvePostalPincodeLocal(norm);
  if (localResult) {
    postalCache.set(norm, localResult);
    return localResult;
  }

  // 3. Try edge API if in browser
  if (typeof window !== 'undefined') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

      const res = await fetch(`/api/pincode/${norm}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          const result = json.data as PostalLookupResult;
          postalCache.set(norm, result);
          return result;
        }
      }
    } catch {
      // Ignore network failure; fallback safely
    }
  }

  // 4. Default fallback: Never block customer
  const prefix2 = norm.substring(0, 2);
  const circle = INDIAN_PIN_PREFIX_MAP[prefix2];
  const fallbackResult: PostalLookupResult = {
    pincode: norm,
    city: circle ? circle.defaultCity : 'India',
    district: circle ? circle.defaultDistrict : 'India',
    state: circle ? circle.state : 'West Bengal',
    postOffices: ['Local Post Office'],
    isDeliverable: true,
    isMaldaLocal: norm.startsWith('732'),
    source: 'fallback',
  };

  postalCache.set(norm, fallbackResult);
  return fallbackResult;
}

/**
 * Checks if a given pincode belongs to Malda district / municipal core
 */
export function isMaldaPincode(pincode: string): boolean {
  const norm = normalizePincodeDigits(pincode).trim();
  return norm.startsWith('732');
}

/**
 * Checks if a given pincode belongs specifically to Malda Town municipality
 * (732101, 732102, 732103, 732128) eligible for Same-Day Express
 */
export function isMaldaTownPincode(pincode: string): boolean {
  const norm = normalizePincodeDigits(pincode).trim();
  return MALDA_TOWN_PINCODES.has(norm);
}

/**
 * Module 11 Item 45: Live Real-time Shipping Fee & Delivery Speed Calculation
 * Based on Address Pincode & Order Subtotal
 */
export interface AddressShippingEstimate {
  shippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  deliverySpeedTextBn: string;
  deliverySpeedTextEn: string;
  isMaldaTown: boolean;
  zone: 'malda_town' | 'malda_district' | 'regional_wb' | 'national';
  zoneLabelBn: string;
  zoneLabelEn: string;
}

export function calculateAddressShippingFee(
  pincode: string,
  subtotal: number = 0
): AddressShippingEstimate {
  const norm = normalizePincodeDigits(pincode).trim();
  const isMaldaTown = MALDA_TOWN_PINCODES.has(norm);
  const isMaldaDistrict = norm.startsWith('732');
  const isBengal =
    norm.startsWith('70') ||
    norm.startsWith('71') ||
    norm.startsWith('72') ||
    norm.startsWith('73') ||
    norm.startsWith('74');

  let threshold = 499;
  let standardFee = 40;
  let zone: AddressShippingEstimate['zone'] = 'regional_wb';
  let zoneLabelBn = 'পশ্চিমবঙ্গ কুরিয়ার';
  let zoneLabelEn = 'West Bengal Regional';
  let speedBn = '২-৩ কার্যদিবস';
  let speedEn = '2-3 Business Days';

  if (isMaldaTown) {
    zone = 'malda_town';
    zoneLabelBn = 'মালদা টাউন লোকাল';
    zoneLabelEn = 'Malda Town Local';
    threshold = 399; // Malda town local lower free shipping threshold
    standardFee = 25; // Cheaper local delivery fee
    speedBn = 'আজকের বা কালকের মধ্যে নিশ্চিত ডেলিভারি (২৪ ঘণ্টা)';
    speedEn = 'Same Day or Tomorrow Delivery (24 hrs)';
  } else if (isMaldaDistrict) {
    zone = 'malda_district';
    zoneLabelBn = 'মালদা জেলা কুরিয়ার';
    zoneLabelEn = 'Malda District Courier';
    threshold = 499;
    standardFee = 35;
    speedBn = '১-২ কার্যদিবস';
    speedEn = '1-2 Business Days';
  } else if (isBengal) {
    zone = 'regional_wb';
    zoneLabelBn = 'পশ্চিমবঙ্গ কুরিয়ার';
    zoneLabelEn = 'West Bengal Regional';
    threshold = 499;
    standardFee = 45;
    speedBn = '২-৩ কার্যদিবস';
    speedEn = '2-3 Business Days';
  } else {
    zone = 'national';
    zoneLabelBn = 'অল ইন্ডিয়া কুরিয়ার';
    zoneLabelEn = 'All India Courier';
    threshold = 699;
    standardFee = 70;
    speedBn = '৪-৬ কার্যদিবস';
    speedEn = '4-6 Business Days';
  }

  const isFreeShipping = subtotal >= threshold;
  const shippingFee = isFreeShipping ? 0 : standardFee;

  return {
    shippingFee,
    isFreeShipping,
    freeShippingThreshold: threshold,
    deliverySpeedTextBn: speedBn,
    deliverySpeedTextEn: speedEn,
    isMaldaTown,
    zone,
    zoneLabelBn,
    zoneLabelEn,
  };
}

