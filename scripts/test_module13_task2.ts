import {
  buildNpciUpiUri,
  buildUpiAppSchemes,
  generateUpiQrSvg,
  calculatePaymentSurcharge,
  generateUpiIntentData,
  DEFAULT_MERCHANT_VPA,
} from '../src/lib/services/upiPaymentService';

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

console.log('🧪 Testing Module 13 - Task 2: Dynamic UPI QR Code, UPI Intent & App Switch Generator');

// 1. Test NPCI UPI URI Specification (Item 2 & 3)
const uri = buildNpciUpiUri({
  orderId: 'MMB-2026-9042',
  amount: 450,
  payeeVpa: 'mmbookhouse@icici',
  payeeName: 'M.M Book House Malda',
  note: 'Exam Prep Books',
});

assert(uri.startsWith('upi://pay?'), 'NPCI URI starts with upi://pay?');
assert(uri.includes('pa=mmbookhouse%40icici'), 'URI includes correct encoded VPA');
assert(uri.includes('am=450.00'), 'URI locks exact formatted 2-decimal amount');
assert(uri.includes('tr=MMB-2026-9042'), 'URI includes transaction reference / order ID');
assert(uri.includes('cu=INR'), 'URI locks currency as INR');

// 2. Test Mobile App Switch Schemes (Item 2)
const schemes = buildUpiAppSchemes(uri);
assert(schemes.phonepe.startsWith('phonepe://pay?'), 'PhonePe intent scheme matches specification');
assert(schemes.gpay.startsWith('tez://upi/pay?'), 'Google Pay Tez intent scheme matches specification');
assert(schemes.paytm.startsWith('paytmmp://pay?'), 'Paytm mobile intent scheme matches specification');
assert(schemes.bhim.startsWith('bhim://pay?'), 'BHIM intent scheme matches specification');
assert(schemes.generic === uri, 'Generic fallback scheme matches base URI');

// 3. Test Dynamic SVG QR Generator (Item 3)
const qrSvg = generateUpiQrSvg(uri, 260);
assert(qrSvg.includes('<svg'), 'QR SVG output contains valid SVG element');
assert(qrSvg.includes('viewBox="0 0 260 260"'), 'QR SVG has correct responsive viewBox');
assert(qrSvg.includes('<rect'), 'QR SVG contains rendered matrix rects');
assert(qrSvg.includes('#111827'), 'QR SVG contains dark module fill color');

// 4. Test Zero Surcharge Rule (Item 4)
const upiSurcharge = calculatePaymentSurcharge(1200, 'upi');
assert(
  upiSurcharge.surchargeAmount === 0 && upiSurcharge.isZeroSurcharge === true,
  'UPI payments guarantee 0% zero surcharge'
);

const rupaySurcharge = calculatePaymentSurcharge(1200, 'card', 'RuPay');
assert(
  rupaySurcharge.surchargeAmount === 0 && rupaySurcharge.isZeroSurcharge === true,
  'RuPay debit card guarantees 0% zero surcharge'
);

// 5. Test Unified Intent Data Generator (Item 2, 3, 9)
const fullIntent = generateUpiIntentData({
  orderId: 'MMB-7721',
  amount: 380,
});
assert(fullIntent.vpa === DEFAULT_MERCHANT_VPA, 'Uses default merchant VPA when none provided');
assert(fullIntent.amount === 380, 'Preserves numeric amount');
assert(Boolean(fullIntent.qr_svg_data?.startsWith('data:image/svg+xml')), 'Generates valid data URI for image src');
assert(fullIntent.app_schemes.phonepe.includes('MMB-7721'), 'App schemes retain order reference');

console.log(`\nResults for Task 2: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
