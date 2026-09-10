'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import { calculateCartShipping } from '@/lib/services/shippingSyncService';
import { FreeShippingProgressBar } from '@/components/delivery/FreeShippingProgressBar';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { GuestCartBadge } from '@/components/cart/GuestCartBadge';

interface MiniCartFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const MiniCartFlyout: React.FC<MiniCartFlyoutProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const { items, totalCount, subtotal, totalSavings, removeItem } = useCart();
  const { language, isBengali } = useLanguage();
  const { location } = useDeliveryLocation();
  const dict = getHeaderDictionary(language);
  const containerRef = useRef<HTMLDivElement>(null);

  const shippingResult = calculateCartShipping({
    subtotal,
    pincode: location.pincode,
    fulfillmentMode: location.fulfillmentMode as any,
  });

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="false"
      aria-label={dict.cart.ariaLabel(totalCount)}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          onClose();
        }
      }}
      className={`absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-md shadow-2xl border border-gray-200 text-gray-900 z-[95] overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none ${className}`}
    >
      {/* Top Arrow Pointer (Aligned with Cart button) */}
      <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45" />

      {/* Header Bar */}
      <div className="bg-[#f0f2f2] px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800">
          <ShoppingCart className="w-4 h-4 text-amber-600" />
          <span>{dict.cart.label}</span>
          <span className="text-gray-500 font-normal">
            ({dict.cart.itemsCount(totalCount)})
          </span>
        </div>
        {totalCount > 0 && (
          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>সক্রিয় কার্ট</span>
          </span>
        )}
      </div>

      {/* Content Body */}
      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="p-6 text-center space-y-3">
          <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">
              {dict.cart.emptyCartTitle}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {dict.cart.emptyCartSubtitle}
            </p>
          </div>
          <Link
            href="/"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline pt-1"
          >
            <span>বইয়ের ক্যাটালগ ব্রাউজ করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        /* Filled Cart State */
        <div className="p-3">
          {/* Task 19 & 47: Unified Free Shipping Progress Bar */}
          <div className="mb-2.5">
            <FreeShippingProgressBar currentAmount={subtotal} compact={true} />
          </div>

          {/* Scrollable Item List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-1 space-y-2">
            {items.slice(0, 4).map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center gap-3">
                {/* Book Thumbnail Placeholder */}
                <div className="w-10 h-13 bg-amber-50 rounded border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
                  <BookOpen className="w-5 h-5 opacity-70" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-semibold text-gray-900 truncate leading-tight">
                    {isBengali ? item.titleBn : item.title}
                  </h5>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.author}</p>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="font-bold text-gray-900">
                      {formatINR(item.price, language)}{' '}
                      <span className="text-[10px] font-normal text-gray-500">
                        × {isBengali ? toBengaliNumerals(item.quantity) : item.quantity}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`${item.title} কার্ট থেকে মুছে ফেলুন`}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {items.length > 4 && (
              <div className="text-center pt-2 text-[11px] text-gray-500 font-medium">
                {isBengali
                  ? `+ আরও ${toBengaliNumerals(items.length - 4)}টি বই কার্টে রয়েছে`
                  : `+ ${items.length - 4} more books in cart`}
              </div>
            )}
          </div>

          {/* Subtotal & Savings Summary */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">{dict.cart.subtotal}:</span>
              <span className="text-sm font-black text-gray-950 font-mono">
                {formatINR(subtotal, language)}
              </span>
            </div>

            {/* Task 47: Shipping breakdown based on active pincode */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{isBengali ? 'ডেলিভারি ফি:' : 'Estimated Shipping:'}</span>
              <span className="font-semibold font-mono">
                {shippingResult.totalShippingFee === 0 ? (
                  <span className="text-emerald-700 font-bold">
                    {isBengali ? 'বিনামূল্যে (FREE)' : 'FREE'}
                  </span>
                ) : (
                  formatINR(shippingResult.totalShippingFee, language)
                )}
              </span>
            </div>

            {totalSavings > 0 && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-right font-medium">
                {isBengali
                  ? `মোট সাশ্রয়: ${formatINR(totalSavings, language)}`
                  : `Total Savings: ${formatINR(totalSavings, language)}`}
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-gray-200">
              <span className="text-gray-900">{isBengali ? 'সর্বমোট (Grand Total):' : 'Grand Total:'}</span>
              <span className="text-sm font-black text-[#b12704] font-mono">
                {formatINR(shippingResult.grandTotal, language)}
              </span>
            </div>
          </div>

          {/* Task 22: Open Guest Cart Badge */}
          <div className="mt-3">
            <GuestCartBadge variant="pill" className="w-full justify-center" />
          </div>

          {/* Action CTAs */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/cart"
              onClick={onClose}
              className="w-full text-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded border border-gray-300 text-xs transition-colors cursor-pointer"
            >
              {dict.cart.viewCart}
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full text-center py-2 px-3 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 font-bold rounded border border-[#fcd200] shadow-xs text-xs transition-all cursor-pointer truncate"
            >
              {dict.cart.proceedToCheckout}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
