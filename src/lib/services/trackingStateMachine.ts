/**
 * Module 16: Live Order Tracking - Finite State Machine (FSM) & Transition Validator
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 4: Strict FSM avoiding illegal status jumps (e.g. delivered -> packed, cancelled -> shipped)
 * - Item 9: Customer Self-Cancellation window (Strictly permitted before 'packed')
 * - Item 10: 7-Day Replacement Policy verification (Post-delivery return window)
 * - Item 40: Store Pickup Click & Collect counter verification & QR payload
 */

import { OrderStatus, PrimaryOrderStatus } from '@/types/tracking';

export type UserRole = 'customer' | 'seller' | 'system' | 'courier';

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
  reasonBn?: string;
}

export interface CancellationCheckResult {
  allowed: boolean;
  reason?: string;
  reasonBn?: string;
}

export interface ReplacementCheckResult {
  allowed: boolean;
  daysRemaining?: number;
  reason?: string;
  reasonBn?: string;
}

/**
 * Legal transition map for all 15 order statuses.
 */
export const LEGAL_TRANSITION_GRAPH: Record<OrderStatus, readonly OrderStatus[]> = {
  // Standard Delivery Flow
  order_placed: ['packed', 'cancelled_by_user', 'cancelled_by_seller', 'delayed'],
  packed: ['shipped', 'cancelled_by_seller', 'delayed'],
  shipped: ['out_for_delivery', 'delayed', 'lost_in_transit', 'rto_initiated'],
  out_for_delivery: ['delivered', 'delivery_attempted', 'delayed', 'rto_initiated'],
  delivered: [], // Terminal for fulfillment lifecycle (triggers replacement window)

  // Exceptions & Recovery
  delivery_attempted: ['out_for_delivery', 'rto_initiated', 'delayed'],
  delayed: ['packed', 'shipped', 'out_for_delivery', 'rto_initiated', 'lost_in_transit'],
  rto_initiated: ['rto_delivered', 'delayed'],
  rto_delivered: [], // Terminal
  cancelled_by_user: [], // Terminal
  cancelled_by_seller: [], // Terminal
  lost_in_transit: [], // Terminal

  // Store Pickup Flow (Click & Collect at Netaji Subhash Road, Malda)
  pickup_confirmed: ['pickup_ready', 'cancelled_by_user', 'cancelled_by_seller'],
  pickup_ready: ['pickup_completed', 'cancelled_by_seller'],
  pickup_completed: [], // Terminal
};

/**
 * Terminal states that cannot transition into any other status
 */
export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  'delivered',
  'cancelled_by_user',
  'cancelled_by_seller',
  'rto_delivered',
  'lost_in_transit',
  'pickup_completed',
];

/**
 * Checks if a status is terminal
 */
