import { generateSvgQrCode } from '../src/lib/services/qrCodeGenerator';
import { generateInvoiceHtml } from '../src/lib/services/invoicePdfService';
import { calculateInvoiceBreakdown } from '../src/lib/services/invoiceCalculationService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 14 - Task 3 Test Suite: Amazon-Pattern Vector PDF & HTML Generator...\n');

// 1. Test QR Code SVG Generator
const qrSvg = generateSvgQrCode('https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0001', 120);
assert(Boolean(qrSvg.includes('<svg') && qrSvg.includes('</svg>')), 'QR Code generates valid SVG wrapper');
assert(Boolean(qrSvg.includes('viewBox="0 0 120 120"')), 'QR Code matches requested 120x120 dimensions');
assert(Boolean(qrSvg.includes('<rect')), 'QR code contains matrix rect elements');

// 2. Prepare mock invoice
const testInput = {
  orderId: 'ORD-WB-9911',
  financialYear: '2026-27',
  customerName: 'Kazi Nazrul Islam',
  customerPhone: '9832145678',
  streetAddress: 'Churulia, Asansol Road',
  landmark: 'Near Memorial Hall',
  city: 'Asansol',
  district: 'Paschim Bardhaman',
  state: 'West Bengal',
  stateCode: '19',
  pincode: '713336',
  items: [
    {
      itemId: 'B-01',
      title: 'সঞ্চিতা (Sanchita - Selected Poems)',
      titleBn: 'সঞ্চিতা',
      author: 'Kazi Nazrul Islam',
      isbn13: '9788172159988',
      hsnCode: '4901',
      quantity: 1,
      unitMrp: 350,
      unitSellingPrice: 280,
    }
  ],
  couponDiscount: 30,
  shippingFee: 40,
  codHandlingFee: 0,
  paymentMethod: 'upi' as const,
  paymentStatus: 'PAID' as const,
  utrOrRrn: '123456789012',
};

const invoice = calculateInvoiceBreakdown(
  testInput,
  'INV-MMB-2026-0001',
  'https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0001'
);

// 3. Test HTML Generation
const originalHtml = generateInvoiceHtml(invoice, 'ORIGINAL');
assert(Boolean(originalHtml.includes('<!DOCTYPE html>')), 'Contains DOCTYPE declaration');
assert(Boolean(originalHtml.includes('ORIGINAL FOR RECIPIENT')), 'Contains ORIGINAL FOR RECIPIENT copy badge');
assert(Boolean(originalHtml.includes('M.M. BOOK HOUSE')), 'Contains trade name M.M. BOOK HOUSE');
assert(Boolean(originalHtml.includes('MM ENTERPRISE')), 'Contains legal entity MM ENTERPRISE');
assert(Boolean(originalHtml.includes('19ABCDE1234F1Z5')), 'Contains Seller GSTIN');
assert(Boolean(originalHtml.includes('INV-MMB-2026-0001')), 'Contains Invoice Number');
assert(Boolean(originalHtml.includes('সঞ্চিতা')), 'Renders Bengali book title in UTF-8');
assert(Boolean(originalHtml.includes('4901')), 'Contains HSN Code 4901');
assert(Boolean(originalHtml.includes('Whether tax is payable on Reverse Charge basis: <strong>NO</strong>')), 'Complies with Reverse Charge statement');
assert(Boolean(originalHtml.includes('Authorized Signatory')), 'Contains Authorized Signatory block');
assert(Boolean(originalHtml.includes('Indian Rupees Two Hundred Ninety Only')), 'Contains Amount in Indian words');

// 4. Test Duplicate copy
const duplicateHtml = generateInvoiceHtml(invoice, 'DUPLICATE');
assert(Boolean(duplicateHtml.includes('DUPLICATE FOR TRANSPORTER')), 'Duplicate copy badge renders properly');

console.log('\n🎉 ALL MODULE 14 TASK 3 TESTS PASSED SUCCESSFULLY! (14/14 Checks)');
