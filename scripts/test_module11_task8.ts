/**
 * Automated Verification Script for Module 11 Task 8:
 * Immutable Address Snapshot & Order Freeze Engine
 * 
 * Verifies architectural specifications from proposed_modules.md (Module 11, Items 31, 32, 33, 34, 35, 36):
 * 1. freezeAddressForOrder: Granular data freeze with SHA-256 checksum (Item 31-33)
 * 2. Immutability guarantee: Profile address mutations do not mutate past order snapshots (Item 31)
 * 3. verifyAddressModifiability: Strict post-dispatch security lock (Item 35)
 * 4. requestPreDispatchAddressUpdate: Versioned audit trail in packing state (Item 36)
 * 5. formatSnapshotForShippingLabel: Bold instructions & landmark formatting (Item 18, 34, 49)
 * 6. formatSnapshotForInvoice: GST invoice address block & state code 19 (Item 32)
 * 7. generateNavigationUrls: Google Maps & WhatsApp rider links (Item 48)
 */

import {
  freezeAddressForOrder,
  verifyAddressModifiability,
  requestPreDispatchAddressUpdate,
  formatSnapshotForShippingLabel,
  formatSnapshotForInvoice,
  generateNavigationUrls,
  generateSnapshotChecksum,
} from '../src/lib/services/addressSnapshotService';
import type { CustomerAddress, AddressFormData } from '../src/types/address';

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

