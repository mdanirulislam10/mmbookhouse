/**
 * Module 11 Task 5: Automated Verification Test Suite
 * Tests Server Actions: getCustomerAddresses, addCustomerAddress, updateCustomerAddress,
 * setDefaultAddress, deleteCustomerAddress, 15-Address Limit, and Soft-Delete Auto-Promotion
 */

import {
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  setDefaultAddress,
  deleteCustomerAddress,
} from '../src/actions/address';
import { type AddressFormData, MAX_ADDRESSES_PER_USER } from '../src/types/address';

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
  console.log('\n--- Running Module 11 Task 5 Verification Suite ---\n');

  const testUserId = `test-user-${Date.now()}`;

  // Test 1: Fetch initial addresses for new user (empty initially)
  const initial = await getCustomerAddresses(testUserId);
  assert(Array.isArray(initial), 'getCustomerAddresses returns an array');

  // Test 2: Add first address -> must automatically become default
  const firstAddressInput: AddressFormData = {
    recipient_name: 'সুবীর দাস',
    recipient_phone: '9832112233',
    address_line1: 'Flat 3B, আনন্দম অ্যাপার্টমেন্ট',
    address_line2: 'রথবাড়ি মোড়',
    landmark: 'গৌড় কলেজ মেন গেট',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    pincode: '732101',
    address_type: 'home',
    is_default: false, // Even if false, first address MUST be auto-promoted to default
  };

  const addRes1 = await addCustomerAddress(firstAddressInput, testUserId);
  assert(addRes1.success === true && addRes1.data !== undefined, 'addCustomerAddress creates first address');
  assert(addRes1.data?.is_default === true, 'First address is automatically assigned as default');
  const firstAddrId = addRes1.data!.id;

  // Test 3: Add second address with is_default = true -> should switch default
  const secondAddressInput: AddressFormData = {
    recipient_name: 'সুবীর দাস (অফিস)',
    recipient_phone: '9832112233',
    address_line1: 'জেলা আদালত চত্বর, চেম্বার ৪',
    address_line2: 'ফোয়ারা মোড়',
    landmark: 'পোস্ট অফিস সংলগ্ন',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    pincode: '732101',
    address_type: 'work',
    is_default: true,
  };

  const addRes2 = await addCustomerAddress(secondAddressInput, testUserId);
  assert(addRes2.success === true && addRes2.data?.is_default === true, 'Second address added as default');
  const secondAddrId = addRes2.data!.id;

  // Check that first address is no longer default
  const listAfterAdd2 = await getCustomerAddresses(testUserId);
  const checkFirst = listAfterAdd2.find((a) => a.id === firstAddrId);
  const checkSecond = listAfterAdd2.find((a) => a.id === secondAddrId);
  assert(checkSecond?.is_default === true, 'Second address is default');
  assert(checkFirst?.is_default === false, 'First address default was automatically unset');

  // Test 4: 1-Click Set as Default Switch
  const switchRes = await setDefaultAddress(firstAddrId, testUserId);
  assert(switchRes.success === true, 'setDefaultAddress returns success');
  const listAfterSwitch = await getCustomerAddresses(testUserId);
  assert(
    listAfterSwitch.find((a) => a.id === firstAddrId)?.is_default === true &&
      listAfterSwitch.find((a) => a.id === secondAddrId)?.is_default === false,
    '1-click default switch successfully swapped the default address'
  );

  // Test 5: Update an existing address
  const updateRes = await updateCustomerAddress(
    firstAddrId,
    {
      ...firstAddressInput,
      recipient_name: 'সুবীর রঞ্জন দাস',
      landmark: 'গৌড় কলেজ গেট ও পুলিশ ফাঁড়ির মাঝে',
      is_default: true,
    },
    testUserId
  );
  assert(updateRes.success === true, 'updateCustomerAddress succeeds');
  assert(
    updateRes.data?.recipient_name === 'সুবীর রঞ্জন দাস' &&
      updateRes.data?.landmark.includes('পুলিশ ফাঁড়ি'),
    'Updated name and landmark are saved properly'
  );

  // Test 6: Soft Delete & Auto-promotion of new default
  // Currently firstAddrId is default. If we delete it, secondAddrId should become new default!
  const deleteRes = await deleteCustomerAddress(firstAddrId, testUserId);
  assert(deleteRes.success === true, 'deleteCustomerAddress soft-deletes successfully');
  assert(
    deleteRes.newDefaultId === secondAddrId,
    'Auto-promotes remaining active address to become new default'
  );

  const listAfterDelete = await getCustomerAddresses(testUserId);
  assert(listAfterDelete.length === 1, 'Only 1 active address remains in list');
  assert(listAfterDelete[0].id === secondAddrId, 'Remaining address is secondAddrId');
  assert(listAfterDelete[0].is_default === true, 'Remaining address is now default');

  // Test 7: Max 15 addresses limit
  console.log('Testing 15 addresses limit...');
  const limitUserId = `limit-user-${Date.now()}`;
  for (let i = 1; i <= MAX_ADDRESSES_PER_USER; i++) {
    const res = await addCustomerAddress(
      {
        recipient_name: `কাস্টমার ${i}`,
        recipient_phone: '9832000000',
        address_line1: `বাড়ি নম্বর ${i}`,
        address_line2: 'টেস্ট রোড',
        landmark: 'টেস্ট ল্যান্ডমার্ক',
        city: 'Malda',
        district: 'Malda',
        state: 'West Bengal',
        pincode: '732101',
        address_type: 'home',
        is_default: false,
      },
      limitUserId
    );
    assert(res.success === true, `Address ${i} of 15 added successfully`);
  }

  // 16th address should be rejected
  const overflowRes = await addCustomerAddress(
    {
      recipient_name: 'কাস্টমার ১৬ (অতিরিক্ত)',
      recipient_phone: '9832000000',
      address_line1: 'বাড়ি নম্বর ১৬',
      address_line2: 'টেস্ট রোড',
      landmark: 'টেস্ট ল্যান্ডমার্ক',
      city: 'Malda',
      district: 'Malda',
      state: 'West Bengal',
      pincode: '732101',
      address_type: 'home',
      is_default: false,
    },
    limitUserId
  );
  assert(!overflowRes.success, '16th address is correctly rejected exceeding 15 limit');
  assert(
    Boolean(overflowRes.error?.includes('১৫')),
    'Rejection error explains the 15-address limit clearly'
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
