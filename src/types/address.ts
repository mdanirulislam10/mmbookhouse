/**
 * Module 11: Customer Address Book & Delivery Intelligence Engine
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 1-50):
 * - 7 Mandatory Fields (Item 1)
 * - Optional Alternate Mobile (Item 5)
 * - HTML5 Browser Autofill attributes (Item 6)
 * - Strict Zod schema & input sanitization (Item 9)
 * - 4 Address Categories: Home, Work, Hostel/Mess, Other (Item 11)
 * - Delivery preferences & special instructions (Items 13-17)
 * - Relational schema matching customer_addresses (Item 40)
 * - Immutable Address Snapshot for orders (Items 31-34)
 */

export type AddressType = 'home' | 'work' | 'hostel' | 'other';

export type DeliveryTimeSlot = 'morning_10_to_1' | 'evening_4_to_7' | 'anytime';

export interface LeaveWithNeighborInfo {
  enabled: boolean;
  neighborName?: string;
  neighborFlat?: string;
}

export interface DeliveryPreferences {
  /** "Call before delivery" instruction checkbox (Item 13) */
  callBeforeDelivery?: boolean;
  /** "Leave with caretaker / security gate" instruction checkbox (Item 13) */
  leaveWithSecurity?: boolean;
  /** "Do not ring bell" instruction checkbox (Item 13) */
  doNotRingBell?: boolean;
  /** Leave with neighbor details (Item 17) */
  leaveWithNeighbor?: LeaveWithNeighborInfo;
  /** Work/Office weekend lock: office closed on Sat/Sun (Item 14) */
  isWeekendClosed?: boolean;
  /** Gate security / hostel superintendent instructions (Item 15) */
  specialInstructions?: string;
  /** Local delivery time slot preference in Malda municipality (Item 16) */
  preferredTimeSlot?: DeliveryTimeSlot;
}

/**
 * Full Customer Address entity corresponding to Supabase 'customer_addresses' table
 */
export interface CustomerAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_phone: string;
  alternate_phone?: string | null;
  /** House / Flat / Building / Floor No (Address Line 1) */
  address_line1?: string;
  /** Street / Road / Village / Area / Locality (Address Line 2) */
  address_line2?: string;
  /** Combined street address matching PostgreSQL schema (address_line1 + address_line2) */
  street_address: string;
  /** Critical landmark for semi-urban & rural delivery, e.g. "Near Gour College Gate" */
  landmark: string;
  city: string;
  district: string;
  state: string;
  /** 6-digit standard Indian postal code */
  pincode: string;
  address_type: AddressType;
  is_default: boolean;
  delivery_preferences?: DeliveryPreferences | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Address Form Data submitted by customer via modal or checkout inline form
 */
export interface AddressFormData {
  recipient_name: string;
  recipient_phone: string;
  alternate_phone?: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  address_type: AddressType;
  is_default: boolean;
  delivery_preferences?: DeliveryPreferences;
}

export interface AddressSnapshotAuditEntry {
  version: number;
  previous_snapshot: AddressSnapshot;
  change_reason: string;
  changed_by: 'customer' | 'admin' | 'system';
  changed_at: string;
}

/**
 * Frozen immutable address snapshot stored in orders.shipping_address_snapshot
 * Keeps order invoices and legal tax records 100% intact even if customer updates/deletes their profile address.
 */
export interface AddressSnapshot {
  order_id?: string;
  recipient_name: string;
  recipient_phone: string;
  alternate_phone?: string | null;
  street_address: string;
  address_line1?: string;
  address_line2?: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  address_type: AddressType;
  delivery_preferences?: DeliveryPreferences | null;
  delivery_otp_required?: boolean;
  is_gift_delivery?: boolean;
  gift_message?: string | null;
  zone?: 'malda_town' | 'malda_district' | 'regional_wb' | 'national';
  snapshot_version?: number;
  snapshot_checksum?: string;
  snapshot_timestamp: string;
  snapshot_history?: AddressSnapshotAuditEntry[];
}

/**
 * Pincode Postal Lookup Response for quick 10-15ms auto-fill (Items 2-3)
 */
export interface PostalLookupResult {
  pincode: string;
  district: string;
  state: string;
  city: string;
  postOffices: string[];
  isDeliverable: boolean;
  isMaldaLocal: boolean;
  source: 'cache' | 'edge_api' | 'fallback';
}

export const MAX_ADDRESSES_PER_USER = 15;
export const DEFAULT_USER_ID = 'user-demo-sabir';

