import { 
  gstinSchema, 
  invoiceNumberSchema, 
  creditNoteNumberSchema, 
  hsnCodeSchema, 
  gstr1RowValidationSchema, 
  createTaxInvoiceInputSchema 
} from '../src/lib/validations/invoice';
import { SellerMetadata, TaxInvoice, Gstr1ReportRow } from '../src/types/invoice';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 14 - Task 1 Test Suite: Types & Zod Validations...\n');

// 1. Validate GSTIN Schema
const validGstin = '19ABCDE1234F1Z5'; // WB State code 19 + PAN ABCDE1234F + Entity 1 + Z + Checksum 5
const invalidGstinShort = '19ABCDE1234F1Z';
const invalidGstinFormat = '19ABCDE1234F155'; // Missing 'Z' at 14th char

assert(gstinSchema.safeParse(validGstin).success === true, 'Valid 15-char GSTIN accepted');
assert(gstinSchema.safeParse(invalidGstinShort).success === false, 'Invalid short GSTIN rejected');
assert(gstinSchema.safeParse(invalidGstinFormat).success === false, 'Invalid GSTIN missing Z rejected');

// 2. Validate Sequential Invoice Numbering Schema (Item 3)
const validInvoiceNum = 'INV-MMB-2026-0001';
const validInvoiceLarge = 'INV-MMB-2026-10492';
const invalidInvoiceNum = 'INV-2026-001';

assert(invoiceNumberSchema.safeParse(validInvoiceNum).success === true, 'Valid invoice number format INV-MMB-2026-0001 accepted');
assert(invoiceNumberSchema.safeParse(validInvoiceLarge).success === true, 'Large sequential invoice number accepted');
assert(invoiceNumberSchema.safeParse(invalidInvoiceNum).success === false, 'Malformed invoice number rejected');

// 3. Validate Credit Note Numbering Schema (Item 41)
const validCrn = 'CRN-MMB-2026-0012';
const invalidCrn = 'CN-2026-0012';
assert(creditNoteNumberSchema.safeParse(validCrn).success === true, 'Valid Credit Note number CRN-MMB-2026-0012 accepted');
assert(creditNoteNumberSchema.safeParse(invalidCrn).success === false, 'Invalid Credit Note number format rejected');

// 4. Validate HSN Code Schema (Item 1: 4901 for printed books)
assert(hsnCodeSchema.safeParse('4901').success === true, 'HSN 4901 for printed books accepted');
assert(hsnCodeSchema.safeParse('49011010').success === true, '8-digit HSN 49011010 accepted');
assert(hsnCodeSchema.safeParse('ABC').success === false, 'Alphabetic HSN rejected');

// 5. Validate GSTR-1 10-Column Mandatory Row Schema (Item 43)
const validGstr1Row: Gstr1ReportRow = {
  invoice_number: 'INV-MMB-2026-0042',
  invoice_date: '2026-09-11',
  customer_gstin: 'URP',
  customer_state_code: '19',
  hsn_code: '4901',
  taxable_value: 450,
  cgst_amount: 0,
  sgst_amount: 0,
  igst_amount: 0,
  total_amount: 450,
};
assert(gstr1RowValidationSchema.safeParse(validGstr1Row).success === true, 'Valid 10-column GSTR-1 row passes validation');

// 6. Validate createTaxInvoiceInputSchema for B2C and B2B
const validB2CInput = {
  orderId: 'ORD-987654',
  financialYear: '2026-27',
  customerName: 'Sourav Ganguly',
  customerPhone: '9830123456',
  streetAddress: '14/B Central Road, English Bazar',
  landmark: 'Near Town Hall',
  city: 'Malda',
  district: 'Malda',
  state: 'West Bengal',
  stateCode: '19',
  pincode: '732101',
  items: [
    {
      itemId: 'ITEM-1',
      title: 'পথের পাঁচালী (Pather Panchali)',
      titleBn: 'পথের পাঁচালী',
      author: 'Bibhutibhushan Bandyopadhyay',
      isbn13: '9788172151234',
      hsnCode: '4901',
      quantity: 2,
      unitSellingPrice: 250,
      unitMrp: 300,
    }
  ],
  couponDiscount: 50,
  shippingFee: 40,
  codHandlingFee: 0,
  paymentMethod: 'upi' as const,
  paymentStatus: 'PAID' as const,
  utrOrRrn: '123456789012',
};
assert(createTaxInvoiceInputSchema.safeParse(validB2CInput).success === true, 'Valid B2C invoice input schema passed');

const validB2BInput = {
  ...validB2CInput,
  customerGstin: '19ABCDE1234F1Z5',
  companyName: 'Malda District Central Library',
};
assert(createTaxInvoiceInputSchema.safeParse(validB2BInput).success === true, 'Valid B2B institutional invoice input with GSTIN passed');

console.log('\n🎉 ALL MODULE 14 TASK 1 TESTS PASSED SUCCESSFULLY! (6/6 Checks)');
