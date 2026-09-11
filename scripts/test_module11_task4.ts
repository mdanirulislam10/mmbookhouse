/**
 * Module 11 Task 4: Automated Verification Test Suite
 * Tests AddressFormModal, Data Splitting, and Form Submission Validation
 */

import { addressFormSchema, splitStreetAddress } from '../src/lib/validations/address';
import type { AddressFormData, CustomerAddress } from '../src/types/address';

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
  console.log('\n--- Running Module 11 Task 4 Verification Suite ---\n');

  // Test 1: Editing mode data pre-fill and splitting from existing CustomerAddress
  const mockExistingAddress: CustomerAddress = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    recipient_name: 'অনির্বাণ চট্টোপাধ্যায়',
    recipient_phone: '9832001122',
    alternate_phone: '9832003344',
    street_address: 'Holding No. 45, Rabindra Avenue, Mokdumpur',
    landmark: 'নেতাজি সুভাষ পার্কের পাশে',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    pincode: '732101',
    address_type: 'home',
    is_default: true,
    delivery_preferences: {
      callBeforeDelivery: true,
      leaveWithSecurity: false,
      doNotRingBell: true,
      preferredTimeSlot: 'evening_4_to_7',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const splitResult = splitStreetAddress(mockExistingAddress.street_address);
  assert(
    splitResult.address_line1 === 'Holding No. 45' &&
      splitResult.address_line2 === 'Rabindra Avenue, Mokdumpur',
    'splitStreetAddress correctly separates line 1 and line 2 for editing'
  );

  // Test 2: Form submission payload validation for Work address with Weekend Closed
  const workAddressPayload: AddressFormData = {
    recipient_name: 'সৌরভ গঙ্গোপাধ্যায়',
    recipient_phone: '9830123456',
    address_line1: 'TCS Gitanjali Park, 4th Floor',
    address_line2: 'New Town Action Area II',
    landmark: 'Eco Space Gate 2',
    city: 'Kolkata',
    district: 'North 24 Parganas',
    state: 'West Bengal',
    pincode: '700156',
    address_type: 'work',
    is_default: false,
    delivery_preferences: {
      callBeforeDelivery: true,
      leaveWithSecurity: true,
      isWeekendClosed: true,
    },
  };

  const parseWork = addressFormSchema.safeParse(workAddressPayload);
  assert(parseWork.success, 'Work address with weekend closed flag passes validation');
  if (parseWork.success) {
    assert(
      parseWork.data.delivery_preferences?.isWeekendClosed === true &&
        parseWork.data.address_type === 'work',
      'Work address preferences are properly retained'
    );
  }

  // Test 3: Form submission payload validation for Hostel/Mess address
  const hostelAddressPayload: AddressFormData = {
    recipient_name: 'রাহুল মণ্ডল',
    recipient_phone: '9832998877',
    address_line1: 'রবীন্দ্র ছাত্রাবাস, রুম ২০৪',
    address_line2: 'গৌড় বঙ্গ বিশ্ববিদ্যালয় ক্যাম্পাস রোড',
    landmark: 'বিশ্ববিদ্যালয় মেন গেটের বিপরীতে',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    pincode: '732103',
    address_type: 'hostel',
    is_default: false,
    delivery_preferences: {
      callBeforeDelivery: true,
      specialInstructions: 'গেটে এসে কল করবেন, রুমে যাওয়া নিষেধ',
    },
  };

  const parseHostel = addressFormSchema.safeParse(hostelAddressPayload);
  assert(parseHostel.success, 'Hostel/Mess address passes validation');

  // Test 4: Form submission payload validation for Leave with Neighbor
  const neighborAddressPayload: AddressFormData = {
    recipient_name: 'প্রিয়াঙ্কা সেন',
    recipient_phone: '9832776655',
    address_line1: 'Flat 102, শান্তি নীড়',
    address_line2: 'সুভাষ পল্লী লেন',
    landmark: 'কালী মন্দির সংলগ্ন',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    pincode: '732101',
    address_type: 'home',
    is_default: true,
    delivery_preferences: {
      leaveWithNeighbor: {
        enabled: true,
        neighborName: 'মৌসুমি ঘোষ',
        neighborFlat: 'Flat 103',
      },
    },
  };

  const parseNeighbor = addressFormSchema.safeParse(neighborAddressPayload);
  assert(parseNeighbor.success, 'Leave with Neighbor preference passes validation');

  // Test 5: Missing landmark or address_line2 fails validation
  const missingLandmark = addressFormSchema.safeParse({
    ...neighborAddressPayload,
    landmark: '',
  });
  assert(!missingLandmark.success, 'Empty landmark properly triggers validation error');

  console.log(`\n--- Verification Results: ${passed} Passed, ${failed} Failed ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
