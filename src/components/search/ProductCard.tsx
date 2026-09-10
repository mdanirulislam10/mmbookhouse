'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Star,
  ShoppingCart,
  Heart,
  Check,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { BookProduct, ViewMode } from '@/types/catalog-filter';
import { useCartStore } from '@/hooks/useCartStore';
import { useWishlistStore, useWishlistActions } from '@/hooks/useWishlistStore';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { getActiveDealForBook } from '@/lib/data/flashDeals';
import { AmazonDealBadge } from '@/components/deals/AmazonDealBadge';

interface ProductCardProps {
  book: BookProduct;
  viewMode?: ViewMode;
  isBengali?: boolean;
}

/**
 * Task 41–45: Modular Amazon-Style Book Product Card
 * - 7 Core Elements (Cover, Title, Author/Publisher, Star Rating, MRP/Price, Discount, Format)
 * - Task 42: Malda Prime Same-Day Delivery Promise
 * - Task 43: 1-Click Instant Add to Cart with Unified Global ID
 * - Task 44: Stock Scarcity Urgency Badge ("Only X left in stock")
 * - Task 45: In-Card Variant Switcher Chips (Paperback vs Hardcover)
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  book,
  viewMode = 'grid',
  isBengali = true,
}) => {
  const { language } = useLanguage();
  const { addItem, triggerBounce } = useCartStore();
  const { toggleItem: toggleWishlistItem } = useWishlistActions();
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  const [isAdded, setIsAdded] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'paperback' | 'hardcover' | 'bundle'>(
    book.binding || 'paperback'
  );

  // Active flash deal calculation
  const activeDeal = getActiveDealForBook(book.bookId);

  // In-Card Variant Calculation (Task 45)
  const variant = book.variants?.find((v) => v.format === selectedFormat);
  const basePrice = variant ? variant.price : book.price;
  const baseMrp = variant ? variant.mrp : book.mrp;
  const displayPrice = activeDeal ? activeDeal.dealPrice : basePrice;
  const displayMrp = activeDeal ? activeDeal.mrp : baseMrp;
  const rawDiscount =
    displayMrp && displayMrp > displayPrice
      ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
      : 0;
  const displayDiscount = activeDeal
    ? (isBengali ? `${toBengaliNumerals(activeDeal.discountPercentage)}%` : `${activeDeal.discountPercentage}%`)
    : (isBengali ? `${toBengaliNumerals(rawDiscount)}%` : `${rawDiscount}%`);

  const inWish = isInWishlist(book.bookId);

  // Effective stock calculation (Task 44)
  const currentStock = variant ? variant.stockQuantity : book.stockQuantity ?? (book.inStock ? 5 : 0);
  const isLowStock = currentStock > 0 && currentStock <= 3;
  const isOutOfStock = !book.inStock || currentStock === 0;

  // 1-Click Add to Cart (Task 43) with Unified Cart Item ID
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOutOfStock) return;

    // UNIFIED GLOBAL CART ID (Matches Home page & Avoids Duplicates)
    addItem({
      id: `cart-${book.bookId}`,
      bookId: book.bookId,
      title: book.title,
      titleBn: book.titleBn,
      author: book.author,
      price: displayPrice,
      mrp: displayMrp,
      quantity: 1,
      maxQuantity: activeDeal ? activeDeal.maxPerCustomer || 1 : undefined,
      coverImage: book.coverImage,
    });

    triggerBounce();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  /* ========================================================================= */
  /* GRID VIEW (Adaptive 4 cols lg, 3 cols md, 2 cols mobile)                  */
  /* ========================================================================= */
  if (viewMode === 'grid') {
    return (
      <article
        className="bg-white rounded-xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 flex flex-col p-3 sm:p-4 relative group"
        aria-label={isBengali ? book.titleBn : book.title}
      >
        {/* Top Badges: Deal or Tag */}
        {activeDeal ? (
          <div className="absolute top-2.5 left-2.5 z-10">
            <AmazonDealBadge
              dealType={activeDeal.dealType}
              discountPercentage={activeDeal.discountPercentage}
            />
          </div>
        ) : book.badge ? (
          <span className="absolute top-2.5 left-2.5 z-10 bg-[#f08804] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
            {book.badge}
          </span>
        ) : null}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={() => toggleWishlistItem(book.bookId)}
          aria-label={inWish ? 'উইশলিস্ট থেকে মুছুন' : 'উইশলিস্টে যুক্ত করুন'}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shadow-2xs cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              inWish ? 'text-red-500 fill-red-500' : ''
            }`}
          />
        </button>

        {/* Cover Image Frame */}
        <Link
          href={`/book/${book.slug || book.bookId}`}
          className="block w-full h-40 sm:h-52 bg-gradient-to-br from-amber-50/60 to-orange-50/60 rounded-lg flex items-center justify-center p-2 mb-2.5 border border-amber-100/70 relative overflow-hidden group-hover:scale-[1.02] transition-transform"
        >
          {book.coverImage ? (
            <Image
              src={book.coverImage}
              alt={isBengali ? book.titleBn : book.title}
              fill
              sizes="(max-width: 640px) 180px, (max-width: 1024px) 240px, 280px"
              className="object-contain p-1 rounded"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600/70 mb-1.5" />
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 line-clamp-2 px-1">
                {isBengali ? book.titleBn : book.title}
              </span>
              <span className="text-[9px] text-gray-500 mt-1 truncate max-w-full">
                {book.publisher}
              </span>
            </div>
          )}
        </Link>

        {/* Category Pill & Rating */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-500 mb-1">
          <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[9px] truncate max-w-[100px]">
            {book.categoryName}
          </span>
          <div className="flex items-center gap-1 text-amber-500 font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{book.rating}</span>
            <span className="text-gray-400 text-[10px]">
              ({isBengali ? toBengaliNumerals(book.reviewsCount) : book.reviewsCount})
            </span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/book/${book.slug || book.bookId}`} className="block">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 mb-1 group-hover:text-amber-700 transition-colors min-h-[2.4rem]">
            {isBengali ? book.titleBn : book.title}
          </h3>
        </Link>

        {/* Author & Publisher */}
        <p className="text-[11px] text-gray-500 mb-2 truncate">
          {isBengali ? 'লেখক: ' : 'By: '}
          <span className="font-medium text-gray-800">{book.author}</span>
        </p>

        {/* Task 45: In-Card Variant Switcher Chips */}
        {book.variants && book.variants.length > 1 && (
          <div className="flex items-center gap-1 mb-2 pt-1 border-t border-gray-100">
            {book.variants.map((v) => {
              const active = selectedFormat === v.format;
              return (
                <button
                  key={v.format}
                  type="button"
                  onClick={() => setSelectedFormat(v.format)}
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isBengali ? v.formatBn : v.format}: ₹{isBengali ? toBengaliNumerals(v.price) : v.price}
                </button>
              );
            })}
          </div>
        )}

        {/* Pricing & Cart Action Block */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span
              className={`text-sm sm:text-base font-black ${
                activeDeal ? 'text-[#cc0c39]' : 'text-gray-950'
              }`}
            >
              {formatINR(displayPrice, language)}
            </span>
            <span className="text-[11px] text-gray-400 line-through">
              {formatINR(displayMrp, language)}
            </span>
            <span
              className={`text-[10px] font-bold ${
                activeDeal ? 'text-[#cc0c39]' : 'text-green-700'
              }`}
            >
              {activeDeal
                ? `${toBengaliNumerals(activeDeal.discountPercentage)}% ${isBengali ? 'ছাড়' : 'off'}`
                : `${displayDiscount} ${isBengali ? 'ছাড়' : 'off'}`}
            </span>
          </div>

          {/* Task 42: Malda Prime Delivery Promise Badge */}
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-800 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-200/60 mt-1 font-medium">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
            <span className="truncate">
              {book.isMaldaPrime ?? true
                ? (isBengali ? 'কাল বিকেল ৫টার মধ্যে ডেলিভারি' : 'Get it by Tomorrow, 5 PM')
                : (isBengali ? 'মালদা টাউনে সেম-ডে ডেলিভারি' : 'Malda Same-Day Delivery')}
            </span>
          </div>

          {/* Task 44: Stock Scarcity Urgency Alert */}
          {isLowStock ? (
            <div className="text-[10px] font-bold text-[#b12704] flex items-center gap-1 mt-0.5 animate-pulse">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>
                {isBengali
                  ? `স্টকে মাত্র ${toBengaliNumerals(currentStock)}টি কপি বাকি!`
                  : `Only ${currentStock} left in stock - order soon`}
              </span>
            </div>
          ) : isOutOfStock ? (
            <div className="text-[10px] font-bold text-red-600 mt-0.5">
              {isBengali ? 'সাময়িকভাবে স্টক শেষ' : 'Currently out of stock'}
            </div>
          ) : null}

          {/* 1-Click Add to Cart Button (Task 43) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full mt-2 py-1.5 sm:py-2 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : isAdded
                ? 'bg-green-600 text-white shadow-xs'
                : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
            }`}
            aria-label={isBengali ? `${book.titleBn} কার্টে যোগ করুন` : `Add ${book.title} to cart`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isBengali ? 'যুক্ত হয়েছে' : 'Added'}</span>
              </>
            ) : isOutOfStock ? (
              <span>{isBengali ? 'স্টকে নেই' : 'Out of Stock'}</span>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isBengali ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </article>
    );
  }

  /* ========================================================================= */
  /* LIST VIEW (Amazon Horizontal Layout - Task 2)                             */
  /* ========================================================================= */
  return (
    <article
      className="bg-white rounded-xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-4 items-start relative group"
      aria-label={isBengali ? book.titleBn : book.title}
    >
      {/* Left: Book Cover Image Frame */}
      <Link
        href={`/book/${book.slug || book.bookId}`}
        className="block w-full sm:w-40 h-44 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shrink-0 flex items-center justify-center p-2 border border-amber-100 relative overflow-hidden group-hover:scale-[1.02] transition-transform"
      >
        {activeDeal ? (
          <div className="absolute top-2 left-2 z-10">
            <AmazonDealBadge
              dealType={activeDeal.dealType}
              discountPercentage={activeDeal.discountPercentage}
            />
          </div>
        ) : book.badge ? (
          <span className="absolute top-2 left-2 z-10 bg-[#f08804] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
            {book.badge}
          </span>
        ) : null}

        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={isBengali ? book.titleBn : book.title}
            fill
            sizes="160px"
            className="object-contain p-1 rounded"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <BookOpen className="w-12 h-12 text-amber-600/70 mb-2" />
            <span className="text-[11px] font-bold text-gray-800 line-clamp-2 px-1">
              {isBengali ? book.titleBn : book.title}
            </span>
          </div>
        )}
      </Link>

      {/* Middle: Details & Information */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
            {book.categoryName}
          </span>
          {book.binding && (
            <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded capitalize">
              {book.binding}
            </span>
          )}
          {book.edition && (
            <span className="text-[10px] text-gray-500">• {book.edition}</span>
          )}
        </div>

        <Link href={`/book/${book.slug || book.bookId}`} className="block">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug group-hover:text-amber-700 transition-colors">
            {isBengali ? book.titleBn : book.title}
          </h3>
        </Link>

        <p className="text-xs text-gray-600">
          {isBengali ? 'লেখক: ' : 'By: '}
          <span className="font-semibold text-gray-800">{book.author}</span>
          <span className="text-gray-400 mx-1.5">|</span>
          {isBengali ? 'প্রকাশনী: ' : 'Publisher: '}
          <span className="text-gray-700">{book.publisher}</span>
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{book.rating}</span>
          </div>
          <span className="text-xs text-gray-400">
            ({isBengali ? toBengaliNumerals(book.reviewsCount) : book.reviewsCount}{' '}
            {isBengali ? 'গ্রাহক রিভিউ' : 'reviews'})
          </span>
        </div>

        {/* Task 42: Malda Prime Delivery Promise */}
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-semibold mt-1">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
          <span>
            {book.isMaldaPrime ?? true
              ? (isBengali ? 'মালদা এক্সপ্রেস: কাল বিকেল ৫টার মধ্যে নিশ্চিত ডেলিভারি' : 'Malda Express: Get it by Tomorrow, 5 PM')
              : (isBengali ? 'মালদা টাউনে সেম-ডে ডেলিভারি উপলব্ধ' : 'Malda Town: Same Day Delivery Available')}
          </span>
        </div>

        {/* Task 45: In-Card Variant Switcher */}
        {book.variants && book.variants.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-gray-500 font-medium">
              {isBengali ? 'বাঁধাই বাছুন:' : 'Format:'}
            </span>
            {book.variants.map((v) => {
              const active = selectedFormat === v.format;
              return (
                <button
                  key={v.format}
                  type="button"
                  onClick={() => setSelectedFormat(v.format)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isBengali ? v.formatBn : v.format} (₹{isBengali ? toBengaliNumerals(v.price) : v.price})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Pricing Block & Action Button */}
      <div className="w-full sm:w-48 sm:border-l sm:border-gray-100 sm:pl-4 pt-3 sm:pt-0 flex flex-col justify-between self-stretch">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-black ${
                activeDeal ? 'text-[#cc0c39]' : 'text-gray-950'
              }`}
            >
              {formatINR(displayPrice, language)}
            </span>
            <span className="text-xs text-gray-400 line-through">
              {formatINR(displayMrp, language)}
            </span>
          </div>

          <div
            className={`text-xs font-bold mt-0.5 ${
              activeDeal ? 'text-[#cc0c39]' : 'text-green-700'
            }`}
          >
            {activeDeal
              ? (isBengali ? 'সীমিত সময়ের ফ্ল্যাশ ডিল মূল্য!' : 'Limited time flash deal price!')
              : `${displayDiscount} ${isBengali ? 'ছাড়' : 'off'}`}
          </div>

          {/* Stock Scarcity Urgency Alert (Task 44) */}
          {isLowStock ? (
            <div className="text-xs font-bold text-[#b12704] flex items-center gap-1 mt-2 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isBengali
                  ? `স্টকে মাত্র ${toBengaliNumerals(currentStock)}টি কপি বাকি!`
                  : `Only ${currentStock} left in stock`}
              </span>
            </div>
          ) : isOutOfStock ? (
            <div className="text-xs font-bold text-red-600 mt-2">
              {isBengali ? 'স্টক শেষ' : 'Out of Stock'}
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>{isBengali ? 'কাউন্টারে স্টকে রয়েছে' : 'In Stock'}</span>
            </div>
          )}
        </div>

        <div className="pt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : isAdded
                ? 'bg-green-600 text-white shadow-xs'
                : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
            }`}
            aria-label={isBengali ? `${book.titleBn} কার্টে যোগ করুন` : `Add ${book.title} to cart`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isBengali ? 'যুক্ত হয়েছে' : 'Added'}</span>
              </>
            ) : isOutOfStock ? (
              <span>{isBengali ? 'স্টকে নেই' : 'Out of Stock'}</span>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isBengali ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => toggleWishlistItem(book.bookId)}
            aria-label={inWish ? 'উইশলিস্ট থেকে মুছুন' : 'উইশলিস্টে যুক্ত করুন'}
            className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${inWish ? 'text-red-500 fill-red-500' : ''}`}
            />
          </button>
        </div>
      </div>
    </article>
  );
};
