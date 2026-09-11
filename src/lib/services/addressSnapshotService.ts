/**
 * Module 11 Task 8: Immutable Address Snapshot & Order Freeze Engine
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 31, 32, 33, 34, 35, 36):
 * - Frozen immutable snapshot creation for orders.shipping_address_snapshot (Item 31, 32)
 * - Complete granular snapshot data structure with checksum protection (Item 33)
 * - Merchant and Courier packaging label formatting (Item 34)
 * - Post-dispatch strict security lock to prevent theft and transit diversion (Item 35)
 * - Pre-dispatch address correction with versioned audit trail (Item 36)
 */

import crypto from 'crypto';
import {
  sanitizeInputString,
  combineStreetAddress,
  formatAddressSingleLine,
} from '@/lib/validations/address';
import { calculateAddressShippingFee } from '@/lib/services/pincodeService';
import type {
  CustomerAddress,
  AddressFormData,
  AddressSnapshot,
  AddressSnapshotAuditEntry,
  AddressType,
} from '@/types/address';

/**
 * Permitted order states where delivery address modification is allowed (Item 36)
 */
export const PRE_DISPATCH_ORDER_STATUSES = new Set([
  'placed',
  'confirmed',
  'pending',
  'processing',
  'packing',
  'order_received',
]);

/**
 * Locked order states where delivery address modification is strictly blocked (Item 35)
 */
export const LOCKED_ORDER_STATUSES = new Set([
  'dispatched',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
  'rto_initiated',
]);

/**
 * Parameters for creating a frozen order address snapshot
 */
export interface FreezeAddressParams {
  address: CustomerAddress | AddressFormData;
  orderId: string;
  isGiftDelivery?: boolean;
  giftMessage?: string | null;
  deliveryOtpRequired?: boolean;
}

/**
 * Result of attempting to modify an order's delivery address
 */
export interface AddressSnapshotUpdateResult {
  success: boolean;
  error?: string;
  errorBn?: string;
  updatedSnapshot?: AddressSnapshot;
  auditEntry?: AddressSnapshotAuditEntry;
  pincodeChanged?: boolean;
  newZone?: string;
}

/**
 * Formatted shipping label representation for courier packaging
 */
export interface FormattedShippingLabelData {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  alternatePhone: string | null;
  formattedAddress: string;
  streetAddress: string;
  landmark: string;
  prominentLandmark: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  zone: string;
  boldInstructions: string[];
  isGift: boolean;
  giftMessage: string | null;
  pincodeBarcodeData: string;
  addressIdBarcodeData: string;
}

/**
 * Formatted tax invoice address block
 */
export interface FormattedInvoiceAddressData {
  recipientName: string;
  recipientPhone: string;
  streetAddress: string;
  cityStatePincode: string;
  state: string;
  gstStateCode: string;
  isGiftOrder: boolean;
}

/**
 * Generates a tamper-evident SHA-256 checksum for critical address snapshot fields
 */
export function generateSnapshotChecksum(data: {
  recipient_name: string;
  recipient_phone: string;
  street_address: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
}): string {
  const content = [
    data.recipient_name.trim().toLowerCase(),
    data.recipient_phone.trim(),
    data.street_address.trim().toLowerCase(),
    data.landmark.trim().toLowerCase(),
    data.pincode.trim(),
    data.city.trim().toLowerCase(),
    data.state.trim().toLowerCase(),
  ].join('|');

  return crypto.createHash('sha256').update(content, 'utf8').digest('hex').substring(0, 16);
}

/**
 * Freezes a customer address into an immutable, self-contained snapshot for order placement (Items 31-33).
 * Even if the customer later modifies or soft-deletes their address from their profile,
 * this snapshot remains 100% frozen in orders.shipping_address_snapshot.
 */
export function freezeAddressForOrder(params: FreezeAddressParams): AddressSnapshot {
  const { address, orderId, isGiftDelivery = false, giftMessage = null, deliveryOtpRequired = true } = params;

  const line1 = 'address_line1' in address && address.address_line1 ? address.address_line1 : '';
  const line2 = 'address_line2' in address && address.address_line2 ? address.address_line2 : '';
  const street_address =
    'street_address' in address && address.street_address
      ? address.street_address
      : combineStreetAddress(line1, line2);

  const cleanName = sanitizeInputString(address.recipient_name);
  const cleanPhone = address.recipient_phone.trim();
  const cleanAltPhone = address.alternate_phone?.trim() || null;
  const cleanLandmark = sanitizeInputString(address.landmark);
  const cleanCity = sanitizeInputString(address.city);
  const cleanDistrict = sanitizeInputString(address.district);
  const cleanState = sanitizeInputString(address.state);
  const cleanPincode = address.pincode.trim();

  const estimate = calculateAddressShippingFee(cleanPincode, 0);

  const checksum = generateSnapshotChecksum({
    recipient_name: cleanName,
    recipient_phone: cleanPhone,
    street_address,
    landmark: cleanLandmark,
    pincode: cleanPincode,
    city: cleanCity,
    state: cleanState,
  });

  return {
    order_id: orderId,
    recipient_name: cleanName,
    recipient_phone: cleanPhone,
    alternate_phone: cleanAltPhone,
    street_address,
    address_line1: line1,
    address_line2: line2,
    landmark: cleanLandmark,
    city: cleanCity,
    district: cleanDistrict,
    state: cleanState,
    pincode: cleanPincode,
    address_type: address.address_type as AddressType,
    delivery_preferences: address.delivery_preferences || null,
    delivery_otp_required: deliveryOtpRequired,
    is_gift_delivery: isGiftDelivery,
    gift_message: isGiftDelivery && giftMessage ? sanitizeInputString(giftMessage) : null,
    zone: estimate.zone,
    snapshot_version: 1,
    snapshot_checksum: checksum,
    snapshot_timestamp: new Date().toISOString(),
    snapshot_history: [],
  };
}

