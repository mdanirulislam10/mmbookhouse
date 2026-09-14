/**
 * Module 16: Dynamic SLA, EDD & Delivery/Pickup OTP Engine
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 6: Dynamic Estimated Delivery Date (EDD) computation based on pincode & milestones
 * - Item 7: Dynamic SLA delay recalculation with transparent customer reason
 * - Item 8: 4-digit Delivery Handover OTP security display
 * - Item 19: "Arriving Today" high-priority indicator & pulsating status badge
 * - Item 40: Netaji Subhash Road store pickup counter verification & QR details
 */

import { OrderStatus } from '@/types/tracking';
import { calculateSLA, getIndiaStandardTime } from '@/lib/services/slaEngine';
import { toBengaliNumerals } from '@/lib/services/holidayCalendar';

export interface LiveEddResult {
  eddDate: Date;
  eddIso: string;
  displayEn: string;
  displayBn: string;
  isDelayed: boolean;
  delayReasonEn?: string;
  delayReasonBn?: string;
  isArrivingToday: boolean;
  isDelivered: boolean;
  deliveryTimeSlot: string;
}

export interface ArrivingTodayStatus {
  isArrivingToday: boolean;
  badgeLabelBn: string;
  badgeLabelEn: string;
  deliverySlotEn: string;
  deliverySlotBn: string;
}

export interface DeliveryOtpDisplay {
  shouldShowOtp: boolean;
  otpCode: string;
  maskedPhone?: string;
  securityNoticeEn: string;
  securityNoticeBn: string;
}

export interface StorePickupDetails {
  storeNameBn: string;
  storeNameEn: string;
  storeAddressBn: string;
  storeAddressEn: string;
  operatingHoursBn: string;
  operatingHoursEn: string;
  counterOtp: string;
  qrPayload: string;
  mapCoordinates: { lat: number; lng: number };
  directionsUrl: string;
}

/**
 * Calculates dynamic live Estimated Delivery Date (EDD) taking into account
 * status exceptions, delays, and current transit milestones (Items 6 & 7).
 */
export function calculateLiveEdd(params: {
  destinationPincode: string;
  status: OrderStatus;
  orderCreatedAt?: Date | string;
  dispatchDate?: Date | string;
  delayDaysCount?: number;
  isStorePickup?: boolean;
}): LiveEddResult {
  const {
    destinationPincode,
    status,
    orderCreatedAt = new Date(),
    delayDaysCount = 0,
    isStorePickup = false,
  } = params;

  const nowIst = getIndiaStandardTime();
  const createdDate = new Date(orderCreatedAt);

  // If already delivered, EDD is fixed to delivered state
  if (status === 'delivered' || status === 'pickup_completed') {
    return {
      eddDate: createdDate,
      eddIso: createdDate.toISOString(),
      displayEn: 'Delivered',
      displayBn: 'ডেলিভারি সম্পন্ন হয়েছে',
      isDelayed: false,
      isArrivingToday: false,
      isDelivered: true,
      deliveryTimeSlot: 'Completed',
    };
  }

  // Store Pickup: Ready today if before 6 PM, else next business day
  if (isStorePickup) {
    const isTodayReady = nowIst.getHours() < 18;
    const readyDate = new Date(nowIst);
    if (!isTodayReady) {
      readyDate.setDate(readyDate.getDate() + 1);
    }
    const isToday = readyDate.toDateString() === nowIst.toDateString();

    return {
      eddDate: readyDate,
      eddIso: readyDate.toISOString(),
      displayEn: isToday ? 'Ready for Pickup Today by 8:00 PM' : 'Ready Tomorrow from 10:00 AM',
      displayBn: isToday ? 'আজ রাত ৮:০০টার মধ্যে কাউন্টার থেকে পিকআপের জন্য প্রস্তুত' : 'আগামীকাল সকাল ১০:০০টা থেকে পিকআপের জন্য প্রস্তুত',
      isDelayed: false,
      isArrivingToday: isToday,
      isDelivered: false,
      deliveryTimeSlot: '10:00 AM - 8:30 PM',
    };
  }

  // Standard SLA calculation from slaEngine
  const baseSla = calculateSLA(destinationPincode, { orderDate: createdDate });
  let computedEdd = new Date(baseSla.deliveryDate);

  // If delay is active or exception state, adjust EDD (Item 7)
  const isDelayed = status === 'delayed' || delayDaysCount > 0;
  if (isDelayed) {
    const addedDays = Math.max(1, delayDaysCount);
    computedEdd.setDate(computedEdd.getDate() + addedDays);
  }

  // Check if arriving today (Item 19)
  const isSameDay = computedEdd.toDateString() === nowIst.toDateString();
  const isArrivingToday = status === 'out_for_delivery' || isSameDay;

  // Format English & Bengali dates
  const dayNameEn = computedEdd.toLocaleDateString('en-IN', { weekday: 'short' });
  const monthNameEn = computedEdd.toLocaleDateString('en-IN', { month: 'short' });
  const dayNum = computedEdd.getDate();

  const bengaliDays: Record<string, string> = {
    Sun: 'রবিবার',
    Mon: 'সোমবার',
    Tue: 'মঙ্গলবার',
    Wed: 'বুধবার',
    Thu: 'বৃহস্পতিবার',
    Fri: 'শুক্রবার',
    Sat: 'শনিবার',
  };
  const bengaliMonths: Record<string, string> = {
    Jan: 'জানুয়ারি',
    Feb: 'ফেব্রুয়ারি',
    Mar: 'মার্চ',
    Apr: 'এপ্রিল',
    May: 'মে',
    Jun: 'জুন',
    Jul: 'জুলাই',
    Aug: 'আগস্ট',
    Sep: 'সেপ্টেম্বর',
    Oct: 'অক্টোবর',
    Nov: 'নভেম্বর',
    Dec: 'ডিসেম্বর',
  };

  const dayBn = bengaliDays[dayNameEn] || dayNameEn;
  const monthBn = bengaliMonths[monthNameEn] || monthNameEn;
  const numBn = toBengaliNumerals(dayNum);

  let displayEn = `${dayNameEn}, ${dayNum} ${monthNameEn} by 8:00 PM`;
  let displayBn = `${dayBn}, ${numBn} ${monthBn} রাত ৮:০০টার মধ্যে`;

  if (isArrivingToday) {
    displayEn = 'Arriving Today by 8:00 PM';
    displayBn = 'আজ রাত ৮:০০টার মধ্যে পৌঁছাবে';
  }

  return {
    eddDate: computedEdd,
    eddIso: computedEdd.toISOString(),
    displayEn,
    displayBn,
    isDelayed,
    delayReasonEn: isDelayed ? 'Transit delay due to courier sorting route or weather advisory.' : undefined,
    delayReasonBn: isDelayed ? 'কুরিয়ার বাছাই কেন্দ্র বা প্রতিকূল আবহাওয়ার কারণে পৌঁছাতে কিছুটা বিলম্ব হতে পারে।' : undefined,
    isArrivingToday,
    isDelivered: false,
    deliveryTimeSlot: 'By 8:00 PM IST',
  };
}

