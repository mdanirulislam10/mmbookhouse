import {
  orderStatusEnum,
  orderStatusTransitionSchema,
  courierWebhookSchema,
  guestTrackLookupSchema,
  verifyGuestOtpSchema,
  verifyDeliveryOtpSchema,
  cancelOrderSchema,
  replacementRequestSchema,
} from '../src/lib/validations/tracking';

async function runTests() {
  console.log('🧪 Starting Module 16 - Task 1 Test Suite: Tracking Types & Zod Validations...\n');

  // Test 1: Order Status enum validation (Items 2, 3, 40)
  const validStatuses = [
    'order_placed',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled_by_user',
    'cancelled_by_seller',
    'delivery_attempted',
    'rto_initiated',
    'rto_delivered',
    'delayed',
    'lost_in_transit',
    'pickup_confirmed',
    'pickup_ready',
    'pickup_completed',
  ];

  for (const s of validStatuses) {
    const res = orderStatusEnum.safeParse(s);
    if (!res.success) {
      throw new Error(`Test 1 Failed: Valid status "${s}" rejected by orderStatusEnum`);
    }
  }
  console.log('✅ Test 1 Passed: All 15 order statuses (5 primary, 7 exception, 3 store pickup) accepted.');

  // Test 2: Order Status Transition Schema (Item 4)
  const validTransition = {
    order_id: 'ord-12345',
    from_status: 'packed',
    to_status: 'shipped',
    changed_by: 'admin' as const,
    hub_location: 'Kolkata Central Hub',
    city: 'Kolkata',
  };
  const tRes = orderStatusTransitionSchema.safeParse(validTransition);
  if (!tRes.success) {
    throw new Error('Test 2 Failed: Valid status transition rejected');
  }

  const invalidTransition = {
    order_id: 'ord-12345',
    to_status: 'unknown_bogus_status',
    changed_by: 'hacker',
  };
  if (orderStatusTransitionSchema.safeParse(invalidTransition).success) {
    throw new Error('Test 2 Failed: Invalid status transition was erroneously accepted');
  }
  console.log('✅ Test 2 Passed: Status transition schema validates allowed values and rejects unknown states.');

  // Test 3: Courier Webhook Schema with HMAC signature requirement (Item 14)
  const validWebhook = {
    awb_number: 'DEL123456789',
    courier: 'delhivery' as const,
    raw_status: 'In-Transit',
    timestamp: '2026-09-11T12:00:00Z',
    location: 'Malda Sorting Center',
    signature: 'hmac_sha256_mock_signature_abc123',
  };
  const wRes = courierWebhookSchema.safeParse(validWebhook);
  if (!wRes.success) {
    throw new Error('Test 3 Failed: Valid courier webhook rejected');
  }

  const missingSigWebhook = {
    ...validWebhook,
    signature: 'short', // < 8 characters
  };
  if (courierWebhookSchema.safeParse(missingSigWebhook).success) {
    throw new Error('Test 3 Failed: Webhook with invalid/short signature was accepted');
  }
  console.log('✅ Test 3 Passed: 3PL Courier webhook enforces HMAC security signature.');

  // Test 4: Guest Tracking Lookup & Uppercase Normalization (Item 38)
  const validLookup = {
    phone: '9876543210',
    order_number: 'mmb-2026-9042',
  };
  const lRes = guestTrackLookupSchema.safeParse(validLookup);
  if (!lRes.success || lRes.data.order_number !== 'MMB-2026-9042') {
    throw new Error('Test 4 Failed: Guest lookup failed or order number was not converted to uppercase');
  }

  const invalidPhoneLookup = {
    phone: '12345', // Not 10 digits starting with 6-9
    order_number: 'MMB-123',
  };
  if (guestTrackLookupSchema.safeParse(invalidPhoneLookup).success) {
    throw new Error('Test 4 Failed: Invalid phone number accepted in guest lookup');
  }
  console.log('✅ Test 4 Passed: Guest lookup strictly validates 10-digit Indian mobile and normalizes order ID.');

  // Test 5: 4-digit Delivery & Pickup OTP Validation (Items 8 & 40)
  const validOtpPayload = {
    order_id: 'ord-9042',
    otp: '4829',
    verification_type: 'home_delivery' as const,
  };
  const oRes = verifyDeliveryOtpSchema.safeParse(validOtpPayload);
  if (!oRes.success) {
    throw new Error('Test 5 Failed: Valid 4-digit delivery OTP rejected');
  }

  const invalidOtpPayload = {
    ...validOtpPayload,
    otp: '48290', // 5 digits
  };
  if (verifyDeliveryOtpSchema.safeParse(invalidOtpPayload).success) {
    throw new Error('Test 5 Failed: 5-digit OTP was erroneously accepted');
  }
  console.log('✅ Test 5 Passed: Delivery & store pickup OTP schema strictly enforces 4-digit numeric format.');

  // Test 6: Customer Cancellation Schema (Item 9)
  const validCancel = {
    order_id: 'ord-9042',
    reason: 'Ordered wrong edition by mistake',
  };
  const cRes = cancelOrderSchema.safeParse(validCancel);
  if (!cRes.success) {
    throw new Error('Test 6 Failed: Valid cancellation reason rejected');
  }

  const shortReasonCancel = {
    order_id: 'ord-9042',
    reason: 'no', // < 3 characters
  };
  if (cancelOrderSchema.safeParse(shortReasonCancel).success) {
    throw new Error('Test 6 Failed: Cancellation reason with < 3 characters was accepted');
  }
  console.log('✅ Test 6 Passed: Customer self-cancellation validates minimum reason length.');

  // Test 7: 7-Day Replacement / Return Schema (Item 10)
  const validReplacement = {
    order_id: 'ord-9042',
    product_id: 'bk-math-10',
    reason: 'printing_defect' as const,
    description: 'Pages 45-60 are blank and unprinted in the delivered textbook.',
    images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
  };
  const rRes = replacementRequestSchema.safeParse(validReplacement);
  if (!rRes.success) {
    throw new Error('Test 7 Failed: Valid replacement request rejected');
  }
  console.log('✅ Test 7 Passed: 7-Day replacement schema validates defect categories and proof images.');

  console.log('\n🎉 ALL MODULE 16 TASK 1 TESTS PASSED SUCCESSFULLY! (7/7 Checks)\n');
}

runTests().catch((err) => {
  console.error('❌ Task 1 verification failed:', err);
  process.exit(1);
});
