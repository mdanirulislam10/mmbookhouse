/**
 * Module 11 Task 1: Automated Verification Test Suite
 * Tests Address Types, Zod Validation Schema, Sanitization, and Helper Utilities
 */

import {
  addressFormSchema,
  combineStreetAddress,
  splitStreetAddress,
  createAddressSnapshot,
  formatAddressSingleLine,
  sanitizeInputString,
} from '../src/lib/validations/address';
import type { AddressFormData } from '../src/types/address';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- Running Module 11 Task 1 Verification Suite ---\n');

  // Test 1: Valid Indian Address with all 7 mandatory fields
  const validAddress: AddressFormData = {
    recipient_name: 'সুবীর দাস',
    recipient_phone: '9832145678',
    alternate_phone: '8765432109',
    address_line1: 'Flat 4B, আনন্দম অ্যাপার্টমেন্ট',
    address_line2: 'রথবাড়ি মোড়, পুরাতন জেল রোড',
    landmark: 'গৌড় কলেজ গেটের বিপরীতে',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    pincode: '732101',
    address_type: 'home',
    is_default: true,
    delivery_preferences: {
      callBeforeDelivery: true,
      leaveWithSecurity: false,
      doNotRingBell: false,
      isWeekendClosed: false,
      preferredTimeSlot: 'morning_10_to_1',
    },
  };

  const parseResult1 = addressFormSchema.safeParse(validAddress);
  assert(parseResult1.success, 'Valid Indian address with 7 mandatory fields passes schema');

  // Test 2: Invalid phone numbers (must start with 6-9 and be exactly 10 digits)
  const invalidPhones = ['5832145678', '98321456', '983214567899', 'abcdefghij'];
  for (const phone of invalidPhones) {
    const res = addressFormSchema.safeParse({ ...validAddress, recipient_phone: phone });
    assert(!res.success, `Invalid phone "${phone}" is correctly rejected`);
  }

  // Test 3: Invalid pincode (must be 6 digits and start with 1-9)
  const invalidPincodes = ['032101', '73210', '7321011', '73210A', ''];
  for (const pin of invalidPincodes) {
    const res = addressFormSchema.safeParse({ ...validAddress, pincode: pin });
    assert(!res.success, `Invalid pincode "${pin}" is correctly rejected`);
  }

  // Test 4: Alternate phone matching primary phone should fail
  const duplicatePhoneRes = addressFormSchema.safeParse({
    ...validAddress,
    recipient_phone: '9832145678',
    alternate_phone: '9832145678',
  });
  assert(
    !duplicatePhoneRes.success,
    'Alternate phone identical to primary phone is rejected'
  );

  // Test 5: Missing mandatory fields (landmark, address_line1, address_line2, city)
  const missingLandmark = addressFormSchema.safeParse({
    ...validAddress,
    landmark: '',
  });
  assert(!missingLandmark.success, 'Empty landmark is rejected (mandatory field)');

  const missingLine1 = addressFormSchema.safeParse({
    ...validAddress,
    address_line1: '',
  });
  assert(!missingLine1.success, 'Empty address_line1 is rejected (mandatory field)');

  // Test 6: XSS and script tag sanitization
  const maliciousInput = '<script>alert("hacked")</script>Flat 2A<img src=x onerror=alert(1)>';
  const cleanInput = sanitizeInputString(maliciousInput);
  assert(
    !cleanInput.includes('<script>') && !cleanInput.includes('<img') && cleanInput === 'alert("hacked")Flat 2A',
    'HTML and script tags are completely stripped by sanitizer'
  );

  const parsedWithTags = addressFormSchema.safeParse({
    ...validAddress,
    address_line1: 'Flat 2A <script>evil()</script>',
    landmark: 'Near Temple <b onmouseover="steal()">Gate</b>',
  });
  if (parsedWithTags.success) {
    assert(
      !parsedWithTags.data.address_line1.includes('<script>') &&
        !parsedWithTags.data.landmark.includes('<b'),
      'Form parser sanitizes tags in text inputs'
    );
  } else {
    assert(false, 'Form parser should succeed after sanitizing valid text with tags');
  }

  // Test 7: Street address combine and split utilities
  const combined = combineStreetAddress('Flat 302, Green Valley', 'Subhash Pally, Ward 12');
  assert(
    combined === 'Flat 302, Green Valley, Subhash Pally, Ward 12',
    'combineStreetAddress properly merges line1 and line2'
  );

  const split = splitStreetAddress(combined);
  assert(
    split.address_line1 === 'Flat 302' && split.address_line2 === 'Green Valley, Subhash Pally, Ward 12',
    'splitStreetAddress splits address properly'
  );

  // Test 8: Address Snapshot Generation
  const snapshot = createAddressSnapshot(validAddress);
  assert(
    snapshot.recipient_name === 'সুবীর দাস' &&
      snapshot.pincode === '732101' &&
      typeof snapshot.snapshot_timestamp === 'string' &&
      snapshot.street_address.includes('আনন্দম অ্যাপার্টমেন্ট'),
    'createAddressSnapshot creates complete frozen JSONB snapshot'
  );

  // Test 9: Formatted single line string
  const singleLine = formatAddressSingleLine(validAddress);
  assert(
    singleLine.includes('আনন্দম') && singleLine.includes('732101') && singleLine.includes('Near গৌড় কলেজ গেটের বিপরীতে'),
    'formatAddressSingleLine produces expected readable line'
  );

  console.log(`\n--- Verification Results: ${passed} Passed, ${failed} Failed ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
