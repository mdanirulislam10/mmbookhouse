import { 
  convertAmountToIndianWords, 
  calculateInvoiceBreakdown, 
  DEFAULT_SELLER_METADATA 
} from '../src/lib/services/invoiceCalculationService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 14 - Task 2 Test Suite: Indian Words & HSN 4901 GST Calculation...\n');

// 1. Test Indian English currency words in Lakhs and Crores (Item 6)
assert(
  convertAmountToIndianWords(0) === 'Indian Rupees Zero Only',
  'Zero amount formats correctly'
);

assert(
  convertAmountToIndianWords(450) === 'Indian Rupees Four Hundred Fifty Only',
  'Hundreds amount formats correctly'
);

assert(
  convertAmountToIndianWords(15000) === 'Indian Rupees Fifteen Thousand Only',
  'Thousands amount formats correctly'
);

assert(
  convertAmountToIndianWords(150250) === 'Indian Rupees One Lakh Fifty Thousand Two Hundred Fifty Only',
  'Lakhs format adheres to Indian numbering (One Lakh Fifty Thousand...)'
);

assert(
  convertAmountToIndianWords(12500000) === 'Indian Rupees One Crore Twenty Five Lakh Only',
  'Crores format adheres to Indian numbering'
);

assert(
  convertAmountToIndianWords(450.50) === 'Indian Rupees Four Hundred Fifty and Fifty Paise Only',
  'Paise decimal formats properly'
);

// 2. Test Intrastate (WB -> WB) Book Order (HSN 4901, 0% Nil-rated)
const intrastateInput = {
  orderId: 'ORD-INTRA-001',
  financialYear: '2026-27',
  customerName: 'Anirul Islam',
  customerPhone: '9733123456',
  streetAddress: 'Mahanandapally',
  city: 'Malda',
  district: 'Malda',
  state: 'West Bengal',
  stateCode: '19', // Intrastate WB
  pincode: '732101',
  items: [
    {
      itemId: 'BK-01',
      title: 'Bengali Literature Volume 1',
      unitMrp: 500,
      unitSellingPrice: 400,
      quantity: 2,
      hsnCode: '4901',
    }
  ],
  couponDiscount: 50,
  shippingFee: 40,
  codHandlingFee: 0,
  paymentMethod: 'upi' as const,
  paymentStatus: 'PAID' as const,
  utrOrRrn: '987654321012',
};

const intraInvoice = calculateInvoiceBreakdown(
  intrastateInput,
  'INV-MMB-2026-0001',
  'https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0001'
);

assert(intraInvoice.is_interstate === false, 'Intrastate detected for West Bengal (19)');
assert(intraInvoice.is_b2b === false, 'B2C detected when GSTIN omitted');
assert(intraInvoice.items[0].hsn_code === '4901', 'Item has HSN 4901');
assert(intraInvoice.items[0].cgst_rate === 0 && intraInvoice.items[0].sgst_rate === 0, 'Books have 0% CGST/SGST');
assert(intraInvoice.items[0].cgst_amount === 0 && intraInvoice.items[0].sgst_amount === 0, '0% tax yields 0 amount');
assert(intraInvoice.subtotal_mrp === 1000, 'Subtotal MRP calculated correctly (2 * 500 = 1000)');
assert(intraInvoice.subtotal_selling_price === 800, 'Subtotal Selling Price calculated correctly (2 * 400 = 800)');
assert(intraInvoice.total_taxable_amount === 790, 'Total taxable amount: 800 - 50 coupon + 40 shipping = 790');
assert(intraInvoice.total_payable_amount === 790, 'Total payable is 790');
assert(
  intraInvoice.amount_in_words === 'Indian Rupees Seven Hundred Ninety Only',
  'Amount in words matches payable amount'
);

// 3. Test Interstate (WB -> Bihar/Delhi) Book Order (HSN 4901, 0% Nil-rated)
const interstateInput = {
  ...intrastateInput,
  state: 'Delhi',
  stateCode: '07', // Interstate Delhi
  customerGstin: '07AAAAA0000A1Z5', // Institutional / B2B buyer
  companyName: 'National Book Trust Library',
};

const interInvoice = calculateInvoiceBreakdown(
  interstateInput,
  'INV-MMB-2026-0002',
  'https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0002'
);

assert(interInvoice.is_interstate === true, 'Interstate correctly detected for Delhi (07)');
assert(interInvoice.is_b2b === true, 'B2B institutional detected from valid 15-char GSTIN');
assert(interInvoice.items[0].igst_rate === 0, 'Books under HSN 4901 have 0% IGST');
assert(interInvoice.total_igst === 0, 'Total IGST is 0 for books');
assert(interInvoice.customer.company_name === 'National Book Trust Library', 'Company name captured');

console.log('\n🎉 ALL MODULE 14 TASK 2 TESTS PASSED SUCCESSFULLY! (14/14 Checks)');
