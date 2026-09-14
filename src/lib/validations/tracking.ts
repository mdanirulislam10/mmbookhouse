/**
 * Module 16: Live Order Tracking & Customer Dashboard Validations
 * Complies with:
 * - Item 4: FSM transition validation schema
 * - Item 8: 4-digit Delivery OTP verification
 * - Item 9: Order cancellation guard
 * - Item 10: 7-day replacement/return request
 * - Item 14: HMAC-SHA256 authenticated webhook schema
 * - Item 38: Guest order tracking phone & OTP schema
 * - Item 40: Store counter pickup OTP schema
 */

import { z } from 'zod';

export const primaryStatusEnum = z.enum([
  'order_placed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
]);

export const exceptionStatusEnum = z.enum([
  'cancelled_by_user',
  'cancelled_by_seller',
  'delivery_attempted',
  'rto_initiated',
  'rto_delivered',
  'delayed',
  'lost_in_transit',
]);

export const storePickupStatusEnum = z.enum([
  'pickup_confirmed',
  'pickup_ready',
  'pickup_completed',
]);

export const orderStatusEnum = z.enum([
  'order_placed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled_by_user',
  'cancelled_by_seller',
  'delivery_attempted',
  'rto_initiated',
  'rto_delivered',
  'delayed',
  'lost_in_transit',
  'pickup_confirmed',
  'pickup_ready',
  'pickup_completed',
]);

export const courierProviderEnum = z.enum([
  'delhivery',
  'shiprocket',
  'india_post',
  'local_malda',
]);

/**
 * Order Status Transition Payload Schema (Item 4)
 */
export const orderStatusTransitionSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  from_status: orderStatusEnum.optional(),
  to_status: orderStatusEnum,
  changed_by: z.enum(['system', 'admin', 'courier_webhook', 'customer']),
  hub_location: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Authenticated 3PL Courier Webhook Payload Schema (Item 14)
 */
export const courierWebhookSchema = z.object({
  awb_number: z.string().min(5, 'Valid AWB number is required'),
  courier: courierProviderEnum,
  raw_status: z.string().min(1, 'Raw courier status is required'),
  timestamp: z.union([z.string(), z.number()]),
  location: z.string().optional(),
  city: z.string().optional(),
  rider_name: z.string().optional(),
  rider_phone: z.string().optional(),
  signature: z.string().min(8, 'HMAC-SHA256 signature required for security (Item 14)'),
});

/**
 * Public Guest Order Tracking Initial Lookup (Item 38)
 */
export const guestTrackLookupSchema = z
  .object({
    phone: z.string().optional(),
    phoneNumber: z.string().optional(),
    order_number: z.string().optional(),
    orderNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      const p = (data.phone || data.phoneNumber || '').trim();
      return /^[6-9]\d{9}$/.test(p);
    },
    {
      message: 'Please enter a valid 10-digit Indian mobile number',
      path: ['phoneNumber'],
    }
  )
  .refine(
    (data) => {
      const o = (data.order_number || data.orderNumber || '').trim();
      return o.length >= 3;
    },
    {
      message: 'Order number is required',
      path: ['orderNumber'],
    }
  )
  .transform((data) => {
    const rawPhone = (data.phone || data.phoneNumber || '').trim();
    const rawOrder = (data.order_number || data.orderNumber || '').trim().toUpperCase();
    return {
      phone: rawPhone,
      phoneNumber: rawPhone,
      order_number: rawOrder,
      orderNumber: rawOrder,
    };
  });

/**
 * Guest Order OTP Verification Schema (Item 38)
 */
export const verifyGuestOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  order_number: z
    .string()
    .min(3, 'Order number is required')
    .transform((val) => val.trim().toUpperCase()),
  otp: z
    .string()
    .regex(/^\d{4}$/, 'OTP must be exactly 4 numeric digits'),
});

/**
 * Delivery or Store Pickup OTP Verification Schema (Item 8 & 40)
 */
export const verifyDeliveryOtpSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  otp: z
    .string()
    .regex(/^\d{4}$/, '4-digit OTP is required for delivery/pickup verification'),
  verification_type: z.enum(['home_delivery', 'store_pickup']),
});

/**
 * Customer Self-Cancellation Schema (Item 9)
 */
export const cancelOrderSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  reason: z
    .string()
    .min(3, 'Please provide a cancellation reason with at least 3 characters'),
  notes: z.string().optional(),
});

/**
 * 7-Day Replacement / Return Request Schema (Item 10)
 */
export const replacementRequestSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  product_id: z.string().min(1, 'Product ID is required'),
  reason: z.enum([
    'damaged_pages',
    'printing_defect',
    'wrong_book_delivered',
    'missing_supplementary_item',
  ]),
  description: z
    .string()
    .min(10, 'Please describe the book issue in at least 10 characters'),
  images: z.array(z.string().url('Valid image URL required')).max(5).optional(),
});
