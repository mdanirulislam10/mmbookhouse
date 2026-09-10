'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Clock, Check, AlertTriangle, RefreshCw, Star, Bell, Sparkles } from 'lucide-react';
import { DealItem } from '@/types/deal';
import { useDealCountdown } from '@/hooks/useDealCountdown';
import { AmazonDealBadge } from './AmazonDealBadge';
import { DealClaimBar } from './DealClaimBar';
import { useCart } from '@/hooks/useCartStore';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';

interface DealCardProps {
  deal: DealItem;
}

export const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const [internalExpired, setInternalExpired] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const { items, addItem } = useCart();

  // Task 21, 28 & 30: Live server-synced countdown hook with scheduled deal awareness
  const {
    formattedTimeBn,
    isExpired: timerExpired,
    isUpcoming,
    prefixBn,
    toggleForceExpire,
    forceExpired,
  } = useDealCountdown({
    startTime: deal.startTime,
    endTime: deal.endTime,
    onExpire: () => setInternalExpired(true),
  });

  const isExpired = timerExpired || internalExpired || forceExpired;

  // Task 24: Real-time Price Restoration
  // When expired, restore price back to original MRP without page refresh!
  const currentDisplayPrice = isExpired ? deal.mrp : deal.dealPrice;

  // Task 25: Deal Abuse Prevention & Max 1 per customer limit
  const isAlreadyInCart = items.some(
    (item) => item.id === deal.id || item.bookId === deal.bookId
  );

  const handleAddToCart = () => {
    if (isAlreadyInCart || isUpcoming) return;

    addItem({
      id: deal.id,
      bookId: deal.bookId,
      title: deal.title,
      titleBn: deal.titleBn,
      author: deal.author,
      price: currentDisplayPrice,
      mrp: deal.mrp,
      quantity: 1, // Strictly capped at 1 for flash deals
      maxQuantity: deal.maxPerCustomer || 1, // Task 25: Prevent bypass in drawer
      coverImage: deal.coverImage,
    });
  };

  const handleToggleNotify = () => {
    setIsNotified((prev) => !prev);
  };

  // Fix 1: Bidirectional test toggle without state leak
  const handleToggleTest = () => {
    if (forceExpired || internalExpired) {
      setInternalExpired(false);
    }
    toggleForceExpire();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group relative z-0">
      <div>
        {/* Top Header: Badge & Live Countdown */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <AmazonDealBadge
            discountPercentage={deal.discountPercentage}
            dealType={deal.dealType}
            isExpired={isExpired}
            isUpcoming={isUpcoming}
          />

          {/* Task 21 & 28: Live Countdown Ticker */}
          <div
            className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
              isExpired
                ? 'bg-gray-100 text-gray-500'
                : isUpcoming
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200/70 animate-pulse'
            }`}
            title={isUpcoming ? 'ডিল শুরুর বাকি সময়' : 'ডিল শেষ হওয়ার বাকি সময়'}
          >
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{isExpired ? 'অফার সমাপ্ত' : `${prefixBn}: ${formattedTimeBn}`}</span>
          </div>
        </div>

        {/* Book Cover Image with Zoom Container and Direct PDP Link (Task 28) */}
        <Link
          href={`/book/${deal.bookId}`}
          className="relative aspect-[4/3] w-full mb-3 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center block group/img"
          title={`${deal.titleBn} এর বিস্তারিত বিবরণী দেখুন`}
        >
          <Image
            src={deal.coverImage}
            alt={deal.titleBn}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover object-center group-hover/img:scale-105 transition-transform duration-300"
          />

          {/* Sub-category tag */}
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold font-bengali">
            {deal.categoryBn}
          </span>
        </Link>

        {/* Title and Author */}
        <div className="space-y-1 mb-3">
          <h4 className="text-sm sm:text-base font-bold text-gray-950 font-bengali line-clamp-2 leading-snug group-hover:text-amber-800 transition-colors">
            <Link href={`/book/${deal.bookId}`} className="hover:underline">
              {deal.titleBn}
            </Link>
          </h4>
          <p className="text-xs text-gray-500 font-bengali line-clamp-1">
            {deal.authorBn}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(deal.rating)
                      ? 'fill-current text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-gray-700 font-mono">
              {deal.rating}
            </span>
            <span className="text-[10px] text-gray-400 font-bengali">
              ({toBengaliNumerals(deal.reviewsCount)} রিভিউ)
            </span>
          </div>
        </div>

        {/* Task 24: Price Block (Dynamic Real-Time Restoration) */}
        <div className="mb-3.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
          {isUpcoming ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-bengali">
                  আসন্ন ডিল মূল্য: {formatINR(deal.dealPrice, 'bn')}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bengali">
                  {toBengaliNumerals(deal.discountPercentage)}% ছাড়
                </span>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-sm font-semibold text-gray-700 font-bengali">
                  বর্তমান সাধারণ মূল্য: {formatINR(deal.mrp, 'bn')}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 font-semibold font-bengali mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600 flex-shrink-0" />
                <span>ডিল শুরু হলে {formatINR(deal.mrp - deal.dealPrice, 'bn')} সাশ্রয় হবে (এখনই নোটিফাই সেট রাখুন)</span>
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl sm:text-2xl font-black font-bengali tracking-tight ${
                    isExpired ? 'text-gray-900' : 'text-[#cc0c39]'
                  }`}
                >
                  {formatINR(currentDisplayPrice, 'bn')}
                </span>

                {!isExpired && (
                  <span className="text-xs text-gray-400 line-through font-bengali">
                    M.R.P: {formatINR(deal.mrp, 'bn')}
                  </span>
                )}

                {!isExpired && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded font-bengali text-emerald-700 bg-emerald-50">
                    সাশ্রয়: {formatINR(deal.mrp - deal.dealPrice, 'bn')}
                  </span>
                )}
              </div>

              {isExpired && (
                <p className="text-[11px] text-rose-600 font-semibold font-bengali mt-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>ডিলের সময় শেষ হওয়ায় আসল মূল্যে (MRP) প্রত্যাবর্তিত হয়েছে</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Task 23: Limited Stock "Claim Meter" Progress Bar */}
        <div className="mb-4">
          <DealClaimBar
            claimedPercentage={deal.claimedPercentage}
            totalStock={deal.totalStock}
            claimedStock={deal.claimedStock}
            isExpired={isExpired}
          />
        </div>
      </div>

      {/* Task 25 & 29: Cart Action or Upcoming Notify Alert with Controls */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        {isUpcoming ? (
          /* Task 29: User Alert on Upcoming Deals */
          <button
            type="button"
            onClick={handleToggleNotify}
            className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm font-bengali flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
              isNotified
                ? 'bg-blue-50 text-blue-800 border border-blue-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md active:scale-98'
            }`}
          >
            <Bell className={`w-4 h-4 ${isNotified ? 'fill-current text-blue-700' : ''}`} />
            <span>
              {isNotified ? 'নোটিফিকেশন সক্রিয় (অ্যালার্ট অন)' : 'মনে করিয়ে দিন (Notify Me)'}
            </span>
          </button>
        ) : (
          /* Task 25: Cart Action with 1-Copy Limit Validation */
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAlreadyInCart}
            className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm font-bengali flex items-center justify-center gap-2 shadow-xs transition-all ${
              isAlreadyInCart
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-not-allowed'
                : isExpired
                ? 'bg-gray-900 hover:bg-gray-800 text-white cursor-pointer active:scale-98'
                : 'bg-[#febd69] hover:bg-[#f3a847] text-gray-950 cursor-pointer hover:shadow-md active:scale-98'
            }`}
            title={
              isAlreadyInCart
                ? 'প্রতি অ্যাকাউন্টে সর্বোচ্চ ১ কপি সীমাবদ্ধ'
                : 'কার্টে ১ কপি যোগ করুন'
            }
          >
            {isAlreadyInCart ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span>কার্টে ১টি যুক্ত রয়েছে (সর্বোচ্চ সীমা)</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isExpired ? 'আসল মূল্যে কার্টে যোগ করুন' : 'ডিল মূল্যে কার্টে যোগ করুন'}
                </span>
              </>
            )}
          </button>
        )}

        {/* Sub-label and customer purchase policy */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
          <span className="font-bengali">
            {isUpcoming
              ? isNotified
                ? '🔔 ডিল শুরুর ৫ মিনিট আগে অ্যালার্ট পাবেন'
                : '⏰ নির্ধারিত সময় থেকে ডিল অফার শুরু হবে'
              : isAlreadyInCart
              ? '🔒 প্রতি গ্রাহক ১টি কপি প্রযোজ্য'
              : '⚡ ফ্ল্যাশ ডিল: প্রতি অর্ডারে ১টি কপি'}
          </span>
        </div>
      </div>
    </div>
  );
};

