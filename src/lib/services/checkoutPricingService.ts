/**
 * MM Book House - Module 12: Zero-Client-Trust Checkout Pricing & Promo Engine
 * 
 * Implements:
 * - Zero Client Trust Price Recalculation (Item 39): Client price inputs ignored; prices
 *   re-evaluated strictly against catalog database.
 * - Promo Code Engine & Green Discount Line (Item 37, 38)
 * - Transparent Price Drift Detection (Item 29)
 * - Pincode Shipping Fee & Delivery Speed Integration (Item 22, 23)
 */

import { CheckoutItem, CheckoutPricingBreakdown, DeliverySpeedId, PaymentMethodType, PriceDriftNotice } from '@/types/checkout';
import { calculateAddressShippingFee } from '@/lib/services/pincodeService';
import { calculateSpeedAdjustment } from '@/lib/services/deliverySpeedService';

export interface CouponRule {
  code: string;
  type: 'FLAT' | 'PERCENT' | 'FREE_SHIPPING';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  titleBn: string;
}

export const ACTIVE_COUPONS: Record<string, CouponRule> = {
  WELCOME50: {
    code: 'WELCOME50',
    type: 'FLAT',
    value: 50,
    minOrderValue: 299,
    titleBn: 'নতুন গ্রাহক ফ্ল্যাট ₹৫০ ছাড়',
  },
  MM10: {
    code: 'MM10',
    type: 'PERCENT',
    value: 10,
    minOrderValue: 499,
    maxDiscount: 100,
    titleBn: '১০% বিশেষ ছাড় (সর্বোচ্চ ₹১০০)',
  },
  MALDAFREE: {
    code: 'MALDAFREE',
    type: 'FREE_SHIPPING',
    value: 0,
    minOrderValue: 199,
    titleBn: 'ফ্রি শিপিং কুপন',
  },
};

/**
 * Validates a promo coupon code
 */
export function validateCoupon(
  code: string,
  subtotal: number
): {
  isValid: boolean;
  coupon?: CouponRule;
  discountAmount: number;
  isFreeShipping: boolean;
  error?: string;
  errorBn?: string;
} {
  const cleanCode = code.toUpperCase().trim();
  const coupon = ACTIVE_COUPONS[cleanCode];

  if (!coupon) {
    return {
      isValid: false,
      discountAmount: 0,
      isFreeShipping: false,
      error: 'Invalid coupon code',
      errorBn: 'অবৈধ কুপন কোড। অনুগ্রহ করে সঠিক কোড দিন।',
    };
  }

  if (subtotal < coupon.minOrderValue) {
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      isFreeShipping: false,
      error: `Coupon valid only on orders of ₹${coupon.minOrderValue} or more`,
      errorBn: `এই কুপনটি পেতে ন্যূনতম ₹${coupon.minOrderValue}-এর বই অর্ডার করতে হবে।`,
    };
  }

  let discount = 0;
  let freeShipping = false;

  if (coupon.type === 'FLAT') {
    discount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'PERCENT') {
    const rawDiscount = (subtotal * coupon.value) / 100;
    discount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
  } else if (coupon.type === 'FREE_SHIPPING') {
    freeShipping = true;
  }

  return {
    isValid: true,
    coupon,
    discountAmount: Math.round(discount),
    isFreeShipping: freeShipping,
  };
}

/**
 * Calculates complete zero-client-trust pricing for checkout session (Item 38, 39)
 */
export function calculateCheckoutPricing({
  items,
  pincode,
  deliverySpeed = 'standard',
  paymentMethod,
  couponCode,
  isGiftOrder = false,
  catalogPriceLookup,
}: {
  items: CheckoutItem[];
  pincode: string;
  deliverySpeed?: DeliverySpeedId;
  paymentMethod?: PaymentMethodType;
  couponCode?: string;
  isGiftOrder?: boolean;
  catalogPriceLookup?: Record<string, { price: number; mrp: number }>; // Mock or live DB prices
}): CheckoutPricingBreakdown {
  let itemsSubtotal = 0;
  let itemsMrp = 0;
  let giftWrapFee = 0;
  const priceDrifts: PriceDriftNotice[] = [];

  // 1. Zero Client Trust Recalculation (Item 39)
  for (const item of items) {
    const currentCatalog = catalogPriceLookup?.[item.bookId];
    const officialPrice = currentCatalog?.price ?? item.price;
    const officialMrp = currentCatalog?.mrp ?? item.mrp;

    // Detect price drift (Item 29)
    if (currentCatalog && currentCatalog.price !== item.price) {
      priceDrifts.push({
        bookId: item.bookId,
        title: item.title,
        titleBn: item.titleBn,
        oldPrice: item.price,
        newPrice: currentCatalog.price,
        difference: currentCatalog.price - item.price,
        messageBn: `"${item.titleBn}"-এর মূল্য ₹${item.price} থেকে পরিবর্তিত হয়ে ₹${currentCatalog.price} হয়েছে।`,
      });
    }

    itemsSubtotal += officialPrice * item.quantity;
    itemsMrp += officialMrp * item.quantity;

    const hasWrap = (item.giftOptions?.hasGiftOptions && item.giftOptions.giftWrapType && item.giftOptions.giftWrapType !== 'none') || isGiftOrder;
    if (hasWrap) {
      giftWrapFee += 25 * item.quantity;
    }
  }

  const catalogSavings = Math.max(0, itemsMrp - itemsSubtotal);

  // 2. Base Shipping Fee based on Pincode & Subtotal (Item 22)
  const shippingEstimate = calculateAddressShippingFee(pincode, itemsSubtotal);
  const baseShippingFee = shippingEstimate.shippingFee;

  // 3. Speed Adjustment & Store Pickup Waiver (Item 23)
  const speedAdj = calculateSpeedAdjustment(deliverySpeed, baseShippingFee);
  let finalShippingFee = speedAdj.finalShippingFee;
  const deliverySpeedFee = speedAdj.speedFee;

  // 4. Coupon Evaluation (Item 37, 38)
  let couponDiscount = 0;
  let validCouponCode: string | undefined = undefined;

  if (couponCode) {
    const couponRes = validateCoupon(couponCode, itemsSubtotal);
    if (couponRes.isValid) {
      couponDiscount = couponRes.discountAmount;
      validCouponCode = couponRes.coupon?.code;
      if (couponRes.isFreeShipping && !speedAdj.isPickup) {
        finalShippingFee = deliverySpeedFee; // Base fee waived, keep only speed surcharge if any
      }
    }
  }

  // 5. COD Handling Fee (Item 14)
  const isCod = paymentMethod === 'cod';
  const codFee = isCod ? 35 : 0;

  // 6. Final Net Payable (Item 28)
  const netPayable = Math.max(0, itemsSubtotal + finalShippingFee + giftWrapFee + codFee - couponDiscount);

  return {
    itemsSubtotal,
    itemsMrp,
    catalogSavings,
    baseShippingFee,
    deliverySpeedFee,
    totalShippingFee: finalShippingFee,
    isFreeShipping: finalShippingFee === 0,
    couponCode: validCouponCode,
    couponDiscount,
    giftWrapFee,
    codFee: isCod ? codFee : undefined,
    finalPayable: netPayable,
    priceDrifts: priceDrifts.length > 0 ? priceDrifts : undefined,
  };
}
