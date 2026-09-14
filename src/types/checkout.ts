/**
 * MM Book House - Module 12: Amazon 1-Click "Buy Now" & Step-by-Step Checkout Types
 * 
 * Enforces strict typing for the 3-step checkout funnel, 1-Click Buy Now isolated sessions,
 * delivery speeds, GST invoices, stock reservations, idempotency keys, and zero-trust pricing.
 */

import { CustomerAddress, AddressSnapshot } from './address';
export type { AddressSnapshot, CustomerAddress };
import { GiftOptionsState, VariantCondition, VariantFormat } from './pdp';

/**
 * Checkout Mode (Item 11, 12):
 * - 'cart': Standard checkout of selective items from regular cart.
 * - 'buy_now': Isolated express purchase bypassing cart and preserving cart items untouched.
 */
export type CheckoutMode = 'cart' | 'buy_now';

/**
 * 3 Amazon-style Accordion Checkout Steps (Item 5, 6):
 * - Step 1: Delivery Address Selection & Inline Address Creation
 * - Step 2: Delivery Speed & Guaranteed SLA Selection
 * - Step 3: Payment Method, GST Details & Final Order Review
 */
export type CheckoutStep = 1 | 2 | 3;

/**
 * Single Item in Checkout Session (Item 11, 12, 17, 39)
 */
export interface CheckoutItem {
  id: string;
  bookId: string;
  variantId?: string;
  title: string;
  titleBn: string;
  author: string;
  authorBn?: string;
  price: number; // Unit selling price in INR
  mrp: number;   // Unit MRP in INR
  quantity: number;
  maxQuantity?: number;
  coverImage?: string;
  binding?: VariantFormat;
  condition?: VariantCondition;
  isPreorder?: boolean;
  giftOptions?: GiftOptionsState;
}

/**
 * Delivery Speed Channels (Item 23):
 * - 'standard': Normal Postal/Courier shipping (2-3 business days)
 * - 'express_sameday': Same-Day Express Delivery (Malda Town local)
 * - 'store_pickup': Free Self-Pickup at M.M Book House, Rabindra Avenue, Malda
 */
export type DeliverySpeedId = 'standard' | 'express_sameday' | 'store_pickup';

export interface DeliverySpeedOption {
  id: DeliverySpeedId;
  title: string;
  titleBn: string;
  subtitle: string;
  subtitleBn: string;
  fee: number; // Additional speed surcharge (0 for standard or store pickup)
  estimatedDeliveryDate: string; // ISO String or readable date (Item 24)
  guaranteedDeliveryDateBn: string; // e.g. "বুধবার, ১২ মার্চ-এর মধ্যে নিশ্চিত ডেলিভারি"
  isGuaranteed: boolean;
  isAvailableForPincode: boolean;
  cutoffTimeNoticeBn?: string; // e.g. "আজ বিকাল ৪টার মধ্যে অর্ডার করলে আজই পাবেন"
}

/**
 * Payment Channels (Item 25):
 * - 'upi': GPay, PhonePe, Paytm, BHIM, Dynamic QR Code
 * - 'cod': Cash on Delivery with Anti-Fraud OTP Verification (Item 26)
 * - 'card': Debit/Credit Cards (RBI Tokenized)
 * - 'netbanking': Top Indian Banks
 */
export type PaymentMethodType = 'upi' | 'cod' | 'card' | 'netbanking';

export interface PaymentMethodOption {
  id: PaymentMethodType;
  title: string;
  titleBn: string;
  subtitle: string;
  subtitleBn: string;
  badge?: string;
  badgeBn?: string;
  isRecommended?: boolean;
  enabled: boolean;
  instructionsBn?: string;
}

/**
 * GST Business Billing Information (Item 27)
 */
export interface GstBillingDetails {
  companyName: string;
  gstin: string; // 15-character Indian GSTIN
  registeredAddress?: string;
  stateCode?: string; // e.g. "19" for West Bengal
}

/**
 * 5-Minute Dedicated Stock Reservation (Item 31, 32):
 * Locks inventory when reaching Step 3 to prevent race conditions on last copies.
 */
