import { 
  mergeThermalLabelsHtml, 
  generatePosCounterReceiptHtml 
} from '../src/lib/services/bulkPrintService';
import { calculateInvoiceBreakdown } from '../src/lib/services/invoiceCalculationService';
import { ThermalShippingLabelData } from '../src/types/invoice';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 14 - Task 5 Test Suite: Bulk Thermal Labels & POS Counter Receipts...\n');

// 1. Prepare test labels
const label1: ThermalShippingLabelData = {
  awb_tracking_number: 'DELH10001',
  courier_name: 'Delhivery',
  order_id: 'ORD-101',
  invoice_number: 'INV-MMB-2026-0001',
  recipient_name: 'Customer One',
  recipient_phone: '9830011111',
  recipient_address: 'English Bazar Road',
  recipient_landmark: 'Near Post Office',
  recipient_pincode: '732101',
  recipient_city: 'Malda',
  recipient_district: 'Malda',
  recipient_state: 'West Bengal',
  seller_return_address: 'M.M. BOOK HOUSE, Malda, WB - 732101',
  payment_mode: 'PREPAID',
  weight_kg: 0.35,
  otp_badge: '',
};

const label2: ThermalShippingLabelData = {
  ...label1,
  awb_tracking_number: 'DELH10002',
  order_id: 'ORD-102',
  invoice_number: 'INV-MMB-2026-0002',
  recipient_name: 'Customer Two',
  payment_mode: 'COD',
  collectable_amount: 320,
};

const label3: ThermalShippingLabelData = {
  ...label1,
  awb_tracking_number: 'DELH10003',
  order_id: 'ORD-103',
  invoice_number: 'INV-MMB-2026-0003',
  recipient_name: 'Customer Three',
};

// 2. Test Bulk Thermal Label Merging (Item 27)
const bulkHtml = mergeThermalLabelsHtml([label1, label2, label3]);
assert(Boolean(bulkHtml.includes('DELH10001') && bulkHtml.includes('DELH10002') && bulkHtml.includes('DELH10003')), 'All 3 labels merged into document');
assert(Boolean(bulkHtml.includes('page-break-after: always;')), 'Explicit thermal page breaks defined');
assert(Boolean(bulkHtml.includes('last-page')), 'Last page class applied to avoid trailing blank labels');
assert(Boolean(bulkHtml.includes('Bulk Shipping Labels (3 Orders)')), 'Title displays correct batch count');

// 3. Test POS Counter Receipt Generator (Item 38)
const invoice = calculateInvoiceBreakdown(
  {
    orderId: 'POS-2026-01',
    financialYear: '2026-27',
    customerName: 'Counter Walk-in Customer',
    customerPhone: '9876500000',
    streetAddress: 'Over the Counter, Malda Store',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    stateCode: '19',
    pincode: '732101',
    items: [
      {
        itemId: 'POS-BK-1',
        title: 'Geetanjali (Rabindranath Tagore)',
        unitMrp: 200,
        unitSellingPrice: 160,
        quantity: 1,
        hsnCode: '4901',
      }
    ],
    couponDiscount: 0,
    shippingFee: 0,
    paymentMethod: 'upi',
    paymentStatus: 'PAID',
    utrOrRrn: '123456789012',
  },
  'INV-MMB-2026-0099',
  'https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0099'
);

const receipt80mm = generatePosCounterReceiptHtml(invoice, 80);
assert(Boolean(receipt80mm.includes('80mm auto')), '80mm auto receipt page sizing defined');
assert(Boolean(receipt80mm.includes('M.M. BOOK HOUSE')), 'Store name present');
assert(Boolean(receipt80mm.includes('Geetanjali')), 'Book title present');
assert(Boolean(receipt80mm.includes('123456789012')), 'UTR number present on receipt');
assert(Boolean(receipt80mm.includes('ধন্যবাদ! আবার আসবেন।')), 'Bengali counter greeting present');

const receipt58mm = generatePosCounterReceiptHtml(invoice, 58);
assert(Boolean(receipt58mm.includes('58mm auto')), '58mm auto receipt page sizing defined');

console.log('\n🎉 ALL MODULE 14 TASK 5 TESTS PASSED SUCCESSFULLY! (10/10 Checks)');