/**
 * Checks whether an order's shipping address is eligible for correction (Item 35 & 36).
 * Post-dispatch statuses (dispatched, in_transit, out_for_delivery, delivered) are strictly locked.
 */
export function verifyAddressModifiability(orderStatus: string): {
  canModify: boolean;
  reason?: string;
  reasonBn?: string;
} {
  const normalized = orderStatus.trim().toLowerCase();

  if (LOCKED_ORDER_STATUSES.has(normalized)) {
    return {
      canModify: false,
      reason: `Address cannot be modified once the order has reached "${orderStatus}" status.`,
      reasonBn: `পার্সেল কুরিয়ার পার্টনারের কাছে হস্তান্তরিত (${orderStatus}) হওয়ার পর রুট পরিবর্তন বা ঠিকানা সংশোধন নিরাপত্তা কারণে কঠোরভাবে নিষিদ্ধ।`,
    };
  }

  if (PRE_DISPATCH_ORDER_STATUSES.has(normalized)) {
    return { canModify: true };
  }

  return {
    canModify: false,
    reason: `Unknown order status "${orderStatus}". Address modifications disallowed for security.`,
    reasonBn: `অর্ডারের স্ট্যাটাস "${orderStatus}" সনাক্ত করা যায়নি। নিরাপত্তার স্বার্থে ঠিকানা পরিবর্তন স্থগিত রাখা হয়েছে।`,
  };
}

/**
 * Updates an order's address before dispatch, maintaining a strict audit history (Item 36).
 * If the order is already dispatched, rejects the request immediately (Item 35).
 */
export function requestPreDispatchAddressUpdate(
  currentSnapshot: AddressSnapshot,
  updatedData: AddressFormData | CustomerAddress,
  orderStatus: string,
  changeReason: string,
  changedBy: 'customer' | 'admin' = 'customer'
): AddressSnapshotUpdateResult {
  // 1. Verify modifiability security lock
  const check = verifyAddressModifiability(orderStatus);
  if (!check.canModify) {
    return {
      success: false,
      error: check.reason,
      errorBn: check.reasonBn,
    };
  }

  // 2. Prepare previous snapshot copy for audit log
  const currentVersion = currentSnapshot.snapshot_version || 1;
  const auditEntry: AddressSnapshotAuditEntry = {
    version: currentVersion,
    previous_snapshot: { ...currentSnapshot },
    change_reason: sanitizeInputString(changeReason),
    changed_by: changedBy,
    changed_at: new Date().toISOString(),
  };

  // 3. Build updated fields
  const line1 = 'address_line1' in updatedData && updatedData.address_line1 ? updatedData.address_line1 : '';
  const line2 = 'address_line2' in updatedData && updatedData.address_line2 ? updatedData.address_line2 : '';
  const newStreet =
    'street_address' in updatedData && updatedData.street_address
      ? updatedData.street_address
      : combineStreetAddress(line1, line2);

  const cleanName = sanitizeInputString(updatedData.recipient_name);
  const cleanPhone = updatedData.recipient_phone.trim();
  const cleanAltPhone = updatedData.alternate_phone?.trim() || null;
  const cleanLandmark = sanitizeInputString(updatedData.landmark);
  const cleanCity = sanitizeInputString(updatedData.city);
  const cleanDistrict = sanitizeInputString(updatedData.district);
  const cleanState = sanitizeInputString(updatedData.state);
  const cleanPincode = updatedData.pincode.trim();

  const estimate = calculateAddressShippingFee(cleanPincode, 0);
  const pincodeChanged = currentSnapshot.pincode !== cleanPincode;

  const newChecksum = generateSnapshotChecksum({
    recipient_name: cleanName,
    recipient_phone: cleanPhone,
    street_address: newStreet,
    landmark: cleanLandmark,
    pincode: cleanPincode,
    city: cleanCity,
    state: cleanState,
  });

  const updatedHistory = [...(currentSnapshot.snapshot_history || []), auditEntry];

  const updatedSnapshot: AddressSnapshot = {
    ...currentSnapshot,
    recipient_name: cleanName,
    recipient_phone: cleanPhone,
    alternate_phone: cleanAltPhone,
    street_address: newStreet,
    address_line1: line1,
    address_line2: line2,
    landmark: cleanLandmark,
    city: cleanCity,
    district: cleanDistrict,
    state: cleanState,
    pincode: cleanPincode,
    address_type: updatedData.address_type as AddressType,
    delivery_preferences: updatedData.delivery_preferences || currentSnapshot.delivery_preferences,
    zone: estimate.zone,
    snapshot_version: currentVersion + 1,
    snapshot_checksum: newChecksum,
    snapshot_timestamp: new Date().toISOString(),
    snapshot_history: updatedHistory,
  };

  return {
    success: true,
    updatedSnapshot,
    auditEntry,
    pincodeChanged,
    newZone: estimate.zone,
  };
}

