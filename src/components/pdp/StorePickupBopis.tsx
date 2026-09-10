'use client';

import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { MALDA_STORE_INFO, computePickupReadyTime } from '@/lib/data/pincodeData';

export interface StorePickupBopisProps {
  storeName?: string;
  storeAddress?: string;
  className?: string;
  variant?: 'banner' | 'compact' | 'pill';
  onSelectPickup?: () => void;
  isSelected?: boolean;
}

/**
 * Task 23: Store Pickup - BOPIS (Buy Online, Pick Up In Store)
 * "বিনামূল্যে দোকান থেকে সংগ্রহ করুন: এম.এম বুক হাউস, নেতাজি সুভাষ রোড, মালদা (আজ বিকেল ৫টার পর প্রস্তুত থাকবে)"
 */
export const StorePickupBopis: React.FC<StorePickupBopisProps> = ({
  storeName,
  storeAddress,
  className = '',
  variant = 'banner',
  onSelectPickup,
  isSelected = false,
}) => {
  const { isBengali } = useLanguage();
  const [showSchedule, setShowSchedule] = useState(false);

  const readyEstimate = computePickupReadyTime();
  const displayName = isBengali
    ? storeName || MALDA_STORE_INFO.storeNameBn
    : storeName || MALDA_STORE_INFO.storeName;
  const displayAddress = isBengali
    ? storeAddress || MALDA_STORE_INFO.storeAddressBn
    : storeAddress || MALDA_STORE_INFO.storeAddress;

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer select-none transition-all ${
          isSelected
            ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
            : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/70'
        } ${className}`}
        onClick={onSelectPickup}
        role="button"
        tabIndex={0}
      >
        <Store className="w-3.5 h-3.5 shrink-0" />
        <span className="font-bold">
          {isBengali ? 'দোকান থেকে সংগ্রহ (ফ্রি)' : 'Store Pickup (FREE)'}
        </span>
        <span className="text-[10px] opacity-90 hidden sm:inline">
          • {isBengali ? readyEstimate.readyTextBn : readyEstimate.readyTextEn}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isSelected
          ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-300 shadow-md'
          : 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 border-amber-300/80 hover:border-amber-400 shadow-xs'
      } p-4 space-y-3 ${className}`}
      data-testid="store-pickup-bopis"
    >
      {/* Top Row: Store Badge & Free Tag */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                {isBengali ? 'বিনামূল্যে দোকান থেকে সংগ্রহ করুন' : 'Free Store Pickup'}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {isBengali ? '₹০ ডেলিভারি ফি' : '₹0 Delivery Fee'}
              </span>
            </div>
            <p className="text-xs text-amber-900 font-semibold mt-0.5">
              {displayName}
            </p>
          </div>
        </div>

        {onSelectPickup && (
          <button
            type="button"
            onClick={onSelectPickup}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              isSelected
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-white border border-amber-400 text-amber-900 hover:bg-amber-50'
            }`}
          >
            {isSelected
              ? isBengali
                ? '✓ নির্বাচিত'
                : '✓ Selected'
              : isBengali
              ? 'পিকআপ নির্বাচন'
              : 'Select Pickup'}
          </button>
        )}
      </div>

      {/* Readiness Highlight Callout */}
      <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-950 font-bold">
          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {isBengali ? readyEstimate.readyTextBn : readyEstimate.readyTextEn}
          </span>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
          {isBengali ? 'জিরো ওয়েটিং' : 'Zero Waiting'}
        </span>
      </div>

      {/* Address & Navigation Links */}
      <div className="text-xs text-gray-600 space-y-1.5 pt-1">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{displayAddress}</span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
          <button
            type="button"
            onClick={() => setShowSchedule(!showSchedule)}
            className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
          >
            <span>
              {isBengali
                ? showSchedule
                  ? 'কাউন্টার সময়সূচি লুকান'
                  : 'কাউন্টার সময়সূচি দেখুন'
                : showSchedule
                ? 'Hide Timings'
                : 'View Store Timings'}
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${
                showSchedule ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${MALDA_STORE_INFO.phone}`}
              className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 font-semibold"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>{MALDA_STORE_INFO.phoneDisplay}</span>
            </a>

            <a
              href={MALDA_STORE_INFO.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-bold"
            >
              <Navigation className="w-3 h-3 text-amber-600" />
              <span>{isBengali ? 'ম্যাপ' : 'Map'}</span>
            </a>
          </div>
        </div>

        {/* Collapsible Timing Schedule */}
        {showSchedule && (
          <div className="mt-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] text-gray-700 space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 font-semibold text-gray-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {isBengali
                  ? MALDA_STORE_INFO.openHoursBn
                  : MALDA_STORE_INFO.openHoursEn}
              </span>
            </div>
            <p className="text-gray-500 text-[10px]">
              {isBengali
                ? 'অর্ডার প্লেস করার পর এসএমএস/হোয়াটসঅ্যাপে পিকআপ কোড পাঠানো হবে। কাউন্টারে কোড দেখিয়ে অবিলম্বে বই গ্রহণ করুন।'
                : 'A pickup verification OTP will be sent to your mobile. Simply present it at the counter for immediate collection.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
