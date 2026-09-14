/**
 * Module 16: Live Order Tracking & Customer Dashboard Types
 * 
 * Complies with:
 * - Item 2: 5 Primary linear progress phases
 * - Item 3: 7 Exception lifecycle states
 * - Item 4: Finite State Machine transition definitions
 * - Item 5: `order_status_history` audit timeline
 * - Item 8 & 40: 4-digit Delivery and Store Counter Pickup OTP
 * - Item 11 & 15: 3PL courier normalization (Delhivery, Shiprocket, India Post, Local Malda)
 * - Item 21-25: Stepper milestones and hub tracking
 * - Item 41-42: PostgreSQL relational schema models
 */

import { AddressSnapshot } from './address';

/**
 * 5 Primary Linear Statuses (Item 2)
 */
export type PrimaryOrderStatus =
  | 'order_placed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered';

/**
 * 7 Exception / Secondary Statuses (Item 3)
 */
export type ExceptionOrderStatus =
  | 'cancelled_by_user'
  | 'cancelled_by_seller'
  | 'delivery_attempted'
  | 'rto_initiated'
  | 'rto_delivered'
  | 'delayed'
  | 'lost_in_transit';

/**
 * Store Counter Pickup (Click & Collect) Statuses (Item 40)
 */
export type StorePickupOrderStatus =
  | 'pickup_confirmed'
  | 'pickup_ready'
  | 'pickup_completed';

/**
 * Unified Order Status Type
 */
export type OrderStatus =
  | PrimaryOrderStatus
  | ExceptionOrderStatus
  | StorePickupOrderStatus;

export type DeliveryMethod = 'standard' | 'express_sameday' | 'store_pickup';

export type CourierProvider =
  | 'delhivery'
  | 'shiprocket'
  | 'india_post'
  | 'local_malda';

/**
 * Audit Trail Status History Entry (Item 5, 41)
 */
export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  old_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by: 'system' | 'admin' | 'courier_webhook' | 'customer';
  hub_location?: string;
  city?: string;
  notes?: string;
  created_at: string;
}

/**
 * Timeline Stepper Visual Milestone (Item 21, 24, 25)
 */
export interface TrackingMilestone {
  step_number?: number;
  status: OrderStatus;
  label_en?: string;
  label_bn?: string;
  title?: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  description_en?: string;
  description_bn?: string;
  timestamp?: string;
  location?: string;
  is_completed?: boolean;
  is_current?: boolean;
  is_exception?: boolean;
}

/**
 * 3PL Shipment Details & OTP Entity (Item 8, 11, 18, 40)
 */
export interface ShipmentDetails {
  id?: string;
  order_id?: string;
  orderId?: string;
  awb?: string;
  awb_number?: string;
  carrier?: CourierProvider;
  courier_provider?: CourierProvider;
  trackingUrl?: string;
  tracking_url?: string;
  rider_name?: string;
  rider_phone?: string;
  dispatched_at?: string;
  expected_delivery_date?: string;
  expected_delivery_date_bn?: string;
  delivery_otp?: string; // 4-digit dynamic delivery OTP (Item 8)
  pickup_otp?: string;   // 4-digit store counter pickup OTP (Item 40)
  pickup_qr_code?: string;
}

/**
 * Delivery address snapshot used in tracking views
 */
export interface DeliveryAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

/**
 * Order Item in Live Tracking Card (Item 26)
 */
export interface TrackingOrderItem {
  id?: string;
  product_id?: string;
  title: string;
  titleBn?: string;
  title_bn?: string;
  author?: string;
  thumbnail?: string;
  cover_image_url?: string;
  quantity: number;
  price?: number;
  unit_price?: number;
  total_price?: number;
  is_reviewed?: boolean;
}

/**
 * Comprehensive Live Tracking View Model (Item 26, 31)
 */
export interface LiveTrackingData {
  orderId?: string;
  order_id?: string;
  orderNumber?: string; // e.g. '#MMB-2026-9042'
  order_number?: string;
  user_id?: string;
  customer_name?: string;
  customer_phone?: string;
  status?: OrderStatus;
  current_status?: OrderStatus;
  statusLabelEn?: string;
  statusLabelBn?: string;
  statusDescriptionEn?: string;
  statusDescriptionBn?: string;
  delivery_method?: DeliveryMethod;
  isStorePickup?: boolean;
  is_arriving_today?: boolean;
  isCancellable?: boolean;     // Item 9 (strictly before 'packed')
  is_cancellable?: boolean;
  isReturnable?: boolean;      // Item 10 (within 7 days of delivery)
  is_returnable?: boolean;
  destination_pincode?: string;
  deliveryAddress?: DeliveryAddressSnapshot;
  shipping_address?: AddressSnapshot;
  shipment?: ShipmentDetails;
  deliveryOtp?: {
    shouldShowOtp: boolean;
    otpCode: string;
    securityNoticeEn?: string;
    securityNoticeBn?: string;
  };
  riderInfo?: {
    name?: string;
    phone?: string;
  };
  estimatedDeliveryDate?: {
    displayEn: string;
    displayBn: string;
    isDelayed: boolean;
    isArrivingToday: boolean;
  };
  milestones?: TrackingMilestone[];
  history?: OrderStatusHistoryEntry[];
  items?: TrackingOrderItem[];
  subtotal?: number;
  subtotal_amount?: number;
  shippingFee?: number;
  shipping_fee?: number;
  discount?: number;
  discount_amount?: number;
  grandTotal?: number;
  total_amount?: number;
  paymentMethod?: string;
  payment_method?: string;
  payment_status?: 'paid' | 'pending' | 'refunded';
  invoice_url?: string;
  deliveredAt?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Guest Order Tracking Session (Item 38)
 */
export interface GuestTrackingSession {
  phone: string;
  order_number: string;
  otp_verified: boolean;
  verified_at?: string;
}

/**
 * Order Status Color & Badge Mapping
 */
export interface StatusBadgeConfig {
  label_en: string;
  label_bn: string;
  bg_color: string;
  text_color: string;
  border_color: string;
  icon_type: 'check' | 'truck' | 'package' | 'alert' | 'x';
}
