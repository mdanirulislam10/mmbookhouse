import { 
  getStoredInvoiceAsync, 
  getInvoiceByOrderIdAsync, 
  getOrCreateInvoiceForOrderAsync,
  verifyInvoiceAsync 
} from '../src/lib/services/invoiceStorageService';
import { formatWhatsAppInvoiceMessage } from '../src/lib/services/invoiceDeliveryService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ DEEP TEST FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ [DEEP AUDIT PASSED] ${msg}`);
}

async function runDeepVerification() {
  console.log('\n========================================================================');
  console.log('🔍 RUNNING DEEP ARCHITECTURAL AUDIT & REAL DATA INTEGRATION TEST');
  console.log('========================================================================\n');

  // Test 1: Real Supabase Order (88888888-8888-8888-8888-888888888801)
  console.log('🔹 1. Testing Live Supabase Order Resolution...');
  const realDbOrderId = '88888888-8888-8888-8888-888888888801';
  const dbInvoice = await getInvoiceByOrderIdAsync(realDbOrderId);
  assert(dbInvoice !== null, 'Invoice resolved from live Supabase database');
  assert(dbInvoice?.customer.customer_name === 'Anirban Sen', `Real customer is Anirban Sen (got: ${dbInvoice?.customer.customer_name})`);
  assert(dbInvoice?.items[0]?.book_title_bn === 'ভারতের ইতিহাস ও জাতীয় মুক্তি সংগ্রাম', 'Real book is Bharater Itihas O Jatiyo Mukti Sangram');
  assert(dbInvoice?.total_payable_amount === 400, `Total payable is exactly ₹400 (got: ${dbInvoice?.total_payable_amount})`);

  // Test 2: Real Supabase Invoice Lookup (MMB-INV-2026-00001)
  console.log('\n🔹 2. Testing Live Supabase Invoice Number Lookup...');
  const invRecord = await getStoredInvoiceAsync('MMB-INV-2026-00001');
  assert(invRecord !== null, 'Found invoice record MMB-INV-2026-00001 in database');
  assert(invRecord?.invoice.invoice_number === 'MMB-INV-2026-00001', 'Correct invoice number preserved');

  // Test 3: QR Code Verification for Live Invoice
  console.log('\n🔹 3. Testing Dynamic QR Code Verification for Real Invoices...');
  const qrVerification = await verifyInvoiceAsync('MMB-INV-2026-00001');
  assert(qrVerification.verified === true, 'Invoice successfully verified via QR code endpoint');
  assert(qrVerification.seller_gstin === '19ABCDE1234F1Z5', 'Seller GSTIN verified as State 19');
  assert(typeof qrVerification.sha256_hash === 'string' && qrVerification.sha256_hash.length === 64, 'Valid 64-character SHA-256 seal present');

  // Test 4: Customer Account Orders Hub Resolution (MMB-2026-101)
  console.log('\n🔹 4. Testing Customer Account Multi-Item Order (MMB-2026-101)...');
  const custInvoice = await getInvoiceByOrderIdAsync('MMB-2026-101');
  assert(custInvoice !== null, 'Customer order MMB-2026-101 resolved');
  assert(custInvoice?.items.length === 2, `Contains 2 items (got: ${custInvoice?.items.length})`);
  assert(custInvoice?.total_payable_amount === 620, `Total is ₹620 for both books (got: ${custInvoice?.total_payable_amount})`);

  // Test 5: Seller Central Pipeline Order (ord_malda_101)
  console.log('\n🔹 5. Testing Merchant Seller Central Order (ord_malda_101)...');
  const sellerInvoice = await getInvoiceByOrderIdAsync('ord_malda_101');
  assert(sellerInvoice !== null, 'Merchant pipeline order ord_malda_101 resolved');
  assert(sellerInvoice?.customer.customer_name === 'অমল কুমার দাস', 'Customer is Amal Kumar Das');
  assert(Boolean(sellerInvoice?.items[0]?.book_title?.includes('WBCS')), 'Item is WBCS Scanner');
  assert(sellerInvoice?.total_payable_amount === 520, 'Total is ₹520');

  // Test 6: Truly Non-Existent Order (Must NOT return fake Gitanjali!)
  console.log('\n🔹 6. Testing Non-Existent Order (Security & Zero-Fake-Data Audit)...');
  const ghostInvoice = await getOrCreateInvoiceForOrderAsync('GHOST-ORDER-INVALID-999');
  assert(ghostInvoice === null, 'Non-existent order safely returns null (triggers 404, no fake dummy data)');
  const ghostVerification = await verifyInvoiceAsync('INV-GHOST-FAKE-000');
  assert(ghostVerification.verified === false, 'Non-existent invoice QR scan safely fails verification');

  // Test 7: Item 36 Heartfelt Bengali WhatsApp Message
  console.log('\n🔹 7. Testing Item 36 Heartfelt Bengali WhatsApp Message...');
  const waMsg = formatWhatsAppInvoiceMessage(custInvoice!, 'https://mmbookhouse.com/api/orders/MMB-2026-101/invoice');
  assert(waMsg.includes('পড়ার জন্য শুভকামনা!'), 'Contains heartfelt Bengali wish "পড়ার জন্য শুভকামনা!"');
  assert(waMsg.includes('Save Paper, Save Trees'), 'Contains green initiative message');

  console.log('\n========================================================================');
  console.log('🏆 DEEP ARCHITECTURAL AUDIT & INTEGRATION TESTS 100% PASSED');
  console.log('========================================================================\n');
}

runDeepVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
