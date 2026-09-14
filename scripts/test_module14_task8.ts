import { 
  generateNextCreditNoteNumber, 
  resetCreditNoteSequence, 
  issueCreditNote, 
  getCreditNote, 
  generateCreditNoteHtml, 
  generateRevisedInvoiceHtml 
} from '../src/lib/services/creditNoteService';
import { calculateInvoiceBreakdown } from '../src/lib/services/invoiceCalculationService';
import { storeTaxInvoice } from '../src/lib/services/invoiceStorageService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('🧪 Starting Module 14 - Task 8 Test Suite: GST Credit Notes & Revised Invoices...\n');

  resetCreditNoteSequence('2026-27', 0);

  // 1. Test Sequential Credit Note Numbering (Item 41)
  const crn1 = generateNextCreditNoteNumber('2026-27');
  const crn2 = generateNextCreditNoteNumber('2026-27');
  assert(crn1 === 'CRN-MMB-2026-0001', 'First Credit Note has number CRN-MMB-2026-0001');
  assert(crn2 === 'CRN-MMB-2026-0002', 'Second Credit Note has number CRN-MMB-2026-0002');

  // 2. Prepare mock original invoice
  const originalInvoice = calculateInvoiceBreakdown(
    {
      orderId: 'ORD-RET-9900',
      financialYear: '2026-27',
      customerName: 'Tarashankar Bandyopadhyay',
      customerPhone: '9833098330',
      streetAddress: 'Labhpur Road',
      city: 'Birbhum',
      district: 'Birbhum',
      state: 'West Bengal',
      stateCode: '19',
      pincode: '731303',
      items: [
        {
          itemId: 'TB-01',
          title: 'হাঁসুলী বাঁকের উপকথা (Hansuli Banker Upakatha)',
          unitMrp: 400,
          unitSellingPrice: 320,
          quantity: 1,
          hsnCode: '4901',
        }
      ],
      couponDiscount: 0,
      shippingFee: 40,
      paymentMethod: 'upi',
      paymentStatus: 'PAID',
    },
    'INV-MMB-2026-0888',
    'https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0888'
  );

  storeTaxInvoice(originalInvoice);

  // 3. Test Credit Note Creation linked to original invoice
  const creditNote = issueCreditNote({
    originalInvoiceNumber: 'INV-MMB-2026-0888',
    refundAmount: 360,
    reason: 'RETURN_OF_GOODS',
    customReasonNote: 'Customer returned book due to duplicate purchase',
    financialYear: '2026-27',
  });

  assert(Boolean(creditNote.credit_note_number.startsWith('CRN-MMB-2026-')), 'Valid CRN number generated');
  assert(creditNote.original_invoice_number === 'INV-MMB-2026-0888', 'Correctly linked to original invoice');
  assert(creditNote.refund_amount === 360, 'Refund amount matches input');
  assert(Boolean(creditNote.reason.includes('Customer Return of Printed Books')), 'Reason mapped accurately');

  // Verify retrieval
  const fetchedCrn = getCreditNote(creditNote.credit_note_number);
  assert(fetchedCrn !== null && fetchedCrn.credit_note_number === creditNote.credit_note_number, 'Credit note retrieved');

  // 4. Test Error Handling when original invoice does not exist
  let invalidBlocked = false;
  try {
    issueCreditNote({
      originalInvoiceNumber: 'INV-MMB-2026-0000-NONEXISTENT',
      refundAmount: 100,
      reason: 'ORDER_CANCELLATION',
    });
  } catch (err: any) {
    invalidBlocked = err.message.includes('does not exist');
  }
  assert(invalidBlocked, 'Issuing credit note against invalid invoice rejected');

  // 5. Test Credit Note HTML Print Generator
  const crnHtml = generateCreditNoteHtml(creditNote);
  assert(Boolean(crnHtml.includes('CREDIT NOTE')), 'Contains CREDIT NOTE heading');
  assert(Boolean(crnHtml.includes('(Issued under Section 34 of CGST Act, 2017)')), 'Complies with Section 34 CGST reference');
  assert(Boolean(crnHtml.includes('INV-MMB-2026-0888')), 'Displays linked original invoice number');
  assert(Boolean(crnHtml.includes('Indian Rupees Three Hundred Sixty Only')), 'Displays refund amount in Indian words');
  assert(Boolean(crnHtml.includes('4901')), 'Contains HSN Code 4901');

  // 6. Test Revised Tax Invoice Generator (Item 45)
  const revisedHtml = generateRevisedInvoiceHtml(originalInvoice, {
    revisionReason: 'Correction of Institutional Buyer GSTIN',
    updatedGstin: '19ABCDE9999F1Z9',
  });
  assert(Boolean(revisedHtml.includes('REVISED TAX INVOICE (Under Rule 53(1) of CGST Rules, 2017)')), 'Complies with Rule 53(1) Revised Invoice banner');
  assert(Boolean(revisedHtml.includes('19ABCDE9999F1Z9')), 'Displays updated GSTIN');

  console.log('\n🎉 ALL MODULE 14 TASK 8 TESTS PASSED SUCCESSFULLY! (13/13 Checks)');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