/**
 * Formats a frozen address snapshot for printing on the physical courier shipping label (Item 18, 34, 49).
 */
export function formatSnapshotForShippingLabel(snapshot: AddressSnapshot): FormattedShippingLabelData {
  const instructions: string[] = [];
  if (snapshot.delivery_preferences?.callBeforeDelivery) {
    instructions.push('CALL BEFORE DELIVERY');
  }
  if (snapshot.delivery_preferences?.leaveWithSecurity) {
    instructions.push('LEAVE AT GATE / CARETAKER');
  }
  if (snapshot.delivery_preferences?.doNotRingBell) {
    instructions.push('DO NOT RING BELL');
  }
  if (snapshot.delivery_preferences?.isWeekendClosed) {
    instructions.push('WEEKEND CLOSED (OFFICE)');
  }
  if (snapshot.delivery_preferences?.preferredTimeSlot === 'morning_10_to_1') {
    instructions.push('SLOT: 10 AM - 1 PM');
  } else if (snapshot.delivery_preferences?.preferredTimeSlot === 'evening_4_to_7') {
    instructions.push('SLOT: 4 PM - 7 PM');
  }

  const prominentLandmark = snapshot.landmark ? `🚩 LANDMARK: Near ${snapshot.landmark.toUpperCase()}` : '';

  return {
    orderId: snapshot.order_id || 'MM-ORD',
    recipientName: snapshot.recipient_name,
    recipientPhone: snapshot.recipient_phone,
    alternatePhone: snapshot.alternate_phone || null,
    formattedAddress: formatAddressSingleLine(snapshot),
    streetAddress: snapshot.street_address,
    landmark: snapshot.landmark,
    prominentLandmark,
    city: snapshot.city,
    district: snapshot.district,
    state: snapshot.state,
    pincode: snapshot.pincode,
    zone: snapshot.zone || 'regional_wb',
    boldInstructions: instructions,
    isGift: Boolean(snapshot.is_gift_delivery),
    giftMessage: snapshot.gift_message || null,
    pincodeBarcodeData: `PIN:${snapshot.pincode}`,
    addressIdBarcodeData: `ORD:${snapshot.order_id || 'ORD'}-V${snapshot.snapshot_version || 1}`,
  };
}

/**
 * Formats a frozen address snapshot for official GST tax invoices (Item 32).
 */
export function formatSnapshotForInvoice(snapshot: AddressSnapshot): FormattedInvoiceAddressData {
  const STATE_GST_CODES: Record<string, string> = {
    'west bengal': '19',
    bihar: '10',
    jharkhand: '20',
    assam: '18',
    delhi: '07',
    odisha: '21',
  };

  const normState = snapshot.state.trim().toLowerCase();
  const gstCode = STATE_GST_CODES[normState] || '19';

  return {
    recipientName: snapshot.recipient_name,
    recipientPhone: snapshot.recipient_phone,
    streetAddress: snapshot.street_address,
    cityStatePincode: `${snapshot.city}, ${snapshot.state} - ${snapshot.pincode}`,
    state: snapshot.state,
    gstStateCode: gstCode,
    isGiftOrder: Boolean(snapshot.is_gift_delivery),
  };
}

/**
 * Generates direct Google Maps and WhatsApp contact URLs for delivery riders (Item 48).
 */
export function generateNavigationUrls(snapshot: AddressSnapshot): {
  googleMapsUrl: string;
  whatsAppUrl: string;
} {
  const query = `${snapshot.street_address}, ${snapshot.landmark ? snapshot.landmark + ', ' : ''}${snapshot.city} ${snapshot.pincode}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const cleanPhone = snapshot.recipient_phone.replace(/\D/g, '');
  const message = `নমস্কার ${snapshot.recipient_name}, M.M Book House Malda থেকে আপনার অর্ডারের বই নিয়ে ডেলিভারি রাইডার আপনার ঠিকানায় আসছেন।`;
  const whatsAppUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;

  return { googleMapsUrl, whatsAppUrl };
}
