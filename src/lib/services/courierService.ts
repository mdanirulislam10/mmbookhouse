/**
 * Module 8: Courier Serviceability API & Fallback Service (Task 18)
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Provides live serviceability checking with Delhivery and Shiprocket APIs
 * with an instant (<10ms) resilient offline fallback engine.
 */

import { CourierServiceabilityDetails } from '@/types/delivery';
import { calculateSLA, isMaldaTownPincode } from './slaEngine';
import { normalizePincodeDigits, validateIndianPincode } from '../data/pincodeData';

export interface CourierServiceabilityQuery {
  pincode: string;
  weightGrams?: number;
  orderValue?: number;
  isCod?: boolean;
  isExpressRequested?: boolean;
}

const DEFAULT_MIN_ORDER_FREE_SHIPPING = 499;
const DEFAULT_STANDARD_SHIPPING_FEE = 40;

/**
 * Real-world Shiprocket Serviceability API Check
 */
async function checkShiprocketLive(
  pincode: string,
  weightKg: number = 0.5,
  isCod: boolean = false
): Promise<Partial<CourierServiceabilityDetails> | null> {
  const token = process.env.SHIPROCKET_API_TOKEN;
  if (!token) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800); // 800ms SLA timeout

    const pickupPostcode = '732101'; // Malda Town Store Postcode
    const codVal = isCod ? '1' : '0';
    const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${pincode}&weight=${weightKg}&cod=${codVal}`;

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const recommended = json?.data?.available_courier_companies?.[0];
      if (recommended) {
        return {
          partnerName: 'Shiprocket',
          partnerNameBn: 'শিপরকেট এক্সপ্রেস',
          serviceType: 'Surface',
          serviceTypeBn: 'এক্সপ্রেস সারফেস',
          estimatedDeliveryDays: recommended.estimated_delivery_days || 3,
          trackingSupported: true,
          source: 'live_courier_api',
        };
      }
    }
  } catch {
    // Gracefully ignore and fallback
  }

  return null;
}

/**
 * Real-world Delhivery Serviceability API Check
 */
async function checkDelhiveryLive(
  pincode: string
): Promise<Partial<CourierServiceabilityDetails> | null> {
  const token = process.env.DELHIVERY_API_KEY;
  if (!token) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);

    const url = `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const pinData = json?.delivery_codes?.[0]?.postal_code;
      if (pinData) {
        return {
          partnerName: 'Delhivery',
          partnerNameBn: 'দিল্লিভেরি এক্সপ্রেস',
          serviceType: 'Surface',
          serviceTypeBn: 'সারফেস স্পিড',
          estimatedDeliveryDays: 2,
          isCodAvailable: pinData.cod === 'Y',
          trackingSupported: true,
          source: 'live_courier_api',
        };
      }
    }
  } catch {
    // Gracefully ignore and fallback
  }

  return null;
}

/**
 * Master Courier Serviceability Function
 * Attempts live carrier check if available; instantly falls back to SLA Engine (<10ms).
 */