/**
 * Checks and formats the "Arriving Today" high-priority indicator (Item 19)
 */
export function getArrivingTodayStatus(params: {
  status: OrderStatus;
  eddDateIso: string;
}): ArrivingTodayStatus {
  const { status, eddDateIso } = params;
  const now = getIndiaStandardTime();
  const edd = new Date(eddDateIso);

  const isToday = edd.toDateString() === now.toDateString();
  const isArrivingToday = (status === 'out_for_delivery' || isToday) && status !== 'delivered';

  return {
    isArrivingToday,
    badgeLabelBn: 'আজ পৌঁছাবে',
    badgeLabelEn: 'Arriving Today',
    deliverySlotEn: 'Expected delivery by 8:00 PM',
    deliverySlotBn: 'আজ রাত ৮:০০টার মধ্যে পৌঁছানোর সম্ভাবনা রয়েছে',
  };
}

/**
 * Resolves 4-digit Delivery Handover OTP security display rules (Item 8)
 * Prominently surfaced only when package is 'out_for_delivery' or 'shipped'.
 */
export function getDeliveryOtpDisplay(params: {
  status: OrderStatus;
  otp: string;
  phone?: string;
}): DeliveryOtpDisplay {
  const { status, otp, phone } = params;

  // Mask customer phone for privacy (e.g. +91 98*** **321)
  let maskedPhone = '';
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const last4 = cleanPhone.slice(-4);
      const first2 = cleanPhone.slice(0, 2);
      maskedPhone = `+91 ${first2}*** **${last4.slice(-2)}`;
    }
  }

  // Show OTP when active in transit and specifically out for delivery
  const shouldShowOtp = status === 'out_for_delivery' || status === 'shipped';

  return {
    shouldShowOtp,
    otpCode: otp.trim(),
    maskedPhone,
    securityNoticeEn: 'Share this 4-digit OTP with the delivery agent ONLY after physically receiving the parcel.',
    securityNoticeBn: 'পার্সেলটি হাতে পাওয়ার পরেই কেবল ৪-সংখ্যার এই ডেলিভারি ওটিপি রাইডারকে শেয়ার করুন।',
  };
}

/**
 * Builds Store Pickup (Click & Collect) details for Netaji Subhash Road Malda store (Item 40)
 */
export function getStorePickupDetails(orderId: string, counterOtp: string): StorePickupDetails {
  const cleanOtp = counterOtp.trim();
  const qrPayload = JSON.stringify({
    app: 'MMB_STORE_PICKUP',
    orderId: orderId.trim(),
    otp: cleanOtp,
    storeId: 'MMB-MALDA-MAIN',
    timestamp: Date.now(),
  });

  return {
    storeNameBn: 'এম.এম বুক হাউস (প্রধান শাখা)',
    storeNameEn: 'M.M Book House (Main Branch)',
    storeAddressBn: 'নেতাজি সুভাষ রোড (বৃন্দাবনী মাঠের বিপরীতে), ইংরেজবাজার, মালদা - ৭৩২১০১',
    storeAddressEn: 'Netaji Subhash Road (Opp. Brindabani Ground), English Bazar, Malda - 732101',
    operatingHoursBn: 'সোম - শনি: সকাল ১০:০০ - রাত ৮:৩০ (রবিবার বন্ধ)',
    operatingHoursEn: 'Mon - Sat: 10:00 AM - 8:30 PM (Sunday Closed)',
    counterOtp: cleanOtp,
    qrPayload,
    mapCoordinates: {
      lat: 25.0044,
      lng: 88.1458,
    },
    directionsUrl: 'https://maps.google.com/?q=25.0044,88.1458',
  };
}
