import {
  evaluateCodEligibility,
  recordCustomerRto,
  resetRtoStore,
  generateCodOtp,
  generateDigitalCodCollectionData,
  generateCodPreDispatchConfirmationMessage,
  canCancelCodOrder,
  getPrepaidIncentiveBanner,
  DEFAULT_COD_CONFIG,
} from '../src/lib/services/codRiskService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('🧪 Testing Module 13 - Task 3: COD Anti-Fraud, ₹2,500 Cap & RTO Blacklist Engine');

resetRtoStore();

// 1. COD ₹2,500 Cap & Transparent ₹35 Handling Fee (Item 13 & 14)
const eligibleCod = evaluateCodEligibility(1200, '9832012345');
assert(eligibleCod.eligible === true, 'Order under ₹2,500 is eligible for COD');
assert(eligibleCod.handling_fee === 35, 'COD order carries transparent ₹35 handling fee');
assert(eligibleCod.requires_otp === true, 'COD order requires 4-digit OTP challenge');
assert(eligibleCod.is_blacklisted === false, 'Customer with 0 RTOs is not blacklisted');

// Exact boundary test: ₹2,500
const boundaryCod = evaluateCodEligibility(2500, '9832012345');
assert(boundaryCod.eligible === true, 'Order at exact ₹2,500 cap is eligible for COD');

// Exceeding ₹2,500 test: ₹2,501
const overLimitCod = evaluateCodEligibility(2501, '9832012345');
assert(overLimitCod.eligible === false, 'Order over ₹2,500 is rejected from COD');
assert(Boolean(overLimitCod.reason_bn?.includes('সর্বোচ্চ ₹2500')), 'Bengali explanation displays max cap reason');

// 2. RTO Automatic Blacklisting Algorithm (Item 15)
const testPhone = '9733085000';
assert(evaluateCodEligibility(500, testPhone).eligible === true, 'Initial order is eligible');

// Record 1 RTO
recordCustomerRto(testPhone, 'Customer phone switched off at delivery');
assert(evaluateCodEligibility(500, testPhone).eligible === true, '1 RTO still allows 1 second chance');

// Record 2nd RTO -> Triggers automatic permanent blacklist
recordCustomerRto(testPhone, 'Customer refused delivery claiming did not order');
const blacklistedEval = evaluateCodEligibility(500, testPhone);
assert(blacklistedEval.eligible === false, '2 RTOs automatically locks COD for this phone');
assert(blacklistedEval.is_blacklisted === true, 'Flagged as blacklisted');
assert(Boolean(blacklistedEval.reason_bn?.includes('প্রত্যাখ্যাত (RTO)')), 'Provides Bengali explanation for blacklist');

// 3. Cryptographic 4-digit OTP Generation (Item 12)
const otp = generateCodOtp();
assert(/^\d{4}$/.test(otp), 'COD OTP is exactly 4 numeric digits');

// 4. Digital COD Doorstep QR (Item 16)
const digitalCod = generateDigitalCodCollectionData('MMB-9042', 650, 'RIDER-07');
assert(digitalCod.doorstepCashlessOption === true, 'Digital COD provides cashless doorstep option');
assert(digitalCod.upiUri.includes('DCOD-MMB-9042'), 'UPI URI embeds DCOD order prefix');
assert(digitalCod.upiUri.includes('am=650.00'), 'UPI URI locks exact doorstep collection amount');

// 5. Pre-dispatch WhatsApp Confirmation (Item 17)
const whatsappNotice = generateCodPreDispatchConfirmationMessage({
  orderId: 'MMB-9042',
  customerName: 'Sourav',
  totalAmount: 685,
  deliveryDate: 'Thursday, 13 March',
});
assert(whatsappNotice.message.includes('MMB-9042'), 'WhatsApp confirmation includes order number');
assert(whatsappNotice.actionButtonText.includes('Confirm Order'), 'Interactive button text present');

// 6. 1-Click Cancel before Dispatch (Item 18)
assert(canCancelCodOrder('PLACED').canCancel === true, 'Can cancel PLACED order');
assert(canCancelCodOrder('CONFIRMED').canCancel === true, 'Can cancel CONFIRMED order');
assert(canCancelCodOrder('PACKED').canCancel === true, 'Can cancel PACKED order before courier pickup');
assert(canCancelCodOrder('DISPATCHED').canCancel === false, 'Cannot self-cancel once DISPATCHED to courier');
assert(canCancelCodOrder('OUT_FOR_DELIVERY').canCancel === false, 'Cannot self-cancel OUT_FOR_DELIVERY order');

// 7. Prepaid Incentive Ribbon (Item 20)
const banner = getPrepaidIncentiveBanner(1200);
assert(banner.discountAmount === 30, 'Prepaid discount is ₹30');
assert(banner.handlingFeeSaved === 35, 'Saved handling fee is ₹35');
assert(banner.totalSavings === 65, 'Total incentive calculation is ₹65 (₹30 discount + ₹35 fee waived)');
assert(banner.bannerText_bn.includes('ফ্ল্যাট ₹30 ছাড়'), 'Bengali ribbon banner text properly rendered');

console.log(`\nResults for Task 3: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