export async function checkCourierServiceability(
  query: CourierServiceabilityQuery
): Promise<CourierServiceabilityDetails> {
  const rawPincode = query.pincode;
  const validation = validateIndianPincode(rawPincode);
  const pincode = validation.isValid ? validation.normalizedPincode : '732101';
  const orderValue = query.orderValue ?? 0;
  const isFreeDelivery = orderValue >= DEFAULT_MIN_ORDER_FREE_SHIPPING;
  const isMaldaTown = isMaldaTownPincode(pincode);

  // 1. If Malda Municipality and 2-Hour Express Requested -> Direct M.M Local Dedicated Courier
  if (isMaldaTown && query.isExpressRequested) {
    const sla = calculateSLA(pincode, { isSuperExpressSelected: true });
    return {
      pincode,
      isServiceable: true,
      partnerName: 'MM Local Rider',
      partnerNameBn: 'এম.এম লোকাল এক্সপ্রেস রাইডার',
      serviceType: 'Hyperlocal Express',
      serviceTypeBn: '২ ঘণ্টার সুপার-এক্সপ্রেস',
      estimatedDeliveryDays: 0,
      deliveryDateBn: sla.formattedDateBn,
      deliveryDateEn: sla.formattedDateEn,
      baseShippingCharge: isFreeDelivery ? 30 : 30 + DEFAULT_STANDARD_SHIPPING_FEE,
      isFreeDelivery: false,
      isCodAvailable: true,
      codFee: 0,
      trackingSupported: true,
      slaBadgeBn: '⚡ ২ ঘণ্টার মধ্যে সুপার-এক্সপ্রেস ডেলিভারি',
      slaBadgeEn: '⚡ Super-Express 2-Hour Delivery',
      source: 'fallback_engine',
    };
  }

  // 2. If Malda Town Standard -> M.M In-House Local Delivery
  if (isMaldaTown) {
    const sla = calculateSLA(pincode);
    return {
      pincode,
      isServiceable: true,
      partnerName: 'MM Local Rider',
      partnerNameBn: 'এম.এম হোম ডেলিভারি টিম',
      serviceType: 'Hyperlocal Express',
      serviceTypeBn: 'লোকাল দ্রুত ডেলিভারি',
      estimatedDeliveryDays: sla.estimatedDays,
      deliveryDateBn: sla.formattedDateBn,
      deliveryDateEn: sla.formattedDateEn,
      baseShippingCharge: isFreeDelivery ? 0 : DEFAULT_STANDARD_SHIPPING_FEE,
      isFreeDelivery,
      isCodAvailable: true,
      codFee: 0,
      trackingSupported: true,
      slaBadgeBn: sla.slaBadgeBn,
      slaBadgeEn: sla.slaBadgeEn,
      source: 'fallback_engine',
    };
  }

  // 3. For Out-of-Malda Pincodes: Try Live Delhivery / Shiprocket if configured
  let liveResult: Partial<CourierServiceabilityDetails> | null = null;
  if (process.env.DELHIVERY_API_KEY) {
    liveResult = await checkDelhiveryLive(pincode);
  }
  if (!liveResult && process.env.SHIPROCKET_API_TOKEN) {
    liveResult = await checkShiprocketLive(
      pincode,
      (query.weightGrams ?? 500) / 1000,
      query.isCod ?? false
    );
  }

  // 4. SLA Fallback Engine (High speed guaranteed <10ms)
  const sla = calculateSLA(pincode);
  const basePartner = liveResult?.partnerName || sla.carrierRecommended;
  const partnerNameBn =
    basePartner === 'Delhivery'
      ? 'দিল্লিভেরি এক্সপ্রেস'
      : basePartner === 'Shiprocket'
      ? 'শিপরকেট কুরিয়ার'
      : basePartner === 'India Post'
      ? 'ইন্ডিয়া পোস্ট স্পিড পোস্ট'
      : 'এম.এম ডেলিভারি রাইডার';

  const serviceType =
    sla.zone === 'national' ? 'Air Speed' : 'Surface';
  const serviceTypeBn =
    sla.zone === 'national' ? 'অল-ইন্ডিয়া এয়ার স্পিড' : 'এক্সপ্রেস সারফেস';

  return {
    pincode,
    isServiceable: true,
    partnerName: basePartner,
    partnerNameBn,
    serviceType,
    serviceTypeBn,
    estimatedDeliveryDays: liveResult?.estimatedDeliveryDays ?? sla.estimatedDays,
    deliveryDateBn: sla.formattedDateBn,
    deliveryDateEn: sla.formattedDateEn,
    baseShippingCharge: isFreeDelivery ? 0 : DEFAULT_STANDARD_SHIPPING_FEE,
    isFreeDelivery,
    isCodAvailable: liveResult?.isCodAvailable ?? true,
    codFee: 0,
    trackingSupported: true,
    slaBadgeBn: sla.slaBadgeBn,
    slaBadgeEn: sla.slaBadgeEn,
    source: liveResult?.source ?? 'fallback_engine',
  };
}
