'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, Gift, Tag, X, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getCartDictionary } from '@/lib/i18n/cartDictionary';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { InlineCheckoutAuthDrawer } from '@/components/auth/InlineCheckoutAuthDrawer';
import { FreeDeliveryProgressBar } from './FreeDeliveryProgressBar';
import { FreeDeliveryCelebration } from './FreeDeliveryCelebration';
import { CartCouponBox } from './CartCouponBox';

interface CartOrderSummaryProps {
  className?: string;
  onProceedToCheckout?: () => void;
}

export const CartOrderSummary: React.FC<CartOrderSummaryProps> = ({
  className = '',
  onProceedToCheckout,
}) => {
  const router = useRouter();
  const { isLoggedIn } = useAuthSession();
  const {
    selectedCount,
    selectedSubtotal,
    selectedSavings,
    selectedMrp,
    appliedCoupon,
    couponDiscount,
    isFreeDelivery,
    shippingFee,
    finalPayable,
    freeDeliveryThreshold,
    applyCoupon,
    removeCoupon,
    isGiftOrder,
    giftMessage,
    setGiftOption,
  } = useCart();
  const { language, isBengali } = useLanguage();
  const dict = getCartDictionary(language);
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);

  return (
    <aside
      aria-label={dict.orderSummary.title}
      className={`sticky top-20 bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 transition-all ${className}`}
    >
      {/* Task 31 & 32: Free Delivery Progress Bar & Celebration Badge */}
      <div className="mb-4 pb-4 border-b border-gray-100 space-y-3">
        {isFreeDelivery ? (
          <FreeDeliveryCelebration
            forceShow={true}
            threshold={freeDeliveryThreshold}
            subtotal={selectedSubtotal}
            language={language}
          />
        ) : (
          <FreeDeliveryProgressBar
            subtotal={selectedSubtotal}
            threshold={freeDeliveryThreshold}
            language={language}
          />
        )}
      </div>

      {/* Task 18: 4-Step Comprehensive Order Summary Breakdown */}
      <div className="space-y-2.5 mb-4 text-xs sm:text-sm">
        {/* Step 1: Total MRP */}
        {selectedMrp > selectedSubtotal && (
          <div className="flex items-center justify-between text-gray-500">
            <span>{isBengali ? 'বইগুলোর মোট MRP:' : 'Total MRP:'}</span>
            <span className="line-through font-mono">{formatINR(selectedMrp, language)}</span>
          </div>
        )}

        {/* Step 2: Catalog Savings */}
        {selectedSavings > 0 && (
          <div className="flex items-center justify-between text-emerald-700">
            <span>{isBengali ? 'ক্যাটালগ ছাড় (সাশ্রয়):' : 'Catalog Discount:'}</span>
            <span className="font-semibold font-mono">-{formatINR(selectedSavings, language)}</span>
          </div>
        )}

        {/* Selected Items Subtotal */}
        <div className="flex items-baseline justify-between text-gray-800">
          <span>{dict.orderSummary.subtotal(selectedCount)}</span>
          <span className="text-base font-bold text-gray-900 font-mono">
            {formatINR(selectedSubtotal, language)}
          </span>
        </div>

        {/* Step 3: Coupon Discount Line (Task 37) */}
        {appliedCoupon && couponDiscount > 0 && (
          <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
            <div className="flex items-center gap-1.5 min-w-0">
              <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold truncate">
                {appliedCoupon.coupon.code}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-900 font-mono">
                -{formatINR(couponDiscount, language)}
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                aria-label="Remove coupon"
                className="text-gray-400 hover:text-red-600 transition-colors p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Delivery Charge */}
        <div className="flex items-center justify-between text-gray-700">
          <span>{isBengali ? 'ডেলিভারি চার্জ:' : 'Delivery Fee:'}</span>
          <span className="font-semibold font-mono">
            {isFreeDelivery ? (
              <span className="text-emerald-700 font-bold uppercase">
                {isBengali ? 'ফ্রি (Free)' : 'FREE'}
              </span>
            ) : (
              formatINR(shippingFee, language)
            )}
          </span>
        </div>

        {/* Final Total / Final Payable */}
        <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
          <span className="text-base sm:text-lg font-bold text-gray-950">
            {isBengali ? 'চূড়ান্ত প্রদেয় সাব-টোটাল:' : 'Final Total:'}
          </span>
          <span className="text-xl sm:text-2xl font-black text-gray-950 font-mono text-amber-800">
            {formatINR(finalPayable, language)}
          </span>
        </div>

        {/* Total Overall Savings Badge */}
        {(selectedSavings + couponDiscount) > 0 && (
          <div className="pt-1 flex justify-end">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {isBengali
                ? `আপনি মোট ${formatINR(selectedSavings + couponDiscount, language)} সাশ্রয় করেছেন!`
                : `Total savings: ${formatINR(selectedSavings + couponDiscount, language)}!`}
            </span>
          </div>
        )}
      </div>

      {/* Task 33 & 34: Order Summary Slim Promo Code Accordion & Pills */}
      <div className="mb-4 pt-3 border-t border-gray-100">
        <CartCouponBox
          appliedCoupon={appliedCoupon}
          onApplyCoupon={async (code) => {
            const res = applyCoupon(code);
            if (!res.success) {
              return isBengali ? res.messageBn : res.message;
            }
            return true;
          }}
          onRemoveCoupon={async () => {
            removeCoupon();
          }}
          language={language}
        />
      </div>

      {/* Task 19: Gift Option ("This order contains a gift") */}
      <div className="mb-5 pt-3 border-t border-gray-100">
        <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isGiftOrder}
            onChange={(e) => setGiftOption(e.target.checked, giftMessage)}
            className="mt-0.5 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
          />
          <div className="flex-1">
            <span className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              {dict.orderSummary.giftOptionLabel}
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isBengali
                ? 'প্যাকেজিংয়ে বইয়ের দামের ট্যাগ গোপন রাখা হবে।'
                : 'Price tag will be hidden on outer packaging.'}
            </p>
          </div>
        </label>

        {/* Expandable Greeting Message Box */}
        {isGiftOrder && (
          <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-2 animate-fadeIn">
            <label className="block text-xs font-semibold text-amber-950">
              {isBengali ? 'কাস্টম শুভেচ্ছা বার্তা (উপহারের সাথে যাবে):' : 'Custom Gift Message (Included with parcel):'}
            </label>
            <textarea
              rows={2}
              maxLength={200}
              value={giftMessage}
              onChange={(e) => setGiftOption(true, e.target.value)}
              placeholder={
                isBengali
                  ? 'যেমন: প্রিয় বন্ধু, শুভ জন্মদিন! পড়াশোনায় অনেক উন্নতি করো।'
                  : 'E.g., Dear friend, Happy Birthday! Best wishes for your studies.'
              }
              className="w-full text-xs p-2 rounded border border-amber-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
            <div className="flex justify-between text-[10px] text-amber-800/80">
              <span>{isBengali ? 'সর্বোচ্চ ২০০ অক্ষর' : 'Max 200 characters'}</span>
              <span>
                {isBengali
                  ? `${toBengaliNumerals(giftMessage.length)}/২০০`
                  : `${giftMessage.length}/200`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Primary Proceed to Checkout CTA (Task 21: Inline Auth Drawer Integration) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            if (selectedCount === 0) return;
            if (onProceedToCheckout) {
              onProceedToCheckout();
              return;
            }
            if (!isLoggedIn) {
              setIsAuthDrawerOpen(true);
              return;
            }
            router.push('/checkout');
          }}
          disabled={selectedCount === 0}
          className="w-full bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 px-4 rounded-full shadow-sm text-center transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
        >
          <span>
            {isBengali
              ? `অর্ডার সম্পন্ন করুন (${toBengaliNumerals(selectedCount)}টি বই - ${formatINR(finalPayable, language)})`
              : `${dict.orderSummary.proceedToCheckout} (${selectedCount} items)`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {selectedCount === 0 && (
          <p className="text-center text-xs text-amber-700 font-medium">
            {isBengali
              ? 'অর্ডার করতে অনুগ্রহ করে অন্তত একটি বই নির্বাচন করুন।'
              : 'Please select at least one item to proceed.'}
          </p>
        )}
      </div>

      {/* Task 21: Inline Checkout Auth Slide-Over Drawer */}
      <InlineCheckoutAuthDrawer
        isOpen={isAuthDrawerOpen}
        onClose={() => setIsAuthDrawerOpen(false)}
        onAuthSuccess={() => {
          setIsAuthDrawerOpen(false);
          router.push('/checkout');
        }}
      />

      {/* Trust & Safe Checkout Assurances */}
      <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
        <div className="flex items-center gap-2.5 text-xs text-gray-500">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{dict.orderSummary.secureCheckoutNotice}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{dict.orderSummary.fastDeliveryNotice}</span>
        </div>
      </div>
    </aside>
  );
};

export default CartOrderSummary;
