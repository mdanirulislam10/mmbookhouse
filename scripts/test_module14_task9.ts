import { 
  generateGstr1Rows, 
  exportGstr1Csv, 
  calculateGstr1Summary 
} from '../src/lib/services/gstrExportService';
import { calculateInvoiceBreakdown } from '../src/lib/services/invoiceCalculationService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('🧪 Starting Module 14 - Task 9 Test Suite: GSTR-1 10-Column Statutory Sales Export...\n');

  // 1. Prepare sample B2C invoice
  const b2cInvoice = calculateInvoiceBreakdown(
    {
      orderId: 'ORD-GST-01',
      financialYear: '2026-27',
      customerName: 'B2C Retail Buyer',
      customerPhone: '9830000001',
      streetAddress: 'Netaji More',
      city: 'Malda',
      district: 'Malda',
      state: 'West Bengal',
      stateCode: '19',
      pincode: '732101',
      items: [
        {
          itemId: 'B1',
          title: 'Bengali Grammar Essentials',
          unitMrp: 300,
          unitSellingPrice: 250,
          quantity: 2,
          hsnCode: '4901',
        }
      ],
      couponDiscount: 0,
      shippingFee: 0,
      paymentMethod: 'upi',
      paymentStatus: 'PAID',
    },
    'INV-MMB-2026-0501',
    'https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0501'
  );

  // 2. Prepare sample B2B institutional invoice
  const b2bInvoice = calculateInvoiceBreakdown(
    {
      orderId: 'ORD-GST-02',
      financialYear: '2026-27',
      customerName: 'Kalyani University Library',
      customerPhone: '9830000002',
      streetAddress: 'University Campus',
      city: 'Nadia',
      district: 'Nadia',
      state: 'West Bengal',
      stateCode: '19',
      pincode: '741235',
      customerGstin: '19AABCK1234F1Z1',
      companyName: 'Kalyani University',
      items: [
        {
          itemId: 'B2',
          title: 'Advanced Bengali Linguistics',
          unitMrp: 800,
          unitSellingPrice: 700,
          quantity: 5,
          hsnCode: '4901',
        }
      ],
      couponDiscount: 0,
      shippingFee: 100,
      paymentMethod: 'netbanking',
      paymentStatus: 'PAID',
    },
    'INV-MMB-2026-0502',
    'https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0502'
  );

  // 3. Test GSTR-1 Row Generation (Item 43)
  const gstrRows = generateGstr1Rows([b2cInvoice, b2bInvoice]);
  assert(gstrRows.length === 2, 'Generated 2 GSTR-1 rows');

  // Verify B2C row
  const r1 = gstrRows[0];
  assert(r1.invoice_number === 'INV-MMB-2026-0501', 'Row 1 has correct invoice number');
  assert(r1.customer_gstin === 'URP', 'B2C row has URP for unregistered customer');
  assert(r1.customer_state_code === '19', 'State code is 19');
  assert(r1.hsn_code === '4901', 'HSN is 4901');
  assert(r1.taxable_value === 500, 'Taxable value is 500');
  assert(r1.cgst_amount === 0 && r1.sgst_amount === 0 && r1.igst_amount === 0, 'GST is 0 for printed books');
  assert(r1.total_amount === 500, 'Total amount is 500');

  // Verify B2B row
  const r2 = gstrRows[1];
  assert(r2.customer_gstin === '19AABCK1234F1Z1', 'B2B row contains buyer GSTIN');
  assert(r2.taxable_value === 3600, 'Taxable value includes items + shipping (3500 + 100 = 3600)');
  assert(r2.total_amount === 3600, 'Total amount is 3600');

  // 4. Test GSTR-1 CSV Export (Item 50)
  const csv = exportGstr1Csv(gstrRows);
  assert(Boolean(csv.startsWith('Invoice Number,Invoice Date,Customer GSTIN,Customer State Code,HSN Code,Taxable Value,CGST Amount,SGST Amount,IGST Amount,Total Amount')), 'CSV header matches statutory 10 columns');
  assert(Boolean(csv.includes('INV-MMB-2026-0501') && csv.includes('19AABCK1234F1Z1')), 'CSV contains both invoice records');

  // 5. Test Summary Calculations
  const summary = calculateGstr1Summary(gstrRows);
  assert(summary.totalInvoices === 2, 'Total invoices is 2');
  assert(summary.b2bInvoicesCount === 1, 'B2B count is 1');
  assert(summary.b2cInvoicesCount === 1, 'B2C count is 1');
  assert(summary.totalInvoiceValue === 4100, 'Total turnover is 4100 (500 + 3600)');
  assert(summary.totalCgst === 0 && summary.totalSgst === 0 && summary.totalIgst === 0, 'Total tax collected is 0 (Nil-rated)');
  assert(summary.hsnSummary[0].hsnCode === '4901', 'HSN summary lists 4901');

  console.log('\n🎉 ALL MODULE 14 TASK 9 TESTS PASSED SUCCESSFULLY! (14/14 Checks)');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
