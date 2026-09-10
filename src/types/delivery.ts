/**
 * Module 8: Pincode & Core Geo-Serviceability Types
 * M.M Book House Malda - E-Commerce Platform
 */

export type DeliveryZone =
  | 'local_malda'
  | 'regional_north_bengal'
  | 'south_bengal'
  | 'national';

export interface PincodeServiceabilityRecord {
  id?: string;
  pincode: string;
  post_office: string;
  district: string;
  state: string;
  delivery_zone: DeliveryZone;
  estimated_delivery_days: number;
  is_cod_available: boolean;
  cod_handling_fee: number;
  is_express_available: boolean;
  min_order_free_shipping: number;
  created_at?: string;
  updated_at?: string;
}

export interface PincodeServiceability {
  pincode: string;
  postOffice: string;
  district: string;
  state: string;
  deliveryZone: DeliveryZone;
  estimatedDeliveryDays: number;
  isCodAvailable: boolean;
  codHandlingFee: number;
  isExpressAvailable: boolean;
  minOrderFreeShipping: number;
  deliveryPromiseBn: string;
  deliveryPromiseEn: string;
}

export interface PincodeLookupResult {
  pincode: string;
  postOffice: string;
  area: string;
  district: string;
  state: string;
  deliveryZone: DeliveryZone;
  estimatedDeliveryDays: number;
  isDeliverable: boolean;
  isCodAvailable: boolean;
  codHandlingFee: number;
  isExpressAvailable: boolean;
  minOrderFreeShipping: number;
  deliveryDateTextBn: string;
  deliveryDateTextEn: string;
  deliveryTagBn: string;
  deliveryTagEn: string;
  isFallback: boolean;
  source: 'exact_db' | 'prefix_rule' | 'offline_fallback';
  formattedExpectedDate?: string;
}

export interface DeliveryCookieOptions {
  name: string;
  days?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
}

/**
 * Module 8 (Part 3: Tasks 21 - 30) Types
 */
export type FulfillmentMode = 'home_delivery' | 'store_pickup' | 'delivery' | 'pickup';

export interface PickupStoreInfo {
  storeName: string;
  storeNameBn: string;
  storeAddress: string;
  storeAddressBn: string;
  landmarkBn: string;
  landmarkEn: string;
  phone: string;
  openHoursBn: string;
  openHoursEn: string;
  readyEstimateBn: string;
  readyEstimateEn: string;
  mapUrl: string;
}

export interface DisruptionNotice {
  id: string;
  active: boolean;
  severity: 'info' | 'warning' | 'alert';
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  affectedZones?: DeliveryZone[] | 'all';
  expectedDelayHours?: number;
}

export interface ReturnPolicyDetails {
  days: number;
  freeReplacement: boolean;
  doorstepPickup: boolean;
  storeExchange: boolean;
  guaranteeTextBn: string;
  guaranteeTextEn: string;
}

/**
 * Module 8 (Part 2: Tasks 11 - 20) Types
 * SLA Engine, Holiday Calendar, Cut-off Timer, Courier & Super-Express Delivery
 */
export type DeliverySpeedOption = 'standard' | 'malda_2hr_express';

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  nameEn: string;
  nameBn: string;
  isNational: boolean;
}

export interface SlaCalculationResult {
  pincode: string;
  zone: DeliveryZone;
  estimatedDays: number;
  deliveryDate: Date;
  formattedDateBn: string; // e.g. "বুধবার, ১২ মার্চ"
  formattedDateEn: string; // e.g. "Wednesday, 12 March"
  fullPromiseBn: string; // e.g. "ডেলিভারি হবে বুধবার, ১২ মার্চ-এর মধ্যে"
  fullPromiseEn: string; // e.g. "Delivery by Wednesday, 12 March"
  slaBadgeBn: string;
  slaBadgeEn: string;
  isMaldaTown: boolean;
  isSameDayEligible: boolean;
  isTomorrow: boolean;
  cutoffHour: number;
  cutoffMinute: number;
  isCutoffPassed: boolean;
  cutoffRemainingMs: number;
  isExpressOptionAvailable: boolean; // Malda 2-hr super express
  expressFee: number; // ₹30
  carrierRecommended: 'MM Local Rider' | 'Delhivery' | 'Shiprocket' | 'India Post';
}

export interface CourierServiceabilityDetails {
  pincode: string;
  isServiceable: boolean;
  partnerName: 'Delhivery' | 'Shiprocket' | 'India Post' | 'MM Local Rider';
  partnerNameBn: string;
  serviceType: 'Hyperlocal Express' | 'Surface' | 'Air Speed';
  serviceTypeBn: string;
  estimatedDeliveryDays: number;
  deliveryDateBn: string;
  deliveryDateEn: string;
  baseShippingCharge: number;
  isFreeDelivery: boolean;
  isCodAvailable: boolean;
  codFee: number;
  trackingSupported: boolean;
  slaBadgeBn: string;
  slaBadgeEn: string;
  source: 'live_courier_api' | 'fallback_engine';
}

/**
 * Module 8 (Part 5: Tasks 48 & 49) Admin Shipping Config & Festival Scheduler Types
 */
export interface ShippingZoneConfig {
  id: string;
  zoneKey: DeliveryZone;
  nameEn: string;
  nameBn: string;
  pincodePrefixes: string[];
  standardShippingFee: number;
  minOrderFreeShipping: number;
  expressAvailable: boolean;
  expressFee: number;
  codAvailable: boolean;
  codHandlingFee: number;
  estimatedDeliveryDays: number;
  active: boolean;
  descriptionBn?: string;
  descriptionEn?: string;
}

export interface FestivalEvent {
  id: string;
  nameEn: string;
  nameBn: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  bufferDays: number;
  advisoryBn: string;
  advisoryEn: string;
}

export interface FestivalScheduleInfo {
  isFestivalPeriod: boolean;
  festivalName?: string;
  festivalNameBn?: string;
  festivalNameEn?: string;
  bufferDays: number;
  noticeBn?: string;
  noticeEn?: string;
  adjustedDeliveryDate: Date;
  originalDeliveryDate: Date;
}


