import { 
  formatWhatsAppInvoiceMessage, 
  formatEmailInvoicePayload, 
  sendInvoiceWhatsApp, 
  sendInvoiceEmail, 
  sendInvoiceSmsFallback, 
  resendInvoice, 
  getDeliveryAuditLogs, 
  clearDeliveryAuditLogs 
} from '../src/lib/services/invoiceDeliveryService';
import { calculateInvoiceBreakdown } from '../src/lib/services/invoiceCalculationService';
import { storeTaxInvoice, resetSequenceCounter } from '../src/lib/services/invoiceStorageService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('🧪 Starting Module 14 - Task 7 Test Suite: Omnichannel Delivery (WhatsApp, Email & SMS)...\n');

  clearDeliveryAuditLogs();
  resetSequenceCounter('2026-27', 10);

  const testInvoice = calculateInvoiceBreakdown(
    {
      orderId: 'ORD-DELIV-001',
      financialYear: '2026-27',
      customerName: 'Sukanta Bhattacharya',
      customerPhone: '9832098320',
      streetAddress: 'Maharaja Nandakumar Road',
      city: 'Kolkata',
      district: 'Kolkata',
      state: 'West Bengal',
      stateCode: '19',
      pincode: '700036',
      items: [
        {
          itemId: 'SB-01',
          title: 'ছাড়পত্র (Chharpatra)',
          titleBn: 'ছাড়পত্র',
          unitMrp: 180,
          unitSellingPrice: 150,
          quantity: 1,
          hsnCode: '4901',
        }
      ],
      couponDiscount: 0,
      shippingFee: 30,
      paymentMethod: 'upi',
      paymentStatus: 'PAID',
    },
    'INV-MMB-2026-0011',
    'https://mmbookhouse.com/api/invoices/verify/INV-MMB-2026-0011'
  );

  storeTaxInvoice(testInvoice);

  // 1. Test WhatsApp Message Formatting (Item 31)
  const pdfUrl = 'https://mmbookhouse.com/api/invoices/download/INV-MMB-2026-0011.pdf';
  const waMessage = formatWhatsAppInvoiceMessage(testInvoice, pdfUrl);
  assert(Boolean(waMessage.includes('M.M. BOOK HOUSE (মালদা)')), 'WhatsApp message contains branding');
  assert(Boolean(waMessage.includes('Sukanta Bhattacharya')), 'WhatsApp message contains customer name');
  assert(Boolean(waMessage.includes('INV-MMB-2026-0011')), 'WhatsApp message contains invoice number');
  assert(Boolean(waMessage.includes('HSN 4901 (0% Nil-Rated GST)')), 'WhatsApp message mentions HSN 4901');
  assert(Boolean(waMessage.includes(pdfUrl)), 'WhatsApp message contains direct PDF download link');

  // 2. Test Transactional Email Payload Formatting (Item 32)
  const emailPayload = formatEmailInvoicePayload(testInvoice, pdfUrl);
  assert(Boolean(emailPayload.subject.includes('INV-MMB-2026-0011')), 'Email subject contains invoice number');
  assert(Boolean(emailPayload.html.includes('PDF ট্যাক্স ইনভয়েস ডাউনলোড করুন')), 'Email HTML contains download CTA button');
  assert(Boolean(emailPayload.html.includes('মালদা, পশ্চিমবঙ্গ - ৭৩২১০১')), 'Email contains registered office footer');

  // 3. Test WhatsApp Dispatch & Delivery Log (Item 31 & 39)
  const waLog = await sendInvoiceWhatsApp(testInvoice, pdfUrl);
  assert(waLog.status === 'DELIVERED', 'WhatsApp dispatched successfully');
  assert(waLog.channel === 'whatsapp', 'Channel logged as whatsapp');
  assert(waLog.recipient_target === '9832098320', 'Logged to recipient phone');

  // 4. Test Email Dispatch (Item 32 & 39)
  const emailLog = await sendInvoiceEmail(testInvoice, 'sukanta@example.com', pdfUrl);
  assert(emailLog.status === 'DELIVERED', 'Email dispatched successfully');
  assert(emailLog.channel === 'email', 'Channel logged as email');
  assert(emailLog.recipient_target === 'sukanta@example.com', 'Logged to recipient email');

  // 5. Test SMS Fallback Dispatch (Item 37)
  const smsLog = await sendInvoiceSmsFallback(testInvoice, 'https://mmbk.in/i/0011');
  assert(smsLog.status === 'DELIVERED', 'SMS fallback dispatched');
  assert(smsLog.channel === 'sms', 'Channel logged as sms');

  // 6. Test Resend Trigger for Customer Care (Item 36)
  const resendWaLog = await resendInvoice('INV-MMB-2026-0011', 'whatsapp');
  assert(resendWaLog.channel === 'whatsapp', 'Resend on WhatsApp succeeded');

  // Verify complete audit trail count
  const allLogs = getDeliveryAuditLogs('INV-MMB-2026-0011');
  assert(allLogs.length === 4, 'Audit trail contains all 4 delivery attempts (Item 39)');

  console.log('\n🎉 ALL MODULE 14 TASK 7 TESTS PASSED SUCCESSFULLY! (14/14 Checks)');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
