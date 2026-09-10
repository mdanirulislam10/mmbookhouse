/**
 * Module 8: Cart & Checkout Shipping Synchronization Service
 * M.M Book House Malda - Unified Logistics Engine
 * 
 * Implements Task 47:
 * - Automatically synchronizes shipping fees, courier charges, COD fees,
 *   and free shipping eligibility between PDP pincode lookups, MiniCart,
 *   Cart page, and Checkout screens.
 * - Respects Malda Town zero-COD handling fee and 2-Hour Super-Express add-on.
 */

import { DeliveryZone, DeliverySpeedOption, FulfillmentMode } from '@/types/delivery';
import {
  lookupPincodeServiceability,
  DEFAULT_PINCODE,
  isMaldaTownPincode,
} from '@/lib/data/pincodeData';
import { determineDeliveryZone } from '@/lib/services/slaEngine';

export const FREE_SHIPPING_THRESHOLD = 499;
export const MALDA_SUPER_EXPRESS_FEE = 30;

export interface CartShippingCalculationInput {
  subtotal: number;
  pincode?: string;
  speedOption?: DeliverySpeedOption;
  fulfillmentMode?: FulfillmentMode | 'delivery' | 'pickup';
}

export interface CartShippingCalculationResult {
  pincode: string;
  zone: DeliveryZone;
  district: string;
  isMaldaTown: boolean;
  fulfillmentMode: FulfillmentMode;
  speedOption: DeliverySpeedOption;
  baseShippingFee: number;
  expressAddonFee: number;
  totalShippingFee: number;
  isFreeShipping: boolean;
  amountNeededForFreeShipping: number;
  freeShippingProgressPercent: number;
  codAvailable: boolean;
  codHandlingFee: number;
  grandTotal: number;
  shippingLabelBn: string;
  shippingLabelEn: string;
  deliveryPromiseBn: string;
  deliveryPromiseEn: string;
}

/**
 * Calculates unified cart shipping rates based on active location and order subtotal
 */
export function calculateCartShipping({
  subtotal,
  pincode = DEFAULT_PINCODE,
  speedOption = 'standard',
  fulfillmentMode = 'home_delivery',
}: CartShippingCalculationInput): CartShippingCalculationResult {
  const normalizedPincode = (pincode || DEFAULT_PINCODE).trim();
  const serviceInfo = lookupPincodeServiceability(normalizedPincode);
  const zoneInfo = determineDeliveryZone(normalizedPincode);
  const isMalda = isMaldaTownPincode(normalizedPincode);
  const isStorePickup = fulfillmentMode === 'store_pickup' || fulfillmentMode === 'pickup';

  // Store Pickup (BOPIS) is always 100% Free Shipping
  if (isStorePickup) {
    return {
      pincode: normalizedPincode,
      zone: zoneInfo.zone,
      district: zoneInfo.district,
      isMaldaTown: isMalda,
      fulfillmentMode: 'store_pickup',
      speedOption: 'standard',
      baseShippingFee: 0,
      expressAddonFee: 0,
      totalShippingFee: 0,
      isFreeShipping: true,
      amountNeededForFreeShipping: 0,
      freeShippingProgressPercent: 100,
      codAvailable: true,
      codHandlingFee: 0,
      grandTotal: subtotal,
      shippingLabelBn: 'বিনামূল্যে স্টোর পিকআপ (₹০)',
      shippingLabelEn: 'FREE Store Pickup (₹0)',
      deliveryPromiseBn: 'আজই নেতাজি সুভাষ রোড কাউন্টার থেকে সরাসরি সংগ্রহ করুন',
      deliveryPromiseEn: 'Collect directly today from Netaji Subhash Road Counter',
    };
  }

  // Check Free Shipping qualification (Orders >= ₹499)
  const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  // Determine base shipping fee if subtotal < 499
  let baseFee = 0;
  if (!isFree) {
    switch (zoneInfo.zone) {
      case 'local_malda':
        baseFee = isMalda ? 30 : 40;
        break;
      case 'regional_north_bengal':
        baseFee = 40;
        break;
      case 'south_bengal':
        baseFee = 50;
        break;
      case 'national':
      default:
        baseFee = 60;
        break;
    }
  }

  // 2-Hour Super-Express add-on (Available exclusively in Malda Town)
  const isExpressActive = speedOption === 'malda_2hr_express' && isMalda;
  const expressFee = isExpressActive ? MALDA_SUPER_EXPRESS_FEE : 0;

  const totalShippingFee = baseFee + expressFee;
  const codFee = isMalda ? 0 : 30;
  const grandTotal = subtotal + totalShippingFee;

  let shippingLabelBn = isFree ? 'বিনামূল্যে ডেলিভারি (FREE)' : `স্ট্যান্ডার্ড ডেলিভারি: ₹${baseFee}`;
  let shippingLabelEn = isFree ? 'FREE Delivery' : `Standard Delivery: ₹${baseFee}`;

  if (isExpressActive) {
    shippingLabelBn += ` + ২-ঘণ্টা এক্সপ্রেস (₹${expressFee})`;
    shippingLabelEn += ` + 2-Hour Express (₹${expressFee})`;
  }

  return {
    pincode: normalizedPincode,
    zone: zoneInfo.zone,
    district: zoneInfo.district,
    isMaldaTown: isMalda,
    fulfillmentMode: 'home_delivery',
    speedOption,
    baseShippingFee: baseFee,
    expressAddonFee: expressFee,
    totalShippingFee,
    isFreeShipping: isFree,
    amountNeededForFreeShipping: amountNeeded,
    freeShippingProgressPercent: progressPercent,
    codAvailable: serviceInfo.isCodAvailable,
    codHandlingFee: codFee,
    grandTotal,
    shippingLabelBn,
    shippingLabelEn,
    deliveryPromiseBn: serviceInfo.deliveryDateTextBn,
    deliveryPromiseEn: serviceInfo.deliveryDateTextEn,
  };
}
