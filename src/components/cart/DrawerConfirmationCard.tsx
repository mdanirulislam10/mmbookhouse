'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Truck, BookOpen, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { CartItem } from '@/types/cart';

interface DrawerConfirmationCardProps {
  item?: CartItem | null;
  onCloseDrawer?: () => void;
  onProceedToCheckout?: () => void;
  className?: string;
}

const FREE_DELIVERY_THRESHOLD = 499;

/**
 * Module 10 (Task 2): Confirmation Summary Card
 * - When an item is added, displays this dedicated confirmation card at the top of the side drawer
 * - Checkmark icon / "Added to Cart / কার্টে যুক্ত হয়েছে" badge
 * - Book thumbnail, Bengali & English title, author, and price with savings
 * - Subtotal of all active items and total book count
 * - Compact Free Delivery progress indicator ("আর মাত্র ₹... এর বই কিনলে ফ্রি ডেলিভারি")
 * - Prominent Amazon-Yellow "Proceed to Buy (X books - ₹Y)" CTA button
 * - "View Cart" secondary button linking to /cart
 * - Smooth entrance animation (slide down / fade in)
 */
export const DrawerConfirmationCard: React.FC<DrawerConfirmationCardProps> = ({
  item,
  onCloseDrawer,
  onProceedToCheckout,
  className = '',
}) => {
  const { lastAddedItem, totalCount, subtotal } = useCart();
  const { language, isBengali } = useLanguage();

  const activeItem = item || lastAddedItem;

  if (!activeItem) return null;

  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const amountNeeded = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryProgressPercent = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  const itemSavings = activeItem.mrp > activeItem.price ? activeItem.mrp - activeItem.price : 0;
  const savingsPercent = activeItem.mrp > activeItem.price
    ? Math.round(((activeItem.mrp - activeItem.price) / activeItem.mrp) * 100)
    : 0;

  return (
    <div
      className={`bg-white dark:bg-[#1f2937] border border-emerald-200/90 dark:border-emerald-800/80 rounded-xl shadow-xs p-3.5 space-y-3 animate-slide-down-fade ${className}`}
      role="region"
      aria-label={isBengali ? 'কার্ট কনফার্মেশন সামারি' : 'Cart Confirmation Summary'}
    >
      {/* 1. Checkmark icon / "Added to Cart / কার্টে যুক্ত হয়েছে" Badge */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-emerald-100 dark:border-emerald-900/40">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{isBengali ? 'কার্টে যুক্ত হয়েছে' : 'Added to Cart'}</span>
          <span className="text-[11px] font-normal text-emerald-600/80 dark:text-emerald-400/80 hidden xs:inline">
            / {isBengali ? 'Added to Cart' : 'কার্টে যুক্ত হয়েছে'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
          {isBengali ? `পরিমাণ: ${toBengaliNumerals(activeItem.quantity || 1)}` : `Qty: ${activeItem.quantity || 1}`}
        </span>
      </div>

      {/* 2. Book thumbnail, Bengali & English title, author, and price with savings */}
      <div className="flex gap-3 items-start">
        <div className="w-13 h-17 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
          {activeItem.coverImage ? (
            <Image
              src={activeItem.coverImage}
              alt={activeItem.title}
              fill
              sizes="52px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <BookOpen className="w-6 h-6 text-amber-600 opacity-70" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
            {isBengali ? (activeItem.titleBn || activeItem.title) : activeItem.title}
          </h3>
          {/* Secondary title in alternate language */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {isBengali ? activeItem.title : (activeItem.titleBn || activeItem.author)}
          </p>
          <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 font-medium truncate">
            {isBengali && activeItem.authorBn ? activeItem.authorBn : activeItem.author}
          </p>

          {/* Pricing & Savings */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs font-black text-gray-950 dark:text-white font-mono">
              {formatINR(activeItem.price, language)}
            </span>
            {activeItem.mrp > activeItem.price && (
              <>
                <span className="text-[10px] text-gray-400 line-through font-mono">
                  {formatINR(activeItem.mrp, language)}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/60">
                  {isBengali
                    ? `সাশ্রয় ${formatINR(itemSavings, language)} (${toBengaliNumerals(savingsPercent)}% ছাড়)`
                    : `Save ${formatINR(itemSavings, language)} (${savingsPercent}% off)`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Subtotal of all active items and total book count */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-300 font-semibold">
          {isBengali
            ? `কার্ট সাবটোটাল (${toBengaliNumerals(totalCount)}টি বই):`
            : `Cart Subtotal (${totalCount} ${totalCount === 1 ? 'book' : 'books'}):`}
        </span>
        <span className="text-sm font-black text-gray-950 dark:text-white font-mono">
          {formatINR(subtotal, language)}
        </span>
      </div>

      {/* 4. Compact Free Delivery progress indicator */}
      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <Truck className={`w-4 h-4 shrink-0 ${isFreeDelivery ? 'text-emerald-600' : 'text-amber-600'}`} />
          <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">
            {isFreeDelivery ? (
              <span className="text-emerald-700 dark:text-emerald-400">
                {isBengali ? '🎉 অভিনন্দন! আপনি ফ্রি ডেলিভারি পেয়েছেন!' : '🎉 Qualified for FREE Delivery!'}
              </span>
            ) : (
              <span>
                {isBengali
                  ? `আর মাত্র ${formatINR(amountNeeded, language)}-এর বই কিনলে ফ্রি ডেলিভারি`
                  : `Add ${formatINR(amountNeeded, language)} more to qualify for FREE Delivery`}
              </span>
            )}
          </p>
        </div>

        {/* Compact progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              isFreeDelivery ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${deliveryProgressPercent}%` }}
          />
        </div>
      </div>

      {/* 5. Prominent Amazon-Yellow "Proceed to Buy (X books - ₹Y)" CTA & Secondary "View Cart" */}
      <div className="space-y-2 pt-1">
        {onProceedToCheckout ? (
          <button
            type="button"
            onClick={onProceedToCheckout}
            className="w-full py-2.5 px-3 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 font-bold rounded-lg border border-[#fcd200] shadow-xs text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {isBengali
                ? `অর্ডার সম্পন্ন করুন (${toBengaliNumerals(totalCount)}টি বই • ${formatINR(subtotal, language)})`
                : `Proceed to Buy (${totalCount} books • ${formatINR(subtotal, language)})`}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        ) : (
          <Link
            href="/checkout"
            onClick={onCloseDrawer}
            className="w-full py-2.5 px-3 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 font-bold rounded-lg border border-[#fcd200] shadow-xs text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {isBengali
                ? `অর্ডার সম্পন্ন করুন (${toBengaliNumerals(totalCount)}টি বই • ${formatINR(subtotal, language)})`
                : `Proceed to Buy (${totalCount} books • ${formatINR(subtotal, language)})`}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        )}

        <Link
          href="/cart"
          onClick={onCloseDrawer}
          className="w-full py-2 px-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg border border-gray-300 dark:border-gray-600 text-xs shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
          <span>{isBengali ? 'কার্ট দেখুন ও পরিবর্তন করুন' : 'View Cart'}</span>
        </Link>

        {onCloseDrawer && (
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={onCloseDrawer}
              className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>{isBengali ? '← কেনাকাটা চালিয়ে যান (Continue Shopping)' : '← Continue Shopping / কেনাকাটা চালিয়ে যান'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