export function isTerminalState(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

/**
 * Validates whether a state transition from `currentStatus` to `newStatus` is legally allowed
 * and permitted for the performing role.
 */
export function validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  role: UserRole = 'system'
): TransitionValidationResult {
  if (currentStatus === newStatus) {
    return {
      valid: true,
      reason: 'No state change.',
      reasonBn: 'কোনো স্ট্যাটাস পরিবর্তন হয়নি।',
    };
  }

  // 1. Check if current status is terminal
  if (isTerminalState(currentStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from terminal state '${currentStatus}' to '${newStatus}'.`,
      reasonBn: `'${currentStatus}' একটি চূড়ান্ত স্ট্যাটাস, এখান থেকে নতুন স্ট্যাটাসে পরিবর্তন সম্ভব নয়।`,
    };
  }

  // 2. Check FSM graph
  const allowedNextStates = LEGAL_TRANSITION_GRAPH[currentStatus] || [];
  if (!allowedNextStates.includes(newStatus)) {
    return {
      valid: false,
      reason: `Illegal state transition from '${currentStatus}' to '${newStatus}'.`,
      reasonBn: `'${currentStatus}' থেকে '${newStatus}' স্ট্যাটাসে রূপান্তর নিয়মানুযায়ী অবৈধ।`,
    };
  }

  // 3. Role-based restrictions
  if (role === 'customer') {
    // Customers can ONLY trigger 'cancelled_by_user'
    if (newStatus !== 'cancelled_by_user') {
      return {
        valid: false,
        reason: 'Customers are only permitted to cancel eligible orders.',
        reasonBn: 'গ্রাহক কেবল প্রযোজ্য অর্ডার বাতিল করার অনুরোধ জানাতে পারেন।',
      };
    }

    // Customer cancellation is strictly allowed only before 'packed'
    if (currentStatus !== 'order_placed' && currentStatus !== 'pickup_confirmed') {
      return {
        valid: false,
        reason: 'Order is already being processed or packed. Self-cancellation is not permitted.',
        reasonBn: 'অর্ডারটি ইতিমধ্যে প্যাকেজিং শুরু হয়ে গেছে। এখন স্বয়ংক্রিয় বাতিল করা সম্ভব নয়।',
      };
    }
  }

  if (role === 'courier') {
    // Courier webhooks can only update shipping/delivery states
    const courierAllowedTargets: OrderStatus[] = [
      'shipped',
      'out_for_delivery',
      'delivery_attempted',
      'delivered',
      'delayed',
      'rto_initiated',
      'rto_delivered',
      'lost_in_transit',
    ];
    if (!courierAllowedTargets.includes(newStatus)) {
      return {
        valid: false,
        reason: `Courier webhooks are not authorized to set status '${newStatus}'.`,
        reasonBn: `কুরিয়ার আপডেট থেকে '${newStatus}' স্ট্যাটাস সেট করা অনুমোদিত নয়।`,
      };
    }
  }

  return { valid: true };
}

/**
 * Checks if customer is eligible to self-cancel the order (Item 9)
 * Cancellation is allowed strictly BEFORE order reaches 'packed' status.
 */
export function canCancelOrder(status: OrderStatus): CancellationCheckResult {
  if (status === 'order_placed' || status === 'pickup_confirmed') {
    return {
      allowed: true,
    };
  }

  if (status === 'packed' || status === 'pickup_ready') {
    return {
      allowed: false,
      reason: 'Your order is packed and prepared for dispatch. Cancellation is no longer permitted.',
      reasonBn: 'আপনার অর্ডারটি প্যাক ও রেডি হয়ে গেছে। এই পর্যায়ে অর্ডার বাতিল করা সম্ভব নয়।',
    };
  }

  if (status === 'shipped' || status === 'out_for_delivery') {
    return {
      allowed: false,
      reason: 'Order is already in transit. You may refuse delivery at your doorstep if necessary.',
      reasonBn: 'অর্ডারটি ডেলিভারির জন্য রওয়ানা হয়ে গেছে। প্রয়োজন হলে ডেলিভারির সময় পার্সেল গ্রহণে অসম্মতি জানাতে পারেন।',
    };
  }

  if (status === 'delivered' || status === 'pickup_completed') {
    return {
      allowed: false,
      reason: 'Order has already been delivered. You may request a replacement within 7 days if defective.',
      reasonBn: 'অর্ডারটি ইতিমধ্যে ডেলিভারি সম্পন্ন হয়েছে। কোনো ত্রুটি থাকলে ৭ দিনের মধ্যে রিপ্লেসমেন্ট অনুরোধ করুন।',
    };
  }

  return {
    allowed: false,
    reason: `Order in status '${status}' cannot be cancelled.`,
    reasonBn: `'${status}' স্ট্যাটাসে থাকা অর্ডার বাতিল করা সম্ভব নয়।`,
  };
}

/**
 * Checks if customer is eligible to request a 7-day replacement (Item 10)
 */
export function canRequestReplacement(
  status: OrderStatus,
  deliveredAt?: Date | string | null,
  returnWindowDays: number = 7
): ReplacementCheckResult {
  if (status !== 'delivered' && status !== 'pickup_completed') {
    return {
      allowed: false,
      reason: 'Replacements can only be requested for delivered orders.',
      reasonBn: 'কেবলমাত্র ডেলিভারি সম্পন্ন হওয়া অর্ডারের জন্যই রিপ্লেসমেন্ট অনুরোধ করা সম্ভব।',
    };
  }

  if (!deliveredAt) {
    return {
      allowed: false,
      reason: 'Delivery timestamp is missing. Please contact customer support.',
      reasonBn: 'ডেলিভারির সময়কাল পাওয়া যায়নি। অনুগ্রহ করে কাস্টমার সাপোর্টে যোগাযোগ করুন।',
    };
  }

  const deliveryTime = new Date(deliveredAt).getTime();
  if (isNaN(deliveryTime)) {
    return {
      allowed: false,
      reason: 'Invalid delivery timestamp.',
      reasonBn: 'অকার্যকর ডেলিভারি সময়কাল।',
    };
  }

  const now = Date.now();
  const windowMs = returnWindowDays * 24 * 60 * 60 * 1000;
  const elapsedMs = now - deliveryTime;

  if (elapsedMs < 0) {
    return {
      allowed: true,
      daysRemaining: returnWindowDays,
    };
  }

  if (elapsedMs > windowMs) {
    const daysAgo = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
    return {
      allowed: false,
      daysRemaining: 0,
      reason: `The ${returnWindowDays}-day replacement window expired ${daysAgo - returnWindowDays} day(s) ago.`,
      reasonBn: `${returnWindowDays} দিনের রিপ্লেসমেন্ট সময়সীমা ইতিমধ্যে উত্তীর্ণ হয়ে গেছে।`,
    };
  }

  const remainingDays = Math.ceil((windowMs - elapsedMs) / (24 * 60 * 60 * 1000));
  return {
    allowed: true,
    daysRemaining: remainingDays,
  };
}

/**
 * Maps any OrderStatus to the 5 primary visual stepper phases for UI rendering (Item 3, 22)
 */
export function getPrimaryPhaseProgress(status: OrderStatus): {
  phaseIndex: number;
  totalPhases: number;
  percent: number;
  isException: boolean;
  activePhase: PrimaryOrderStatus;
} {
  switch (status) {
    case 'order_placed':
    case 'pickup_confirmed':
      return { phaseIndex: 0, totalPhases: 5, percent: 15, isException: false, activePhase: 'order_placed' };
    case 'packed':
    case 'pickup_ready':
      return { phaseIndex: 1, totalPhases: 5, percent: 35, isException: false, activePhase: 'packed' };
    case 'shipped':
      return { phaseIndex: 2, totalPhases: 5, percent: 65, isException: false, activePhase: 'shipped' };
    case 'out_for_delivery':
      return { phaseIndex: 3, totalPhases: 5, percent: 85, isException: false, activePhase: 'out_for_delivery' };
    case 'delivered':
    case 'pickup_completed':
      return { phaseIndex: 4, totalPhases: 5, percent: 100, isException: false, activePhase: 'delivered' };

    // Exceptions
    case 'delayed':
      return { phaseIndex: 2, totalPhases: 5, percent: 50, isException: true, activePhase: 'shipped' };
    case 'delivery_attempted':
      return { phaseIndex: 3, totalPhases: 5, percent: 80, isException: true, activePhase: 'out_for_delivery' };
    case 'rto_initiated':
    case 'rto_delivered':
      return { phaseIndex: 2, totalPhases: 5, percent: 50, isException: true, activePhase: 'shipped' };
    case 'cancelled_by_user':
    case 'cancelled_by_seller':
    case 'lost_in_transit':
      return { phaseIndex: 0, totalPhases: 5, percent: 0, isException: true, activePhase: 'order_placed' };

    default:
      return { phaseIndex: 0, totalPhases: 5, percent: 10, isException: false, activePhase: 'order_placed' };
  }
}

/**
 * Validates store counter pickup 4-digit numeric OTP (Item 40)
 */
export function validateStorePickupOtp(
  expectedOtp: string,
  inputOtp: string
): { success: boolean; error?: string; errorBn?: string } {
  const normExpected = expectedOtp.trim();
  const normInput = inputOtp
    .replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString())
    .trim();

  if (!/^\d{4}$/.test(normInput)) {
    return {
      success: false,
      error: 'Please enter a valid 4-digit counter pickup code.',
      errorBn: 'অনুগ্রহ করে ৪ সংখ্যার সঠিক কাউন্টার পিকআপ ওটিপি প্রবেশ করান।',
    };
  }

  if (normExpected !== normInput) {
    return {
      success: false,
      error: 'Incorrect pickup OTP. Please check the code in your SMS or email.',
      errorBn: 'ভুল পিকআপ ওটিপি। অনুগ্রহ করে আপনার এসএমএস বা ড্যাশবোর্ডের কোডটি যাচাই করুন।',
    };
  }

  return { success: true };
}

/**
 * Generates store counter pickup QR Code payload (Item 40)
 */
export function generateStorePickupQrPayload(
  orderId: string,
  pickupOtp: string,
  storeCode: string = 'MMB-MALDA-MAIN'
): string {
  return JSON.stringify({
    app: 'MMB_STORE_PICKUP',
    orderId: orderId.trim(),
    otp: pickupOtp.trim(),
    store: storeCode,
    timestamp: Date.now(),
  });
}
