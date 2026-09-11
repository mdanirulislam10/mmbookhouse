/**
 * Automated Verification Script for Module 11 Task 10:
 * Admin & Seller Merchant Shipping Address Action Card
 * 
 * Verifies architectural specifications from proposed_modules.md (Module 11, Items 34, 35, 48, 50):
 * 1. AdminShippingAddressCard export and contract verification (Item 48)
 * 2. 1-Click Google Maps & WhatsApp navigation URL verification (Item 48)
 * 3. Pre-dispatch editable vs post-dispatch locked action buttons (Item 35 & 36)
 * 4. Highlighting of landmarks for 90% RTO reduction (Item 50)
 * 5. Integrated shipping label data binding (Item 34)
 */

import { AdminShippingAddressCard } from '../src/components/admin/AdminShippingAddressCard';
import {
  generateNavigationUrls,
  verifyAddressModifiability,
  formatSnapshotForShippingLabel,
} from '../src/lib/services/addressSnapshotService';
import type { AddressSnapshot } from '../src/types/address';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTask10Tests() {
  console.log('\n======================================================');
  console.log('🧪 Testing Module 11 Task 10: Admin Shipping Card');
  console.log('======================================================\n');

  // --- Suite 1: Component Export & Contract (Item 48) ---
  console.log('--- Suite 1: Component Export & Contract (Item 48) ---');
  assert(typeof AdminShippingAddressCard === 'function', 'AdminShippingAddressCard is exported as a React Component');

  const mockSnapshot: AddressSnapshot = {
    order_id: 'MM-ORD-2026-7788',
    recipient_name: 'Tanvir Alam',
    recipient_phone: '9832145678',
    alternate_phone: '9434012345',
    street_address: 'Holding 42, Rathbari More, Main Road',
    address_line1: 'Holding 42',
    address_line2: 'Rathbari More, Main Road',
    landmark: 'Beside Rathbari Flyover Pillar 12',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    pincode: '732101',
    address_type: 'work',
    zone: 'malda_town',
    delivery_otp_required: true,
    is_gift_delivery: false,
    snapshot_version: 1,
    snapshot_checksum: 'a1b2c3d4e5f67890',
    snapshot_timestamp: '2026-09-10T12:00:00Z',
    delivery_preferences: {
      callBeforeDelivery: true,
      leaveWithSecurity: true,
      isWeekendClosed: true,
    },
  };

  // --- Suite 2: Merchant 1-Click Action URLs (Item 48) ---
  console.log('\n--- Suite 2: Merchant 1-Click Action URLs (Item 48) ---');
  const urls = generateNavigationUrls(mockSnapshot);

  assert(urls.googleMapsUrl.includes('google.com/maps/search'), 'Google Maps URL is valid');
  assert(urls.googleMapsUrl.includes('Rathbari'), 'Google Maps search query includes street address');
  assert(urls.googleMapsUrl.includes('732101'), 'Google Maps query includes destination pincode');
  assert(urls.whatsAppUrl.includes('wa.me/919832145678'), 'WhatsApp URL points directly to recipient phone');
  assert(decodeURIComponent(urls.whatsAppUrl).includes('Tanvir Alam'), 'WhatsApp greeting addresses customer by name');

  // --- Suite 3: Pre-dispatch vs Post-dispatch State Logic (Item 35 & 36) ---
  console.log('\n--- Suite 3: Pre-dispatch vs Post-dispatch State Logic (Item 35 & 36) ---');

  // Pre-dispatch state: Editable
  const packingState = verifyAddressModifiability('packing');
  assert(packingState.canModify === true, 'In packing state, admin is allowed to edit address');

  const pendingState = verifyAddressModifiability('pending');
  assert(pendingState.canModify === true, 'In pending state, address modification is allowed');

  // Post-dispatch state: Locked
  const dispatchedState = verifyAddressModifiability('dispatched');
  assert(dispatchedState.canModify === false, 'In dispatched state, address modification is locked');
  assert(dispatchedState.reasonBn?.includes('কঠোরভাবে নিষিদ্ধ') === true, 'Bengali security reason provided for dispatch lock');

  const inTransitState = verifyAddressModifiability('in_transit');
  assert(inTransitState.canModify === false, 'In in_transit state, address modification is locked');

  // --- Suite 4: Landmark Highlighting for 90% RTO Reduction (Item 50) ---
  console.log('\n--- Suite 4: Landmark Highlighting for 90% RTO Reduction (Item 50) ---');
  const label = formatSnapshotForShippingLabel(mockSnapshot);

  assert(label.landmark === 'Beside Rathbari Flyover Pillar 12', 'Landmark is preserved accurately');
  assert(label.prominentLandmark.includes('BESIDE RATHBARI FLYOVER PILLAR 12'), 'Prominent landmark is capitalized for clear courier visibility');
  assert(label.boldInstructions.includes('CALL BEFORE DELIVERY'), 'Call before delivery instruction is extracted');
  assert(label.boldInstructions.includes('WEEKEND CLOSED (OFFICE)'), 'Weekend closed flag is extracted');

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED FOR TASK 10!`);
  console.log('======================================================\n');
}

runTask10Tests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
