'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Zap,
  Lock,
  Gift,
  Heart,
  Check,
  Truck,
  AlertTriangle,
  Store,
  Flame,
  Bell,
} from 'lucide-react';
import { DetailedBookProduct, GiftOptionsState } from '@/types/pdp';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartStore } from '@/hooks/useCartStore';
import { useBuyNow } from '@/hooks/useBuyNow';
import { getStockUrgencyState } from '@/lib/services/pdpMetricsService';
import { PincodeDeliveryWidget } from './PincodeDeliveryWidget';
import { GiftOptionsWidget } from './GiftOptionsWidget';
import { StockNotifyModal } from './StockNotifyModal';
import { WishlistButton } from './WishlistButton';

interface StickyBuyBoxProps {
  book: DetailedBookProduct;
  selectedFormat?: 'paperback' | 'hardcover' | 'bundle';
  isUsedSelected?: boolean;
  className?: string;
}

export const StickyBuyBox: React.FC<StickyBuyBoxProps> = ({
  book,
  selectedFormat = 'paperback',
  isUsedSelected = false,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();
  const { addItem, triggerBounce } = useCartStore();
  const { executeBuyNow, isProcessing: isBuyNowProcessing } = useBuyNow();

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [giftOptions, setGiftOptions] = useState<GiftOptionsState | undefined>(undefined);
  const [showStockModal, setShowStockModal] = useState(false);

  // Variant resolution
  const variant = book.variants?.find((v) => v.format === selectedFormat);
  const currentPrice = isUsedSelected
    ? book.usedBookOption?.price || book.price
    : variant
    ? variant.price
    : book.price;
  const currentMrp = isUsedSelected
    ? book.usedBookOption?.mrp || book.mrp
    : variant
    ? variant.mrp
    : book.mrp;

  const currentStock = isUsedSelected
    ? 1
    : variant
    ? variant.stockQuantity
    : book.stockQuantity ?? (book.inStock ? 8 : 0);

  const stockState = getStockUrgencyState(
    currentStock,
    book.inStock !== false && currentStock > 0,
    {
      isPreorder: Boolean(book.isPreorder),
      expectedReleaseDate: book.expectedReleaseDate,
      expectedReleaseDateBn: book.expectedReleaseDateBn,
      restockDays: book.restockDays,
    }
  );

  const isPreorder = stockState.isPreorder;
  const isBackInStockSoon = stockState.isBackInStockSoon;
  const isOutOfStock = stockState.status === 'out_of_stock' || (!stockState.isPurchasable && !isPreorder);

  const handleAddToCart = () => {
    if (isOutOfStock && !isPreorder) return;
    addItem({
      id: isUsedSelected
        ? `cart-used-${book.bookId}`
        : `cart-${book.bookId}-${selectedFormat}`,
      bookId: book.bookId,
      title: `${book.title}${isUsedSelected ? ' (Used)' : selectedFormat !== 'paperback' ? ` (${selectedFormat})` : ''}`,
      titleBn: `${book.titleBn}${isUsedSelected ? ' (ব্যবহৃত)' : ''}`,
      author: book.author,
      price: currentPrice,
      mrp: currentMrp,
      quantity,
      coverImage: book.coverImage,
    });
    triggerBounce();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const handleBuyNow = () => {
    if (isOutOfStock && !isPreorder) return;
    executeBuyNow({
      book,
      quantity,
      format: selectedFormat,
      condition: isUsedSelected ? 'used' : 'new',
      customPrice: currentPrice,
      customMrp: currentMrp,
      giftOptions,
    });
  };

  return (
    <aside
      aria-label="পারচেজ বাই বক্স"
      className={`bg-white rounded-2xl border border-gray-300/90 p-4 sm:p-5 shadow-md space-y-4 select-none ${className}`}
    >
      {/* Price Header */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[#b12704]">
            {formatINR(currentPrice, language)}
          </span>
          <span className="text-xs text-gray-400 line-through">
            {formatINR(currentMrp, language)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mt-1">
          <Truck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {currentPrice >= 499
              ? (isBengali ? 'বিনামূল্যে ডেলিভারি (FREE Delivery)' : 'FREE Delivery')
              : (isBengali ? 'স্ট্যান্ডার্ড ডেলিভারি: মাত্র ₹৪০' : 'Standard Delivery: ₹40')}
          </span>
        </div>
      </div>

      {/* Module 8 (Tasks 1-10): Modernized Pincode Delivery & Serviceability Widget */}
      <PincodeDeliveryWidget bookPrice={currentPrice} compact={true} className="mt-1" />

      {/* Tasks 31-40: Comprehensive Live Stock Urgency Status */}
      <div className="pt-2 border-t border-gray-100 space-y-1.5">
        {stockState.status === 'preorder' ? (
          /* Task 37: Pre-order facility for upcoming books */
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950 flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0 animate-ping" />
            <div>
              <span className="block text-amber-900 font-black">{stockState.badgeTextBn}</span>
              <span className="text-[11px] font-medium text-amber-850 block mt-0.5">
                {isBengali ? stockState.messageBn : stockState.messageEn}
              </span>
            </div>
          </div>
        ) : stockState.status === 'back_in_stock_soon' ? (
          /* Task 38: Back in stock soon badge */
          <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-300 text-xs font-bold text-sky-950 flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0" />
            <div>
              <span className="block text-sky-900 font-black">{stockState.badgeTextBn}</span>
              <span className="text-[11px] font-medium text-sky-800 block mt-0.5">
                {isBengali ? stockState.messageBn : stockState.messageEn}
              </span>
            </div>
          </div>
        ) : stockState.status === 'ultra_urgency' ? (
          /* Task 34: Ultra-urgency for last copy (Stock = 1) */
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-xs font-bold text-rose-950 flex items-center gap-2 animate-pulse">
            <Flame className="w-4 h-4 text-rose-600 fill-rose-500 shrink-0" />
            <span className="leading-tight">
              {isBengali ? stockState.messageBn : stockState.messageEn}
            </span>
          </div>
        ) : stockState.status === 'low_stock' ? (
          /* Task 33: Low stock urgency ribbon (Stock = 2 or 3) */
          <div className="text-xs sm:text-sm font-bold text-[#b12704] flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{isBengali ? stockState.messageBn : stockState.messageEn}</span>
          </div>
        ) : stockState.status === 'in_stock' ? (
          /* Task 32: In stock */
          <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>{isBengali ? stockState.messageBn : stockState.messageEn}</span>
          </div>
        ) : (
          /* Task 35: Out of stock */
          <div className="text-sm font-bold text-red-600">
            {isBengali ? stockState.messageBn : stockState.messageEn}
          </div>
        )}

        {/* Task 39: 5-Minute Cart Reservation Notice for limited stock */}
        {stockState.status === 'ultra_urgency' && (
          <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>
              {isBengali
                ? '🔒 চেকআউটে শেষ কপিটি ৫ মিনিটের জন্য সংরক্ষিত থাকবে।'
                : '🔒 Last copy reserved for 5 minutes during checkout.'}
            </span>
          </div>
        )}

        {/* Malda Counter Store Pickup Quick Pill */}
        {book.inStoreMaldaStock && book.inStoreMaldaStock > 0 && (
          <div className="mt-2 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-950 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">
              {isBengali
                ? `মালদা কাউন্টারে ${toBengaliNumerals(book.inStoreMaldaStock)} কপি সরাসরি প্রস্তুত`
                : `${book.inStoreMaldaStock} copies ready at Malda Store`}
            </span>
          </div>
        )}
      </div>

      {/* Quantity Dropdown */}
      {!isOutOfStock && !isBackInStockSoon && (
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="pdp-quantity" className="font-bold text-gray-700">
            {isBengali ? 'পরিমাণ (Quantity):' : 'Quantity:'}
          </label>
          <select
            id="pdp-quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-hidden focus:border-amber-500 cursor-pointer"
          >
            {[1, 2, 3, 4, 5].map((q) => (
              <option key={q} value={q}>
                {isBengali ? toBengaliNumerals(q) : q}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Amazon Core Action Buttons */}
      <div className="space-y-2.5 pt-1">
        {isPreorder ? (
          /* Task 37: Pre-order CTA Button */
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isBuyNowProcessing}
            className="w-full py-2.5 px-4 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-[#ff9900] hover:bg-[#e68a00] active:bg-[#cc7a00] text-gray-950 border border-[#cc7a00]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>
              {isBengali
                ? 'অগ্রিম বুকিং করুন (Pre-order Now)'
                : 'Pre-order Now'}
            </span>
          </button>
        ) : isOutOfStock || isBackInStockSoon ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowStockModal(true)}
              className="w-full py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Bell className="w-4 h-4" />
              <span>
                {isBengali
                  ? 'স্টকে আসলে জানান (Notify Me on WhatsApp)'
                  : 'Notify Me on WhatsApp'}
              </span>
            </button>
            <p className="text-[11px] text-center text-gray-500">
              {isBengali
                ? 'বইটি দোকানে মজুত হওয়ামাত্র আপনার হোয়াটসঅ্যাপে সরাসরি মেসেজ পাঠানো হবে।'
                : 'We will notify you immediately once copies are available.'}
            </p>
          </div>
        ) : (
          <>
            {/* Yellow Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                isAdded
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isBengali ? 'কার্টে যুক্ত হয়েছে!' : 'Added to Cart!'}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{isBengali ? 'কার্টে যোগ করুন (Add to Cart)' : 'Add to Cart'}</span>
                </>
              )}
            </button>

            {/* Orange 1-Click Buy Now Button */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isBuyNowProcessing}
              className="w-full py-2.5 px-4 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs bg-[#ffa41c] hover:bg-[#fa8900] active:bg-[#f07c00] text-gray-950 border border-[#e39016]"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isBengali ? '১-ক্লিকে এখনই কিনুন (Buy Now)' : 'Buy Now'}</span>
            </button>
          </>
        )}
      </div>

      {/* Security & Seller Details */}
      <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5 text-gray-700">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <span>{isBengali ? 'সিকিউর ট্রানজ্যাকশন (SSL Encrypted)' : 'Secure Transaction'}</span>
        </div>

        <div className="flex justify-between pt-1">
          <span>{isBengali ? 'প্রেরক:' : 'Dispatches from:'}</span>
          <strong className="text-gray-700">M.M Book House Malda</strong>
        </div>

        <div className="flex justify-between">
          <span>{isBengali ? 'বিক্রেতা:' : 'Sold by:'}</span>
          <strong className="text-gray-700">{book.publisher || 'এম.এম বুক হাউস'}</strong>
        </div>
      </div>

      {/* Task 40: Interactive Amazon Gift Options Widget */}
      <div className="pt-2 border-t border-gray-100">
        <GiftOptionsWidget
          value={giftOptions}
          onChange={setGiftOptions}
        />
      </div>

      {/* Task 37: Dedicated Wishlist Action Button */}
      <div className="pt-1">
        <WishlistButton
          bookId={book.bookId}
          variant="button"
          showText={true}
          className="w-full justify-center"
        />
      </div>

      {/* Task 38: In-Stock / WhatsApp Alert Notification Modal */}
      <StockNotifyModal
        book={book}
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
      />
    </aside>
  );
};
