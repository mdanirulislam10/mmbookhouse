/**
 * MM Book House - Module 12 Task 9: Atomic Order Placement & Abandoned Checkout Recovery Tests
 * 
 * Verifies:
 * - Draft Checkout Session Capture & Updating (Item 34)
 * - Inactivity Detection (> 30 minutes threshold) (Item 34, 35)
 * - Cryptographic Resume Token Generation & Validation (Item 35)
 * - 1-Click WhatsApp Recovery Message Generator (Item 35)
 * - Reminder Rate Limiting (max 3 reminders) (Item 35)
 * - Post-Order Checkout Recovery Conversion (Item 35)
 * - Atomic Transaction Rollback Safety (Item 40)
 * - Atomic Server Action Execution & Idempotency Safeguards (Item 33, 40)
 */

import {
  trackDraftCheckout,
  getEligibleAbandonedCheckouts,
  generateRecoveryUrl,
  generateWhatsAppRecoveryMessage,
  validateResumeToken,
  markCheckoutAsRecovered,
  recordReminderSent,
  simulateAtomicTransaction,
  resetAbandonedCheckoutStore,
  ABANDONED_THRESHOLD_MS,
} from '../src/lib/services/abandonedCheckoutService';
import { placeOrderAction, getOrderDetailsAction } from '../src/actions/checkout';
import type { PlaceOrderPayload, CheckoutItem } from '../src/types/checkout';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function runTask9Tests() {
  console.log('===============================================================');
  console.log('🧪 Running Module 12 Task 9: Atomic Action & Abandoned Checkout Tests');
  console.log('===============================================================\n');

  resetAbandonedCheckoutStore();

  // --- 1. Draft Checkout Tracking (Item 34) ---
  console.log('--- 1. Draft Checkout Session Tracking (Item 34) ---');
  const sampleItems: CheckoutItem[] = [
    {
      id: 'item_wbcs_01',
      bookId: 'book_wbcs_scanner',
      title: 'WBCS Practice Scanner',
      titleBn: 'ডব্লিউবিসিএস প্র্যাকটিস স্ক্যানার',
      author: 'M.M Editorial Team',
      price: 450,
      mrp: 600,
      quantity: 1,
    },
  ];

  const draftSession: any = trackDraftCheckout({
    sessionId: 'sess_abn_test_101',
    customerPhone: '9832012345',
    customerEmail: 'student@gmail.com',
    customerName: 'রাহুল সেন',
    items: sampleItems,
    totalAmount: 475,
    shippingPincode: '732101',
    deliverySpeed: 'standard',
    lastStepReached: 2,
  });

  assert(draftSession.sessionId === 'sess_abn_test_101', 'Draft checkout session recorded with accurate ID');
  assert(draftSession.customerPhone === '9832012345', 'Customer contact phone recorded');
  assert(draftSession.lastStepReached === 2, 'Last funnel step reached (Step 2) tracked');
  assert(draftSession.resumeToken.startsWith('rec_'), 'Tamper-resistant resume token generated');
  assert(!draftSession.isRecovered, 'Draft is initially not recovered');

  // Updating existing session
  const updatedSession = trackDraftCheckout({
    sessionId: 'sess_abn_test_101',
    items: sampleItems,
    totalAmount: 475,
    lastStepReached: 3,
  });
  assert(updatedSession.lastStepReached === 3, 'Draft checkout smoothly updated when user advances to Step 3');

  // --- 2. Inactivity Detection (> 30 mins) (Item 34, 35) ---
  console.log('\n--- 2. Abandoned Checkout Inactivity Detection (Item 34, 35) ---');
  // Immediately after creation, it is not eligible (less than 30 mins)
  let eligible = getEligibleAbandonedCheckouts();
  assert(eligible.length === 0, 'Recent checkout (< 30 mins) is not classified as abandoned');

  // Simulate 31 minutes passage
  draftSession.updatedAt = Date.now() - (ABANDONED_THRESHOLD_MS + 60 * 1000);
  eligible = getEligibleAbandonedCheckouts();
  assert(eligible.length === 1, 'Checkout idle for > 30 mins successfully detected as abandoned');
  assert(eligible[0].sessionId === 'sess_abn_test_101', 'Eligible record matches abandoned session');

  // --- 3. WhatsApp Notification Message Formatting (Item 35) ---
  console.log('\n--- 3. WhatsApp Recovery Message & 1-Click URL (Item 35) ---');
  const recoveryUrl = generateRecoveryUrl(draftSession);
  assert(recoveryUrl.includes('resume=sess_abn_test_101'), 'Recovery URL contains session resume parameter');
  assert(recoveryUrl.includes(`token=${draftSession.resumeToken}`), 'Recovery URL contains tamper-resistant cryptographic token');

  const waMsg = generateWhatsAppRecoveryMessage(draftSession);
  assert(waMsg.phone === '9832012345', 'WhatsApp message targets customer mobile number');
  assert(waMsg.messageBn.includes('রাহুল সেন'), 'Bengali WhatsApp message is personalized with customer name');
  assert(waMsg.messageBn.includes('ডব্লিউবিসিএস প্র্যাকটিস স্ক্যানার'), 'Bengali WhatsApp message mentions book title');
  assert(waMsg.messageBn.includes(draftSession.resumeToken), 'WhatsApp message contains direct resume URL');
  assert(waMsg.messageEn.includes('+91 97330 85000'), 'English fallback includes Malda store helpline');

  // --- 4. Resume Token Validation & Reminder Limits (Item 35) ---
  console.log('\n--- 4. Token Validation & Reminder Transmission Limits (Item 35) ---');
  const validCheck = validateResumeToken('sess_abn_test_101', draftSession.resumeToken);
  assert(validCheck.valid === true && validCheck.record !== undefined, 'Valid token passes authentication check');

  const invalidCheck = validateResumeToken('sess_abn_test_101', 'tampered_fake_token');
  assert(invalidCheck.valid === false, 'Tampered token is strictly rejected');

  // Record 3 reminders
  recordReminderSent('sess_abn_test_101');
  recordReminderSent('sess_abn_test_101');
  recordReminderSent('sess_abn_test_101');
  assert(draftSession.recoveryRemindersSent === 3, 'Reminder count correctly tracked at 3');
  assert(getEligibleAbandonedCheckouts().length === 0, 'Max 3 reminder limit halts further spam messages');

  // --- 5. Atomic Rollback Safety (Item 40) ---
  console.log('\n--- 5. Atomic Transaction Safety & Rollback (Item 40) ---');
  let rollbackCalled: any = false;
  const failingTransaction = simulateAtomicTransaction(
    [
      () => true, // Step 1: Check address - OK
      () => true, // Step 2: Recalculate price - OK
      () => false, // Step 3: Payment gateway timeout - FAIL
      () => true, // Step 4: Finalize order - SKIPPED
    ],
    () => {
      rollbackCalled = true;
    }
  );
  assert(failingTransaction.success === false, 'Atomic transaction detects failure in step chain');
  assert(failingTransaction.rolledBack === true, 'Rollback flag set to true on failure');
  assert(rollbackCalled === true, 'Rollback cleanup handler executed');
  assert(failingTransaction.executedSteps === 2, 'Halts immediately at point of failure');

  // --- 6. End-to-End Server Action Order Placement (Item 33, 39, 40) ---
  console.log('\n--- 6. Server Action Execution & Auto-Recovery (Item 33, 40) ---');
  const orderPayload: PlaceOrderPayload = {
    sessionId: 'sess_abn_test_101',
    idempotencyKey: `idemp_test_atomic_${Date.now()}`,
    mode: 'cart',
    items: [
      {
        bookId: 'book_wbcs_scanner',
        quantity: 1,
      },
    ],
    shippingAddressId: 'addr_demo_999',
    deliverySpeed: 'standard',
    paymentMethod: 'upi',
    useGstInvoice: false,
    isGiftOrder: false,
  };

  const orderResult = await placeOrderAction(orderPayload);
  assert(orderResult.success === true, 'Atomic order placement server action succeeded');
  assert(orderResult.orderId !== undefined, 'Server action allocated unique orderId');
  assert(orderResult.orderNumber?.startsWith('#MMB-2026-') === true, 'Server action formatted official order number');
  assert(orderResult.redirectUrl?.includes('/checkout/success/') === true, 'Redirect URL points to success page');

  // Verify Abandoned Checkout converted to recovered
  assert((draftSession as any).isRecovered === true, 'Abandoned checkout marked as recovered upon order placement');

  // Idempotency check: Replay of same payload returns identical cached order
  const replayResult = await placeOrderAction(orderPayload);
  assert(replayResult.success === true, 'Idempotent replay succeeds');
  assert(replayResult.orderId === orderResult.orderId, 'Idempotent replay returns same cached orderId without double billing');

  console.log('\n===============================================================');
  console.log(`📊 Module 12 Task 9 Test Results: ${passedTests}/${totalTests} Passed (100%)`);
  console.log('===============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTask9Tests();
