'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SUPER_SAVER_COMBOS } from '@/lib/data/comboDeals';
import { ComboDeal } from '@/types/combo';
import { useCart } from '@/hooks/useCartStore';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import {
  PackageCheck,
  Plus,
  ShoppingCart,
  Check,
  Flame,
  Truck,
  Sparkles,
  Layers
} from 'lucide-react';

interface SuperSaverComboWidgetProps {
  className?: string;
}

export function SuperSaverComboWidget({ className = '' }: SuperSaverComboWidgetProps) {
  const [activeComboIndex, setActiveComboIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const { addItems, triggerBounce } = useCart();

  const activeCombo: ComboDeal = SUPER_SAVER_COMBOS[activeComboIndex];

  const handleAddBundleToCart = () => {
    if (!activeCombo) return;

    // Calculate individual discounted price proportion with remainder absorption on the last item
    const priceRatio = activeCombo.comboPrice / activeCombo.totalMrp;
    let accumulated = 0;

    const cartItems = activeCombo.books.map((book, idx) => {
      const isLast = idx === activeCombo.books.length - 1;
      const allocatedPrice = isLast
        ? Math.max(0, activeCombo.comboPrice - accumulated)
        : Math.round(book.mrp * priceRatio);
      accumulated += allocatedPrice;

      return {
        id: `cart-bundle-${activeCombo.id}-${book.bookId}`,
        bookId: book.bookId,
        title: book.title,
        titleBn: `${book.titleBn} (কম্বো অফার)`,
        author: book.authorBn || book.author,
        price: allocatedPrice,
        mrp: book.mrp,
        quantity: 1,
        coverImage: book.coverImage,
      };
    });

    addItems(cartItems);
    triggerBounce();
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <section
      aria-label="সুপার সেভার কম্বো অফার"
      className={`bg-white rounded-xl border border-gray-200/90 shadow-xs p-4 sm:p-6 space-y-4 ${className}`}
    >
      {/* Widget Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 font-bengali">
              Super Saver Combos • মাল্টি-বুক বান্ডেল ডিলস
            </h2>
            <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-600" />
              <span>একসাথে কিনলে বাড়তি ছাড়</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 font-bengali">
            পরীক্ষা ও সেমিস্টারের প্রয়োজনীয় একাধিক বই একসাথে নিয়ে ডেলিভারি খরচ বাঁচান এবং পান আকর্ষণীয় কম্বো ডিসকাউন্ট
          </p>
        </div>

        {/* Combo Selection Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {SUPER_SAVER_COMBOS.map((combo, idx) => (
            <button
              key={combo.id}
              onClick={() => {
                setActiveComboIndex(idx);
                setIsAdded(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeComboIndex === idx
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {combo.badgeBn}
            </button>
          ))}
        </div>
      </div>

      {/* Main Combo Display Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left/Middle: Book Covers connected with '+' */}
        <div className="lg:col-span-8 bg-gray-50/80 rounded-xl p-4 sm:p-5 border border-gray-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 font-bengali">
              {activeCombo.titleBn}
            </h3>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded">
              {toBengaliNumerals(activeCombo.books.length)}টি বইয়ের সেট
            </span>
          </div>

          <p className="text-xs text-gray-600 font-bengali">
            {activeCombo.subtitleBn}
          </p>

          {/* Book Thumbnails with '+' connector */}
          <div className="flex items-center justify-start gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2">
            {activeCombo.books.map((book, index) => (
              <React.Fragment key={book.id}>
                {index > 0 && (
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-500 font-black">
                    <Plus className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-shrink-0 w-[110px] sm:w-[130px] space-y-1.5 group">
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-white border border-gray-200 shadow-xs group-hover:shadow-md transition-shadow">
                    <Image
                      src={book.coverImage}
                      alt={book.titleBn}
                      fill
                      sizes="130px"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight min-h-[2rem]">
                    {book.titleBn}
                  </h4>
                  <p className="text-[10px] text-gray-500 line-clamp-1">
                    {book.authorBn}
                  </p>
                  <div className="text-[11px] font-bold text-gray-900 font-sans">
                    MRP: <span className="line-through text-gray-400 font-normal">{formatINR(book.mrp)}</span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right: Summary & 1-Click Bundle Purchase Card */}
        <div className="lg:col-span-4 bg-white rounded-xl p-4 sm:p-5 border-2 border-amber-300 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-gray-800">
              কম্বো সাশ্রয় ক্যালকুলেশন
            </span>
          </div>

          {/* Pricing Details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>পৃথক মোট MRP:</span>
              <span className="line-through font-mono text-gray-400">{formatINR(activeCombo.totalMrp)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-gray-900">কম্বো অফার মূল্য:</span>
              <span className="text-2xl font-black text-gray-950 font-sans tracking-tight">
                {formatINR(activeCombo.comboPrice)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
              <span>আপনার মোট সাশ্রয়:</span>
              <span className="font-sans font-black text-sm">
                {formatINR(activeCombo.savingsAmount)} ({toBengaliNumerals(activeCombo.savingsPercentage)}% ছাড়)
              </span>
            </div>
          </div>

          {/* Free Delivery Callout */}
          {activeCombo.freeDelivery && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium pt-1">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>মালদা ও সংলগ্ন এলাকায় ১০০% ফ্রি হোম ডেলিভারি</span>
            </div>
          )}

          {/* Action Button: 1-Click Add Bundle to Cart */}
          <button
            onClick={handleAddBundleToCart}
            className={`w-full py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              isAdded
                ? 'bg-emerald-600 text-white border border-emerald-700'
                : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200]'
            }`}
            aria-label={`${activeCombo.titleBn} সম্পূর্ণ বান্ডেল কার্টে যোগ করুন`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>সম্পূর্ণ কম্বো কার্টে যোগ হয়েছে ✓</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 text-gray-900" />
                <span>কম্বো কার্টে যোগ করুন (১-ক্লিক)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
