'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CarouselProduct } from '@/types/carousel';
import { useCart } from '@/hooks/useCartStore';
import { getActiveDealForBook } from '@/lib/data/flashDeals';
import { AmazonDealBadge } from '@/components/deals/AmazonDealBadge';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import {
  X,
  Star,
  ShoppingCart,
  Zap,
  CheckCircle2,
  Truck,
  BookOpen,
  FileText,
  ShieldCheck,
  Plus,
  Minus,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface QuickViewModalProps {
  product: CarouselProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addItem, triggerBounce } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isInstantBuying, setIsInstantBuying] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Audit Point 4 & 7: Check active deal status and enforce 1-copy limit
  const activeDeal = product ? getActiveDealForBook(product.bookId) : null;
  const isDealActive = !!activeDeal;
  const currentPrice = product ? (isDealActive ? activeDeal.dealPrice : product.price) : 0;
  const currentMrp = product ? (isDealActive ? activeDeal.mrp : product.mrp) : 0;
  const currentDiscount = product ? (isDealActive ? activeDeal.discountPercentage : product.discountPercent) : 0;
  const isMax1Limit = isDealActive;
  const maxAllowedQty = isMax1Limit ? 1 : 10;

  // Reset state when opening a new product
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setIsAdded(false);
      setIsInstantBuying(false);
      // Focus close button for accessibility
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen, product]);

  // Handle ESC key to close modal & body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const savingsAmount = currentMrp - currentPrice;

  const handleAddToCart = () => {
    const finalQty = isMax1Limit ? 1 : quantity;
    addItem({
      id: `cart-${product.bookId}`,
      bookId: product.bookId,
      title: product.title,
      titleBn: product.titleBn,
      author: product.authorBn || product.author,
      price: currentPrice,
      mrp: currentMrp,
      quantity: finalQty,
      maxQuantity: isMax1Limit ? 1 : undefined,
      coverImage: product.coverImage,
    });
    triggerBounce();
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  // Audit Point 3: Safe instant buy without 404 navigation or screen freezing
  const handleInstantBuy = () => {
    handleAddToCart();
    setIsInstantBuying(true);
    setTimeout(() => {
      setIsInstantBuying(false);
      onClose();
    }, 600);
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(prev + 1, maxAllowedQty));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-book-title"
    >
      {/* Modal Dialog Body */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-y-auto border border-gray-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="মডাল বন্ধ করুন"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-gray-100/80 hover:bg-gray-200 text-gray-700 hover:text-gray-950 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 p-5 sm:p-7">
          {/* Left Column: Book Cover & Badges */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="relative w-full aspect-[3/4] max-w-[280px] sm:max-w-[320px] rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shadow-md">
              <Image
                src={product.coverImage}
                alt={product.titleBn}
                fill
                sizes="(max-width: 768px) 280px, 320px"
                priority
                className="object-cover object-center"
              />

              {/* Audit Point 4: Deal of the Day Badge vs Bestseller Badge */}
              {isDealActive ? (
                <div className="absolute top-2.5 left-2.5 z-10">
                  <AmazonDealBadge
                    discountPercentage={activeDeal.discountPercentage}
                    dealType={activeDeal.dealType}
                    isExpired={false}
                  />
                </div>
              ) : (
                product.badgeBn && (
                  <div className="absolute top-2.5 left-2.5 bg-amber-500 text-gray-950 font-extrabold text-xs px-2.5 py-1 rounded shadow-md">
                    {product.badgeBn}
                  </div>
                )
              )}

              {!isDealActive && product.discountPercent > 0 && (
                <div className="absolute top-2.5 right-2.5 bg-[#cc0c39] text-white font-extrabold text-xs px-2.5 py-1 rounded shadow-md">
                  {toBengaliNumerals(product.discountPercent)}% ছাড়
                </div>
              )}
            </div>

            {/* Quick Guarantees beneath image */}
            <div className="w-full max-w-[320px] mt-4 p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1.5 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-bold">
                <Truck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>{product.deliveryTimeBn || 'মালদা জেলায় ২-৩ দিনে ডেলিভারি'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>১০০% আসল বই • ক্যাশ অন ডেলিভারি (COD) উপলব্ধ</span>
              </div>
            </div>
          </div>

          {/* Right Column: Book Details & Actions */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              {/* Category & Edition */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                  {product.categoryBn}
                </span>
                {product.edition && (
                  <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {product.edition}
                  </span>
                )}
              </div>

              {/* Titles */}
              <h2
                id="modal-book-title"
                className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 font-bengali leading-snug"
              >
                {product.titleBn}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-sans mt-0.5">
                {product.title}
              </p>

              {/* Author & Publisher */}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-700">
                <span>
                  লেখক: <strong className="text-gray-900 font-semibold">{product.authorBn}</strong>
                </span>
                <span className="text-gray-300">•</span>
                <span>
                  প্রকাশনী: <strong className="text-gray-900 font-semibold">{product.publisherBn}</strong>
                </span>
              </div>

              {/* Rating & Reviews */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-current text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-900">
                  {toBengaliNumerals(product.rating)}
                </span>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                  ({toBengaliNumerals(product.reviewsCount)} টি রিভিউ)
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> স্টকে উপলব্ধ
                </span>
              </div>

              {/* Pricing Section (Audit Point 4) */}
              <div className="mt-4 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-gray-950">
                    {formatINR(currentPrice)}
                  </span>
                  {currentMrp > currentPrice && (
                    <>
                      <span className="text-xs sm:text-sm text-gray-500 line-through">
                        M.R.P.: {formatINR(currentMrp)}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#cc0c39]">
                        (বাঁচালেন {formatINR(savingsAmount)} বা {toBengaliNumerals(currentDiscount)}% ছাড়)
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {isDealActive
                    ? '🔥 বিশেষ লাইভ ডিল চলছে • সর্বোচ্চ ডিসকাউন্টে সরাসরি বুক করুন'
                    : 'সকল স্থানীয় কর অন্তর্ভুক্ত • দ্রুত শিপিং সুবিধা'}
                </p>
              </div>

              {/* Specifications Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-500 text-[10px]">বাঁধাই</div>
                  <div className="font-bold text-gray-900 truncate">
                    {product.bindingBn || 'পেপারব্যাক'}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-500 text-[10px]">পৃষ্ঠা সংখ্যা</div>
                  <div className="font-bold text-gray-900">
                    {product.pages ? `${toBengaliNumerals(product.pages)} পৃষ্ঠা` : 'উল্লেখ নেই'}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-500 text-[10px]">ভাষা মাধ্যম</div>
                  <div className="font-bold text-gray-900 truncate">
                    {product.languageBn || 'বাংলা'}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-500 text-[10px]">আইএসবিএন (ISBN)</div>
                  <div className="font-mono text-[11px] font-bold text-gray-900 truncate">
                    {product.isbn || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Table of Contents / Description Highlights */}
              {product.descriptionBn && (
                <div className="mt-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>সংক্ষিপ্ত পরিচিতি ও বিষয়বস্তু:</span>
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed bg-amber-50/30 p-2.5 rounded-lg border border-amber-100">
                    {product.descriptionBn}
                  </p>
                </div>
              )}

              {/* Table of contents snippet if available */}
              {product.tableOfContents && product.tableOfContents.length > 0 && (
                <div className="mt-3 space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>সূচিপত্র এক নজরে:</span>
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside pl-1">
                    {product.tableOfContents.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="truncate">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Actions Section */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              {/* Audit Point 7: Deal Item Limitation Notice */}
              {isMax1Limit && (
                <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200/80 rounded-lg text-xs text-rose-800 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>ফ্ল্যাশ ডিল অফার: প্রতি অ্যাকাউন্টে সর্বোচ্চ ১ কপি সীমাবদ্ধ</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Quantity Selector (Audit Point 7: disabled if isMax1Limit) */}
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-xs w-fit">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || isMax1Limit}
                    className="p-2 hover:bg-gray-100 disabled:opacity-40 transition-colors text-gray-700"
                    aria-label="সংখ্যা কমান"
                    title={isMax1Limit ? 'ডিল আইটেমে ১ কপি সীমাবদ্ধ' : 'সংখ্যা কমান'}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-gray-900">
                    {toBengaliNumerals(isMax1Limit ? 1 : quantity)}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= maxAllowedQty || isMax1Limit}
                    className="p-2 hover:bg-gray-100 disabled:opacity-40 transition-colors text-gray-700"
                    aria-label="সংখ্যা বাড়ান"
                    title={isMax1Limit ? 'ডিল আইটেমে ১ কপি সীমাবদ্ধ' : 'সংখ্যা বাড়ান'}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* 1-Click Add to Cart (Task 34) */}
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{toBengaliNumerals(isMax1Limit ? 1 : quantity)}টি কার্টে যোগ করা হয়েছে ✓</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>কার্টে যোগ করুন (Add to Cart)</span>
                    </>
                  )}
                </button>

                {/* Audit Point 3: Instant Buy Now Action Button (no 404 page route, instant cart add & close) */}
                <button
                  type="button"
                  onClick={handleInstantBuy}
                  disabled={isInstantBuying}
                  className="py-2.5 px-5 rounded-full font-bold text-xs sm:text-sm bg-[#ffa41c] hover:bg-[#fa8900] active:bg-[#e07a00] text-gray-950 border border-[#ff8f00] flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isInstantBuying ? 'যোগ হচ্ছে...' : 'এখনই কিনুন'}</span>
                </button>
              </div>

              {/* View Full Product Details Link */}
              <div className="flex items-center justify-between text-xs pt-1 text-gray-500">
                <Link
                  href={`/search?query=${encodeURIComponent(product.titleBn)}`}
                  className="text-blue-700 hover:text-amber-800 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>সম্পূর্ণ প্রোডাক্ট পেজ ও অতিরিক্ত রিভিউ দেখুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <span>আইটেম আইডি: {product.bookId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
