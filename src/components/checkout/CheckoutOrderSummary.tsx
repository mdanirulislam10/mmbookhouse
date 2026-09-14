'use client';

import React, { useState } from 'react';
import { Tag, ShieldCheck, AlertTriangle, ArrowRight, Lock, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { CheckoutPricingBreakdown } from '@/types/checkout';
import { sanitizeCouponCode } from '@/lib/validations/checkout';

export interface CheckoutOrderSummaryProps {
  pricing: CheckoutPricingBreakdown;
  itemCount: number;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  onPlaceOrder?: () => void;
  isSubmitting?: boolean;
  canPlaceOrder?: boolean;
  className?: string;
}

/**
 * Module 12 - Task 7: Amazon Sticky Order Summary & Promo Card (Right 30% Column)
 * 
 * Features:
 * - Realtime breakdown of subtotal, shipping, speed fees, and gift wraps.
 * - Promo Coupon Input & Green Discount Line (Item 37, 38).
 * - Transparent Price Drift Notice (Item 29).
 * - Prominent "Place Your Order and Pay" CTA (Item 28).
 * - Guaranteed Savings Callout Badge.
 */
export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  pricing,
  itemCount,
  onApplyCoupon,
  onRemoveCoupon,
  onPlaceOrder,
  isSubmitting = false,
  canPlaceOrder = true,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [couponInput, setCouponInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeCouponCode(couponInput);
    if (!clean) return;
    setIsApplying(true);
    onApplyCoupon(clean);
    setTimeout(() => {
      setIsApplying(false);
      setCouponInput('');
    }, 400);
  };

  return (
    <aside
      aria-label="অর্ডার সামারি"
      className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-5 select-none ${className}`}
    >
      {/* Price Drift Alert Banner (Item 29) */}
      {pricing.priceDrifts && pricing.priceDrifts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 space-y-1 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{isBengali ? 'মূল্য পরিবর্তনের নোটিশ' : 'Price Update Notice'}</span>
          </div>
          {pricing.priceDrifts.map((drift, idx) => (
            <p key={idx} className="text-[11px] leading-relaxed">
              {isBengali ? drift.messageBn : `${drift.title}: Price changed from ₹${drift.oldPrice} to ₹${drift.newPrice}.`}
            </p>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-black text-gray-900">
          {isBengali ? 'অর্ডার সারাংশ' : 'Order Summary'}
        </h2>
        <span className="text-xs font-semibold text-gray-500">
          {itemCount} {isBengali ? 'টি বই' : itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Line Items Breakdown */}
      <div className="space-y-2.5 text-xs sm:text-sm text-gray-600">
        {/* Items Subtotal */}
        <div className="flex justify-between items-center">
          <span>{isBengali ? `বইয়ের মূল্য (${itemCount}টি আইটেম):` : `Items (${itemCount}):`}</span>
          <span className="font-semibold text-gray-900">₹{pricing.itemsSubtotal}</span>
        </div>

        {/* Shipping / Delivery */}
        <div className="flex justify-between items-center">
          <span>{isBengali ? 'ডেলিভারি / শিপিং ফি:' : 'Postage & Packing:'}</span>
          {pricing.baseShippingFee === 0 || pricing.isFreeShipping ? (
            <span className="font-bold text-emerald-700">
              {isBengali ? 'ফ্রি' : 'FREE'}
            </span>
          ) : (
            <span className="font-semibold text-gray-900">₹{pricing.baseShippingFee}</span>
          )}
        </div>

        {/* Speed Surcharge if any */}
        {pricing.deliverySpeedFee > 0 && (
          <div className="flex justify-between items-center text-amber-900">
            <span>{isBengali ? 'এক্সপ্রেস স্পিড সারচার্জ:' : 'Express Delivery Fee:'}</span>
            <span className="font-semibold">+₹{pricing.deliverySpeedFee}</span>
          </div>
        )}

        {/* Gift Wrap Fee if any */}
        {pricing.giftWrapFee > 0 && (
          <div className="flex justify-between items-center text-gray-600">
            <span>{isBengali ? 'গিফট র‍্যাপিং চার্জ:' : 'Gift Packaging:'}</span>
            <span className="font-semibold">+₹{pricing.giftWrapFee}</span>
          </div>
        )}

        {/* COD Handling Fee (Item 14) */}
        {pricing.codFee !== undefined && pricing.codFee > 0 && (
          <div className="flex justify-between items-center text-amber-900 bg-amber-50/60 px-2 py-1 rounded-md border border-amber-200/60">
            <span>{isBengali ? 'সিওডি ক্যাশ হ্যান্ডলিং চার্জ:' : 'COD Handling Fee:'}</span>
            <span className="font-semibold text-amber-950">+₹{pricing.codFee}</span>
          </div>
        )}

        {/* Green Coupon Discount Line (Item 38) */}
        {pricing.couponDiscount > 0 && (
          <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isBengali
                  ? `কুপন (${pricing.couponCode}):`
                  : `Coupon (${pricing.couponCode}):`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>-₹{pricing.couponDiscount}</span>
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="text-gray-400 hover:text-red-600 transition-colors p-0.5"
                title={isBengali ? 'কুপন সরান' : 'Remove coupon'}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200" />

        {/* Grand Total Row */}
        <div className="flex justify-between items-baseline pt-1">
          <span className="text-base font-black text-gray-900">
            {isBengali ? 'মোট প্রদেয় মূল্য:' : 'Order Total:'}
          </span>
          <span className="text-xl sm:text-2xl font-black text-gray-950">
            ₹{pricing.finalPayable}
          </span>
        </div>

        {/* Savings Callout */}
        {pricing.catalogSavings > 0 && (
          <div className="bg-emerald-50 text-emerald-900 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center justify-between">
            <span>{isBengali ? 'এই অর্ডারে আপনার মোট সাশ্রয়:' : 'Your Total Savings:'}</span>
            <span className="text-emerald-700 font-black">
              ₹{pricing.catalogSavings + pricing.couponDiscount}
            </span>
          </div>
        )}
      </div>

      {/* Promo Code Input Widget (Item 37) */}
      <div className="pt-3 border-t border-gray-100">
        <form onSubmit={handleApply} className="space-y-2">
          <label className="block text-xs font-bold text-gray-700">
            {isBengali ? 'প্রোমো কোড বা কুপন থাকলে যোগ করুন:' : 'Add Promo Code / Gift Voucher:'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME50"
                className="w-full text-xs font-mono pl-8 pr-2 py-2 border border-gray-300 rounded-lg uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={!couponInput.trim() || isApplying}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-gray-900 hover:bg-gray-800 active:bg-gray-950 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            >
              {isApplying ? '...' : isBengali ? 'প্রয়োগ' : 'Apply'}
            </button>
          </div>
        </form>
      </div>

      {/* Action Button (Desktop sticky card action) */}
      {onPlaceOrder && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={!canPlaceOrder || isSubmitting}
            className="w-full py-3.5 px-4 rounded-full font-black text-sm bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-950 border border-[#fcd200] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <span>{isBengali ? 'প্রসেসিং হচ্ছে...' : 'Processing...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-800" />
                <span>
                  {isBengali
                    ? `অর্ডার দিন ও পরিশোধ করুন (₹${pricing.finalPayable})`
                    : `Place Order & Pay (₹${pricing.finalPayable})`}
                </span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Trust Guarantee Footnote */}
      <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>{isBengali ? 'নিরাপদ ২৫৬-বিট SSL এনক্রিপশন' : 'Safe 256-Bit SSL Checkout'}</span>
      </div>
    </aside>
  );
};

export default CheckoutOrderSummary;
