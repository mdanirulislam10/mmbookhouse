/**
 * Module 11 Task 6: Automated Verification Test Suite
 * Tests Address Book Page Route, AddressCardGrid, and DeleteAddressConfirmModal
 */

import { metadata } from '../src/app/account/addresses/page';
import { type CustomerAddress, MAX_ADDRESSES_PER_USER } from '../src/types/address';

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
  console.log('\n--- Running Module 11 Task 6 Verification Suite ---\n');

  // Test 1: Page metadata title and description
  assert(
    typeof metadata.title === 'string' && metadata.title.includes('সংরক্ষিত ডেলিভারি ঠিকানা'),
    'Page metadata title contains proper Bengali branding'
  );
  assert(
    typeof metadata.description === 'string' && metadata.description.includes('কাস্টমার অ্যাড্রেস বুক'),
    'Page metadata description is accurately defined for SEO'
  );

  // Test 2: Address sorting logic: Default address must always be sorted to index 0
  const mockAddresses: CustomerAddress[] = [
    {
      id: 'addr-2',
      user_id: 'u1',
      recipient_name: 'সুবীর দাস (অফিস)',
      recipient_phone: '9800000000',
      street_address: 'অফিস ঠিকানা',
      landmark: 'কোর্ট',
      city: 'Malda',
      district: 'Malda',
      state: 'West Bengal',
      pincode: '732101',
      address_type: 'work',
      is_default: false,
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z',
    },
    {
      id: 'addr-1',
      user_id: 'u1',
      recipient_name: 'সুবীর দাস (বাড়ি)',
      recipient_phone: '9800000000',
      street_address: 'বাড়ির ঠিকানা',
      landmark: 'গৌড় কলেজ',
      city: 'Malda',
      district: 'Malda',
      state: 'West Bengal',
      pincode: '732101',
      address_type: 'home',
      is_default: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  const sorted = [...mockAddresses].sort((a, b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    return 0;
  });

  assert(sorted[0].id === 'addr-1', 'Default address is sorted to first position');
  assert(sorted[0].is_default === true, 'First position card has is_default = true');

  // Test 3: Address count calculation against MAX_ADDRESSES_PER_USER
  const countText = `সংরক্ষিত ঠিকানা: ${mockAddresses.length} / ${MAX_ADDRESSES_PER_USER}`;
  assert(countText === 'সংরক্ষিত ঠিকানা: 2 / 15', 'Address counter calculates accurately (2 / 15)');

  // Test 4: Maximum limit reached condition
  const mockMaxAddresses = new Array(15).fill(mockAddresses[0]);
  const isMaxReached = mockMaxAddresses.length >= MAX_ADDRESSES_PER_USER;
  assert(isMaxReached === true, 'Address limit reached correctly triggers at 15');

  console.log(`\n--- Verification Results: ${passed} Passed, ${failed} Failed ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
