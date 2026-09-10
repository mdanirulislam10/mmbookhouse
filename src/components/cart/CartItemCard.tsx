'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Trash2,
  Bookmark,
  Share2,
  Check,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { CartItem } from '@/types/cart';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartActions } from '@/hooks/useCartStore';
import { getCartDictionary } from '@/lib/i18n/cartDictionary';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { SaveForLaterAction } from './SaveForLaterAction';

export interface CartItemCardProps {
  item: CartItem;
  isSelected?: boolean;
  onToggleSelect?: (id: string, selected: boolean) => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
  onSaveForLater?: (id: string) => void;
  className?: string;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  isSelected = true,
  onToggleSelect,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
  className = '',
}) => {
  const { language, isBengali } = useLanguage();
  const dict = getCartDictionary(language);
  const cartActions = useCartActions();

  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resolved values & fallbacks
  const checked = item.isSelected ?? isSelected;
  const bookSlugOrId = item.slug || item.bookId || item.id;
  const bookUrl = `/book/${bookSlugOrId}`;

  const primaryTitle = isBengali
    ? item.titleBn || item.title
    : item.title || item.titleBn;

  const secondaryTitle = isBengali
    ? item.title && item.title !== primaryTitle ? item.title : null
    : item.titleBn && item.titleBn !== primaryTitle ? item.titleBn : null;

  const authorDisplay = isBengali
    ? item.authorBn || item.author
    : item.author || item.authorBn;

  const publisherDisplay = isBengali
    ? item.publisherBn || item.publisher
    : item.publisher || item.publisherBn;

  const hasSavings = item.mrp > item.price;
  const savingsAmount = hasSavings ? item.mrp - item.price : 0;
  const discountPercent = hasSavings ? Math.round((savingsAmount / item.mrp) * 100) : 0;

  const isOutOfStock = item.inStock === false;
  const isLowStock = !isOutOfStock && Boolean(item.stockCount && item.stockCount <= 5);

  // Handlers
  const handleQuantityChange = (newQty: number) => {
    if (newQty <= 0) {
      if (onRemove) onRemove(item.id);
      else cartActions.removeItem(item.id);
      return;
    }
    if (item.maxQuantity && newQty > item.maxQuantity) return;
    if (onUpdateQuantity) {
      onUpdateQuantity(item.id, newQty);
    } else {
      cartActions.updateQuantity(item.id, newQty);
    }
  };

  const handleRemove = () => {
    if (onRemove) onRemove(item.id);
    else cartActions.removeItem(item.id);
  };

  const handleSaveForLater = () => {
    if (onSaveForLater) onSaveForLater(item.id);
    else cartActions.saveForLater(item.id);
  };

  const handleShare = async () => {
    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${bookUrl}`
      : `https://mmbookhouse.in${bookUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: primaryTitle,
          text: `${primaryTitle} - M.M Book House Malda`,
          url: fullUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if share was aborted or failed
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback silently
      }
    }
  };

  return (
    <div
      className={`py-4 sm:py-5 border-b border-gray-200 transition-colors ${
        !checked || isOutOfStock ? 'opacity-70 bg-gray-50/50' : ''
      } ${className}`}
    >
      {/* Task 16: Price Drop Alert Notification Banner */}
      {item.priceDroppedAmount && item.priceDroppedAmount > 0 && (
        <div className="mb-3 flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 font-medium">
          <span className="font-bold text-blue-700">📢 {isBengali ? 'সুসংবাদ!' : 'Great News!'}</span>
          <span>
            {isBengali
              ? `কার্টে রাখার পর এই বইটির দাম ₹${toBengaliNumerals(item.priceDroppedAmount)} কমেছে।`
              : `Price dropped by ${formatINR(item.priceDroppedAmount, language)} since you added it.`}
          </span>
        </div>
      )}

      {/* Task 17: Out of Stock Prominent Alert Banner */}
      {isOutOfStock && (
        <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-900 font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            {isBengali
              ? 'দুঃখিত, এই বইটির স্টক এইমাত্র শেষ হয়ে গেছে। চেকআউটের হিসাব থেকে এটি বাদ রাখা হয়েছে।'
              : 'Sorry, this item just went out of stock and is excluded from the checkout total.'}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        {/* Checkbox and Cover Image Area */}
        <div className="flex items-start gap-3 shrink-0">
          {/* Integrated Selection Checkbox (Task 15 & 17 support) */}
          <label className={`mt-2.5 select-none ${isOutOfStock ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={checked && !isOutOfStock}
              disabled={isOutOfStock}
              onChange={(e) => onToggleSelect?.(item.id, e.target.checked)}
              aria-label={`Select ${primaryTitle}`}
              className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer disabled:cursor-not-allowed"
            />
          </label>

          {/* Book Cover Thumbnail with Next/Image and Fallback */}
          <Link
            href={bookUrl}
            className="group relative w-20 h-28 sm:w-24 sm:h-32 bg-amber-50/70 rounded-md border border-amber-200/70 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs hover:border-amber-400 transition-all"
          >
            {item.coverImage && !imageError ? (
              <Image
                src={item.coverImage}
                alt={primaryTitle}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-amber-700/80 p-2 text-center">
                <BookOpen className="w-8 h-8 text-amber-600/70 mb-1" />
                <span className="text-[9px] font-semibold line-clamp-2 leading-tight">
                  {primaryTitle}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Book Details and Action Links */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-4">
            {/* Title, Subtitle, Author, Publisher, and Format */}
            <div className="space-y-1">
              {/* Bilingual Book Title */}
              <Link
                href={bookUrl}
                className="group block"
              >
                <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-amber-800 transition-colors leading-snug">
                  {primaryTitle}
                </h3>
                {secondaryTitle && (
                  <p className="text-xs sm:text-sm text-gray-500 font-normal leading-tight group-hover:text-gray-700 mt-0.5">
                    {secondaryTitle}
                  </p>
                )}
              </Link>

              {/* Author & Publisher Metadata */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                {authorDisplay && (
                  <span className="font-medium text-gray-800">{authorDisplay}</span>
                )}
                {publisherDisplay && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">
                      {dict.itemsList.publisherLabel} <span className="text-gray-700">{publisherDisplay}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Binding Format Badge (Paperback / Hardcover) */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  <Layers className="w-3 h-3 text-gray-500" />
                  {item.binding === 'hardcover'
                    ? dict.itemsList.hardcover
                    : dict.itemsList.paperback}
                </span>

                {/* Stock Status Badge */}
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    {dict.itemsList.outOfStock}
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {dict.itemsList.onlyLeft(item.stockCount || 1)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {dict.itemsList.inStock}
                  </span>
                )}
              </div>
            </div>

            {/* Price Display Section (Unit Selling Price, Struck-through MRP, Savings Amount) */}
            <div className="mt-2 sm:mt-0 text-left sm:text-right shrink-0">
              <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0.5">
                <span className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatINR(item.price, language)}
                </span>
                {hasSavings && (
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                      {formatINR(item.mrp, language)}
                    </span>
                    <span className="text-[11px] font-bold text-red-700 bg-red-50 px-1 rounded border border-red-100">
                      -{discountPercent}%
                    </span>
                  </div>
                )}
              </div>

              {hasSavings && (
                <div className="mt-1">
                  <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {dict.itemsList.saveAmount(formatINR(savingsAmount, language))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions Row: Quantity Selector, Delete, Save for Later, Share */}
          <div className="mt-4 pt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            {/* Task 13: Amazon Dropdown on Desktop vs Compact Stepper on Mobile */}
            {/* Desktop Amazon-style Dropdown */}
            <div className="hidden sm:inline-flex items-center rounded-lg border border-gray-300 bg-white shadow-2xs overflow-hidden px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-400 transition-colors">
              <span className="text-gray-500 mr-1.5">{isBengali ? 'পরিমাণ:' : 'Qty:'}</span>
              <select
                value={item.quantity > 10 ? '10+' : item.quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '0') {
                    handleRemove();
                  } else if (val === '10+') {
                    const custom = prompt(
                      isBengali ? 'প্রয়োজনীয় বইয়ের সংখ্যা লিখুন:' : 'Enter desired quantity:',
                      String(item.quantity)
                    );
                    const parsed = parseInt(custom || '', 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      handleQuantityChange(parsed);
                    }
                  } else {
                    handleQuantityChange(parseInt(val, 10));
                  }
                }}
                aria-label={`${primaryTitle} quantity`}
                className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer pr-1"
              >
                <option value="0">{isBengali ? '০ (মুছে ফেলুন)' : '0 (Delete)'}</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {isBengali ? toBengaliNumerals(n) : n}
                  </option>
                ))}
                {item.quantity > 10 && (
                  <option value="10+">
                    {isBengali ? `${toBengaliNumerals(item.quantity)}+` : `${item.quantity}+`}
                  </option>
                )}
              </select>
            </div>

            {/* Mobile Compact Stepper Control */}
            <div className="sm:hidden inline-flex items-center rounded-lg border border-gray-300 bg-white shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1}
                aria-label="Decrease quantity"
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span
                aria-live="polite"
                className="px-2.5 py-0.5 text-xs font-bold text-gray-900 min-w-[1.75rem] text-center select-none"
              >
                {isBengali ? toBengaliNumerals(item.quantity) : item.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={Boolean(item.maxQuantity && item.quantity >= item.maxQuantity)}
                aria-label="Increase quantity"
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-gray-300 hidden sm:inline">|</span>

            {/* Action Link: Delete */}
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-red-600 hover:underline transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{dict.itemsList.delete}</span>
            </button>

            <span className="text-gray-300 hidden sm:inline">|</span>

            {/* Action Link: Save for Later */}
            {onSaveForLater ? (
              <button
                type="button"
                onClick={handleSaveForLater}
                className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:text-indigo-900 hover:underline transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{dict.itemsList.saveForLater}</span>
              </button>
            ) : (
              <SaveForLaterAction
                itemId={item.id}
                itemTitle={item.title}
                itemTitleBn={item.titleBn}
                variant="link"
                showIcon={true}
              />
            )}

            <span className="text-gray-300 hidden sm:inline">|</span>

            {/* Action Link: Share */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 hover:underline transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">{dict.itemsList.linkCopied}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{dict.itemsList.share}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