async function runTask8Tests() {
  console.log('\n======================================================');
  console.log('🧪 Testing Module 11 Task 8: Address Snapshot Engine');
  console.log('======================================================\n');

  // --- Suite 1: Granular Snapshot Freeze & Checksum (Items 31-33) ---
  console.log('--- Suite 1: Granular Snapshot Freeze & Checksum (Items 31-33) ---');

  const sourceAddress: CustomerAddress = {
    id: 'addr-source-1',
    user_id: 'user-sabir-101',
    recipient_name: 'Sabir Hossain',
    recipient_phone: '9832145678',
    alternate_phone: '9434012345',
    address_line1: 'Flat 3B, Sunshine Apartments',
    address_line2: 'Foara More, Netaji Subhash Road',
    street_address: 'Flat 3B, Sunshine Apartments, Foara More, Netaji Subhash Road',
    landmark: 'Opposite Gour College Main Gate',
    city: 'Malda',
    district: 'Malda',
    state: 'West Bengal',
    pincode: '732101',
    address_type: 'home',
    is_default: true,
    delivery_preferences: {
      callBeforeDelivery: true,
      leaveWithSecurity: false,
      preferredTimeSlot: 'morning_10_to_1',
    },
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-10T10:00:00Z',
  };

  const frozenSnapshot = freezeAddressForOrder({
    address: sourceAddress,
    orderId: 'MM-ORD-2026-0099',
    isGiftDelivery: true,
    giftMessage: 'Best wishes for WBCS exam preparation!',
  });

  assert(frozenSnapshot.order_id === 'MM-ORD-2026-0099', 'Snapshot links correctly to order ID');
  assert(frozenSnapshot.recipient_name === 'Sabir Hossain', 'Recipient name preserved');
  assert(frozenSnapshot.recipient_phone === '9832145678', 'Primary phone preserved');
  assert(frozenSnapshot.alternate_phone === '9434012345', 'Alternate phone preserved');
  assert(frozenSnapshot.landmark === 'Opposite Gour College Main Gate', 'Landmark preserved');
  assert(frozenSnapshot.pincode === '732101', 'Pincode preserved');
  assert(frozenSnapshot.zone === 'malda_town', 'Malda Town delivery zone recognized');
  assert(frozenSnapshot.snapshot_version === 1, 'Initial snapshot version is 1');
  assert(frozenSnapshot.is_gift_delivery === true, 'Gift delivery flag set');
  assert(frozenSnapshot.gift_message === 'Best wishes for WBCS exam preparation!', 'Gift message recorded');
  assert(typeof frozenSnapshot.snapshot_checksum === 'string' && frozenSnapshot.snapshot_checksum.length === 16, 'SHA-256 checksum generated');
  assert(Array.isArray(frozenSnapshot.snapshot_history) && frozenSnapshot.snapshot_history.length === 0, 'Initial audit history is empty');

  // --- Suite 2: Immutability Guarantee (Item 31 & 32) ---
  console.log('\n--- Suite 2: Immutability Guarantee Against Profile Address Mutation ---');

  // Mutate source profile address drastically
  sourceAddress.recipient_name = 'Completely Different Name';
  sourceAddress.street_address = 'Moved to New City, Delhi';
  sourceAddress.pincode = '110001';
  sourceAddress.landmark = 'Near Red Fort';

  assert(frozenSnapshot.recipient_name === 'Sabir Hossain', 'Frozen snapshot recipient name remains unchanged');
  assert(frozenSnapshot.street_address.includes('Sunshine Apartments'), 'Frozen street address remains intact');
  assert(frozenSnapshot.pincode === '732101', 'Frozen pincode remains Malda Town 732101');
  assert(frozenSnapshot.landmark === 'Opposite Gour College Main Gate', 'Frozen landmark remains unchanged');

  // --- Suite 3: Post-Dispatch Security Lock (Item 35) ---
  console.log('\n--- Suite 3: Post-Dispatch Security Lock (Item 35) ---');

  // Allowed statuses
  assert(verifyAddressModifiability('placed').canModify === true, 'Order in "placed" state can be modified');
  assert(verifyAddressModifiability('confirmed').canModify === true, 'Order in "confirmed" state can be modified');
  assert(verifyAddressModifiability('packing').canModify === true, 'Order in "packing" state can be modified');
  assert(verifyAddressModifiability('processing').canModify === true, 'Order in "processing" state can be modified');

  // Locked statuses
  const dispatchedCheck = verifyAddressModifiability('dispatched');
  assert(dispatchedCheck.canModify === false, 'Order in "dispatched" state is strictly locked');
  assert(dispatchedCheck.reason?.includes('cannot be modified') === true, 'Provides English security error');
  assert(dispatchedCheck.reasonBn?.includes('নিরাপত্তা কারণে কঠোরভাবে নিষিদ্ধ') === true, 'Provides Bengali security error');

  assert(verifyAddressModifiability('in_transit').canModify === false, '"in_transit" order is locked');
  assert(verifyAddressModifiability('out_for_delivery').canModify === false, '"out_for_delivery" order is locked');
  assert(verifyAddressModifiability('delivered').canModify === false, '"delivered" order is locked');
  assert(verifyAddressModifiability('cancelled').canModify === false, '"cancelled" order is locked');

  // Attempt to update dispatched order
  const illegalUpdateResult = requestPreDispatchAddressUpdate(
    frozenSnapshot,
    {
      ...sourceAddress,
      recipient_name: 'Hacker Diversion',
      street_address: 'Fake Transit Hub',
    },
    'dispatched',
    'Customer wants diversion'
  );
  assert(illegalUpdateResult.success === false, 'Address update on dispatched order is rejected');
  assert(illegalUpdateResult.error?.includes('dispatched') === true, 'Rejection explains dispatch lock');

  // --- Suite 4: Pre-Dispatch Address Correction & Audit Trail (Item 36) ---
  console.log('\n--- Suite 4: Pre-Dispatch Address Correction & Audit Trail (Item 36) ---');

  const correctionResult = requestPreDispatchAddressUpdate(
    frozenSnapshot,
    {
      recipient_name: 'Sabir Hossain (Updated)',
      recipient_phone: '9832145678',
      address_line1: 'Flat 3B, Sunshine Apartments',
      address_line2: 'Foara More, Near Post Office',
      landmark: 'Near New Bus Stand Gate',
      city: 'Malda',
      district: 'Malda',
      state: 'West Bengal',
      pincode: '732101',
      address_type: 'home',
      is_default: true,
      delivery_preferences: {
        callBeforeDelivery: true,
        leaveWithSecurity: true,
      },
    },
    'packing', // Permitted state
    'Corrected landmark for delivery ease',
    'customer'
  );

  assert(correctionResult.success === true, 'Pre-dispatch address update succeeds');
  const v2 = correctionResult.updatedSnapshot!;
  assert(v2.snapshot_version === 2, 'Snapshot version incremented to 2');
  assert(v2.landmark === 'Near New Bus Stand Gate', 'Updated landmark is saved');
  assert(v2.snapshot_checksum !== frozenSnapshot.snapshot_checksum, 'New checksum generated for modified content');
  assert(v2.snapshot_history?.length === 1, 'Audit history contains 1 prior record');
  assert(v2.snapshot_history?.[0].version === 1, 'Audit log records version 1 as prior');
  assert(v2.snapshot_history?.[0].previous_snapshot.landmark === 'Opposite Gour College Main Gate', 'Original landmark preserved in audit log');
  assert(v2.snapshot_history?.[0].change_reason === 'Corrected landmark for delivery ease', 'Change reason saved');
  assert(v2.snapshot_history?.[0].changed_by === 'customer', 'Actor saved as customer');

  // --- Suite 5: Shipping Label Formatting (Items 18, 34, 49) ---
  console.log('\n--- Suite 5: Shipping Label Formatting (Items 18, 34, 49) ---');

  const labelData = formatSnapshotForShippingLabel(v2);
  assert(labelData.orderId === 'MM-ORD-2026-0099', 'Label order ID matches');
  assert(labelData.prominentLandmark.includes('NEAR NEW BUS STAND GATE'), 'Prominent landmark capitalized with flag icon');
  assert(labelData.boldInstructions.includes('CALL BEFORE DELIVERY'), 'Includes CALL BEFORE DELIVERY instruction');
  assert(labelData.boldInstructions.includes('LEAVE AT GATE / CARETAKER'), 'Includes LEAVE AT GATE instruction');
  assert(labelData.pincodeBarcodeData === 'PIN:732101', 'Pincode barcode string formatted');
  assert(labelData.addressIdBarcodeData === 'ORD:MM-ORD-2026-0099-V2', 'Order version barcode string formatted');

  // --- Suite 6: GST Invoice Formatting (Item 32) ---
  console.log('\n--- Suite 6: GST Tax Invoice Formatting (Item 32) ---');

  const invoiceData = formatSnapshotForInvoice(v2);
  assert(invoiceData.recipientName === 'Sabir Hossain (Updated)', 'Invoice recipient name formatted');
  assert(invoiceData.gstStateCode === '19', 'West Bengal GST state code is 19');
  assert(invoiceData.cityStatePincode.includes('732101'), 'Invoice line contains pincode');

  // --- Suite 7: Rider Navigation & WhatsApp URL Generation (Item 48) ---
  console.log('\n--- Suite 7: Rider Navigation & WhatsApp URL Generation (Item 48) ---');

  const navUrls = generateNavigationUrls(v2);
  assert(navUrls.googleMapsUrl.includes('google.com/maps/search'), 'Valid Google Maps URL generated');
  assert(navUrls.googleMapsUrl.includes('732101'), 'Google Maps search query includes pincode');
  assert(navUrls.whatsAppUrl.includes('wa.me/919832145678'), 'WhatsApp URL points to recipient phone');
  assert(decodeURIComponent(navUrls.whatsAppUrl).includes('M.M Book House'), 'WhatsApp message contains store branding');

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED FOR TASK 8!`);
  console.log('======================================================\n');
}

runTask8Tests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
