/**
 * Test Suite: Module 16 - Task 4: Dynamic SLA, EDD & Delivery/Pickup OTP Engine
 * Run with: npx tsx scripts/test_module16_task4.ts
 */

import {
  calculateLiveEdd,
  getArrivingTodayStatus,
  getDeliveryOtpDisplay,
  getStorePickupDetails,
} from '../src/lib/services/trackingEddService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Module 16 - Task 4 Test Suite: Dynamic SLA, EDD & Delivery OTP Engine...\n');

// 1. Live EDD for Malda Town pincode
const eddMalda = calculateLiveEdd({
  destinationPincode: '732101',
  status: 'packed',
  orderCreatedAt: new Date(),
});
assert(Boolean(eddMalda.eddIso), 'EDD ISO date must be present');
assert(Boolean(eddMalda.displayEn && eddMalda.displayBn), 'Bilingual EDD strings must be present');
assert(eddMalda.displayEn.includes('by 8:00 PM') || eddMalda.displayEn.includes('Arriving Today'), 'EDD format includes cutoff');
console.log('✅ Test 1 Passed: Malda Town EDD computed with exact cutoff slot.');

// 2. Live EDD for Regional/Metro (Kolkata)
const eddKolkata = calculateLiveEdd({
  destinationPincode: '700001',
  status: 'shipped',
  orderCreatedAt: new Date(),
});
assert(eddKolkata.eddDate.getTime() >= Date.now(), 'Future EDD expected for regional shipment');
console.log('✅ Test 2 Passed: Regional destination EDD computed accurately.');

// 3. Delay adjustment (Item 7)
const eddDelayed = calculateLiveEdd({
  destinationPincode: '732101',
  status: 'delayed',
  delayDaysCount: 2,
  orderCreatedAt: new Date(),
});
assert(eddDelayed.isDelayed, 'Order must be flagged as delayed');
assert(Boolean(eddDelayed.delayReasonEn && eddDelayed.delayReasonBn), 'Delay reason explanation must be provided');
assert(eddDelayed.eddDate.getTime() > eddMalda.eddDate.getTime(), 'Delayed EDD must be later than standard EDD');
console.log('✅ Test 3 Passed: In-transit delay automatically pushes EDD with transparent explanation.');

// 4. Arriving Today indicator (Item 19)
const eddOfd = calculateLiveEdd({
  destinationPincode: '732101',
  status: 'out_for_delivery',
});
assert(eddOfd.isArrivingToday, 'Out for delivery should always trigger arriving today');
assert(eddOfd.displayEn.includes('Arriving Today'), 'Display says Arriving Today');
assert(eddOfd.displayBn.includes('আজ রাত ৮:০০টার মধ্যে'), 'Bengali display says arriving today');

const todayStatus = getArrivingTodayStatus({
  status: 'out_for_delivery',
  eddDateIso: new Date().toISOString(),
});
assert(todayStatus.isArrivingToday, 'Arriving today status confirmed');
assert(todayStatus.badgeLabelBn === 'আজ পৌঁছাবে', 'Bangla badge label');
console.log('✅ Test 4 Passed: "Arriving Today" high-priority indicator detected and formatted.');

// 5. 4-digit Delivery Handover OTP Security display (Item 8)
const otpOfd = getDeliveryOtpDisplay({
  status: 'out_for_delivery',
  otp: '7392',
  phone: '9832145678',
});
assert(otpOfd.shouldShowOtp, 'OTP must be visible when out for delivery');
assert(otpOfd.otpCode === '7392', 'OTP code preserved');
assert(Boolean(otpOfd.securityNoticeBn), 'Bangla security warning present');

const otpPlaced = getDeliveryOtpDisplay({
  status: 'order_placed',
  otp: '7392',
  phone: '9832145678',
});
assert(!otpPlaced.shouldShowOtp, 'OTP must NOT be shown before dispatch/shipped');

const otpDelivered = getDeliveryOtpDisplay({
  status: 'delivered',
  otp: '7392',
  phone: '9832145678',
});
assert(!otpDelivered.shouldShowOtp, 'OTP must not be shown once delivery is completed');
console.log('✅ Test 5 Passed: Delivery OTP visibility strictly gated to active delivery states.');

// 6. Masked customer phone
assert(Boolean(otpOfd.maskedPhone?.includes('+91 98*** **78')), 'Phone number properly masked for privacy');
console.log('✅ Test 6 Passed: Customer contact information masked securely.');

// 7. Store Pickup details for Netaji Subhash Road (Item 40)
const pickupDetails = getStorePickupDetails('MMB-88221', '6410');
assert(pickupDetails.storeNameEn.includes('M.M Book House'), 'Store name English');
assert(pickupDetails.storeAddressBn.includes('নেতাজি সুভাষ রোড'), 'Store address Bengali');
assert(pickupDetails.operatingHoursEn.includes('10:00 AM - 8:30 PM'), 'Operating hours');
assert(pickupDetails.counterOtp === '6410', 'Counter OTP set');
assert(pickupDetails.qrPayload.includes('MMB_STORE_PICKUP') && pickupDetails.qrPayload.includes('6410'), 'QR payload valid');
console.log('✅ Test 7 Passed: Store pickup counter details & QR payload verified.');

console.log('\n🎉 ALL MODULE 16 TASK 4 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
