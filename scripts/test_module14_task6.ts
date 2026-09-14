import { 
  generateNextInvoiceNumber, 
  resetSequenceCounter, 
  computeInvoiceHash, 
  storeTaxInvoice, 
  getStoredInvoice, 
  verifyInvoice 
} from '../src/lib/services/invoiceStorageService';
import { calculateInvoiceBreakdown } from '../src/lib/services/invoiceCalculationService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('🧪 Starting Module 14 - Task 6 Test Suite: Sequential Numbering & Immutable Storage...\n');

// 1. Test Gapless Sequential Invoice Number Generation (Items 3, 44)
resetSequenceCounter('2026-27', 0);

const inv1 = generateNextInvoiceNumber('2026-27');
const inv2 = generateNextInvoiceNumber('2026-27');
const inv3 = generateNextInvoiceNumber('2026-27');

assert(inv1 === 'INV-MMB-2026-0001', 'First invoice has sequence 0001');
assert(inv2 === 'INV-MMB-2026-0002', 'Second invoice has sequence 0002 (gapless)');
assert(inv3 === 'INV-MMB-2026-0003', 'Third invoice has sequence 0003 (gapless)');

// 2. Prepare mock invoice
const invoiceData = calculateInvoiceBreakdown(
  {
    orderId: 'ORD-SEQ-001',
    financialYear: '2026-27',
    customerName: 'Bankim Chandra Chattopadhyay',
    customerPhone: '9831098310',
    streetAddress: 'Naihati',
    city: 'North 24 Parganas',
    district: 'North 24 Parganas',
    state: 'West Bengal',
    stateCode: '19',
    pincode: '743165',
    items: [
      {
        itemId: 'BCC-01',
        title: 'আনন্দমঠ (Anandamath)',
        unitMrp: 300,
        unitSellingPrice: 240,
        quantity: 1,
        hsnCode: '4901',
      }
    ],
    couponDiscount: 0,
    shippingFee: 40,
    paymentMethod: 'upi',
    paymentStatus: 'PAID',
    utrOrRrn: '998877665544',
  },
  inv1,
  `https://mmbookhouse.com/api/invoices/verify/${inv1}`
);

// 3. Test Cryptographic SHA256 Hashing (Item 15)
const hash1 = computeInvoiceHash(invoiceData);
const hash2 = computeInvoiceHash(invoiceData);
assert(hash1.length === 64, 'SHA256 produces valid 64-char hex string');
assert(hash1 === hash2, 'Hash is deterministic for exact invoice content');

// 4. Test Immutable Storage (Items 10, 14)
const storedRecord = storeTaxInvoice(invoiceData);
assert(storedRecord.is_immutable === true, 'Invoice flagged as immutable');
assert(storedRecord.content_sha256 === hash1, 'Stored record contains verified hash');

// Verify retrieval
const retrieved = getStoredInvoice(inv1);
assert(retrieved !== null && retrieved.invoice.invoice_number === inv1, 'Stored invoice retrieved successfully');

// Attempt mutation/duplicate insertion -> must throw GST violation error
let mutationBlocked = false;
try {
  storeTaxInvoice(invoiceData);
} catch (err: any) {
  mutationBlocked = err.message.includes('GST Statutory Violation');
}
assert(mutationBlocked, 'Attempt to overwrite existing invoice blocked with GST violation exception');

// 5. Test Verification Route Logic (Item 17)
const verified = verifyInvoice(inv1);
assert(verified.verified === true, 'Verification succeeds for valid invoice');
assert(verified.invoice_number === inv1, 'Verification returns correct invoice number');
assert(verified.sha256_hash === hash1, 'Verification confirms sha256 checksum');

const notFound = verifyInvoice('INV-MMB-2026-9999');
assert(notFound.verified === false, 'Verification fails for non-existent invoice');

console.log('\n🎉 ALL MODULE 14 TASK 6 TESTS PASSED SUCCESSFULLY! (12/12 Checks)');