export interface StockReservation {
  reservationId: string;
  sessionId: string;
  bookId: string;
  quantity: number;
  reservedAt: number; // Unix timestamp ms
  expiresAt: number;  // Unix timestamp ms (reservedAt + 5 * 60 * 1000)
  released: boolean;
  orderPlaced?: boolean;
}

/**
 * Price Drift Alert (Item 29):
 * Notifies customer if catalog price modified while browsing checkout.
 */
export interface PriceDriftNotice {
  bookId: string;
  title: string;
  titleBn: string;
  oldPrice: number;
  newPrice: number;
  difference: number;
  messageBn: string;
}

/**
 * Server-Calculated Zero-Client-Trust Pricing Breakdown (Item 38, 39)
 */
export interface CheckoutPricingBreakdown {
  itemsSubtotal: number;       // Sum of (price * qty)
  itemsMrp: number;            // Sum of (mrp * qty)
  catalogSavings: number;      // itemsMrp - itemsSubtotal
  baseShippingFee: number;     // Address zone fee (from pincode service)
  deliverySpeedFee: number;    // Additional fee for express delivery
  totalShippingFee: number;    // baseShippingFee + deliverySpeedFee
  isFreeShipping: boolean;     // Threshold met or free promo
  couponCode?: string;         // Applied promo code
  couponDiscount: number;      // Discount from promo code (Item 38)
  giftWrapFee: number;         // Total gift wrapping fee
  codFee?: number;             // Transparent COD handling fee (Item 14)
  prepaidDiscount?: number;    // Online prepayment discount incentive (Item 20)
  finalPayable: number;        // Final net amount to pay
  priceDrifts?: PriceDriftNotice[];
}

/**
 * Full Checkout Session State
 */
export interface CheckoutSession {
  sessionId: string;
  mode: CheckoutMode;
  items: CheckoutItem[];
  selectedAddressId?: string;
  selectedAddressSnapshot?: AddressSnapshot;
  deliverySpeed: DeliverySpeedId;
  paymentMethod?: PaymentMethodType;
  gstDetails?: GstBillingDetails;
  useGstInvoice: boolean;
  couponCode?: string;
  isGiftOrder: boolean;
  giftMessage?: string;
  idempotencyKey: string;      // Unique UUID to prevent double-click charges (Item 33)
  stockReservationIds?: string[];
  stockReservedUntil?: number;
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  pricing: CheckoutPricingBreakdown;
  codVerifiedPhone?: string;   // Verified phone number if COD selected (Item 26)
  createdAt: number;
  updatedAt: number;
}

/**
 * Order Placement Payload sent from Client to Server Action (Item 39, 40)
 * Note: Prices are NEVER trusted from client; server recalculates everything.
 */
export interface PlaceOrderPayload {
  sessionId: string;
  idempotencyKey: string;
  mode: CheckoutMode;
  items: Array<{
    bookId: string;
    variantId?: string;
    quantity: number;
    binding?: VariantFormat;
    condition?: VariantCondition;
    giftOptions?: GiftOptionsState;
  }>;
  shippingAddressId: string;
  billingAddressId?: string;
  deliverySpeed: DeliverySpeedId;
  paymentMethod: PaymentMethodType;
  couponCode?: string;
  useGstInvoice: boolean;
  gstDetails?: GstBillingDetails;
  isGiftOrder?: boolean;
  giftMessage?: string;
  codOtpCode?: string; // If COD selected and OTP challenge required
  isPaymentVerified?: boolean;
  paymentTransactionId?: string;
}

/**
 * Order Placement Action Return Value (Item 40, 41)
 */
export interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string; // e.g. "#MMB-2026-9042" (Item 43)
  redirectUrl?: string; // e.g. "/checkout/success/[order_id]" (Item 41)
  error?: string;
  errorBn?: string;
  errorCode?: 
    | 'STOCK_UNAVAILABLE'
    | 'PRICE_CHANGED'
    | 'INVALID_ADDRESS'
    | 'INVALID_PAYMENT'
    | 'IDEMPOTENCY_COLLISION'
    | 'COD_VERIFICATION_FAILED'
    | 'INVALID_COUPON'
    | 'INTERNAL_ERROR';
}
