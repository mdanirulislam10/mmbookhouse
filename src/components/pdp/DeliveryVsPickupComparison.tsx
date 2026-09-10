'use client';

import React, { useState } from 'react';
import {
  Truck,
  Store,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import {
  lookupPincodeServiceability,
  MALDA_STORE_INFO,
  computePickupReadyTime,
  DEFAULT_PINCODE,
} from '@/lib/data/pincodeData';
import { formatINR } from '@/lib/utils/currency';
import { FulfillmentMode } from '@/types/delivery';

export interface DeliveryVsPickupComparisonProps {
  selectedMode?: FulfillmentMode;
  onSelectMode?: (mode: FulfillmentMode) => void;
  bookPrice?: number;
  pincode?: string;
  className?: string;
}

/**
 * Task 28: Delivery vs Self-Pickup Comparison Card
 * "হোম ডেলিভারি বনাম সেলফ-পিকআপের ক্ষেত্রে ডেলিভারি চার্জ ও সময়ের পরিচ্ছন্ন অপশন তুলনা কার্ড"
 * "🚚 হোম ডেলিভারি: ₹৫০ (২-৩ দিন) | 🏬 নেতাজি সুভাষ রোড দোকান থেকে পিকআপ: সম্পূর্ণ ফ্রি (₹০, আজই ২ ঘণ্টার মধ্যে প্রস্তুত)"
 */
export const DeliveryVsPickupComparison: React.FC<DeliveryVsPickupComparisonProps> = ({
  selectedMode: controlledMode,
  onSelectMode,
  bookPrice = 0,
  pincode: propPincode,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();
  const { location } = useDeliveryLocation();

  const [internalMode, setInternalMode] = useState<FulfillmentMode>('home_delivery');
  const activeMode = controlledMode !== undefined ? controlledMode : internalMode;

  const activePincode = propPincode || location.pincode || DEFAULT_PINCODE;
  const serviceInfo = lookupPincodeServiceability(activePincode);
  const readyEstimate = computePickupReadyTime();

  const isFreeHomeDelivery = bookPrice >= (serviceInfo.minOrderFreeShipping || 499);
  const homeDeliveryFee = isFreeHomeDelivery ? 0 : 40;

  const handleModeSelect = (mode: FulfillmentMode) => {
    setInternalMode(mode);
    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
      data-testid="delivery-vs-pickup-comparison"
    >
      {/* Title Header */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-gray-950 flex items-center gap-1.5">
            <span>
              {isBengali
                ? 'ডেলিভারি নাকি দোকান থেকে সংগ্রহ? পছন্দের অপশন বাছুন'
                : 'Home Delivery vs Store Pickup: Choose Option'}
            </span>
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {isBengali
              ? 'মালদা ও সংলগ্ন এলাকার পাঠকদের জন্য দুটি দ্রুততম সমাধান'
              : 'Two fastest fulfillment methods tailored for Malda readers'}
          </p>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
          {isBengali ? 'সুবিধাজনক অপশন' : 'Compare & Choose'}
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Option 1: Doorstep Home Delivery */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleModeSelect('home_delivery')}
          onKeyDown={(e) => e.key === 'Enter' && handleModeSelect('home_delivery')}
          className={`rounded-xl border p-3.5 sm:p-4 text-left cursor-pointer transition-all relative select-none ${
            activeMode === 'home_delivery'
              ? 'bg-sky-50/70 border-[#007185] ring-2 ring-sky-200 shadow-xs'
              : 'bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {/* Radio Indicator */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  activeMode === 'home_delivery'
                    ? 'border-[#007185] bg-[#007185]'
                    : 'border-gray-400 bg-white'
                }`}
              >
                {activeMode === 'home_delivery' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900">
                <Truck className="w-4 h-4 text-[#007185]" />
                <span>{isBengali ? 'হোম ডেলিভারি' : 'Home Delivery'}</span>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                isFreeHomeDelivery
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-200/80 text-gray-800'
              }`}
            >
              {isFreeHomeDelivery
                ? isBengali
                  ? 'ফ্রি (₹০)'
                  : 'FREE (₹0)'
                : formatINR(homeDeliveryFee, language)}
            </span>
          </div>

          {/* Timing Promise */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-800 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {isBengali
                ? serviceInfo.deliveryDateTextBn
                : serviceInfo.deliveryDateTextEn}
            </span>
          </div>

          {/* Advantages Bullet Points */}
          <div className="mt-2 space-y-1 text-[11px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>
                {isBengali
                  ? 'সরাসরি আপনার বাড়ির দোরগোড়ায় পার্সেল পৌঁছে যাবে'
                  : 'Delivered directly to your doorstep address'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>
                {isBengali
                  ? 'ক্যাশ অন ডেলিভারি (COD) বা অনলাইন পেমেন্ট সুবিধা'
                  : 'Cash on Delivery or UPI / Online payment'}
              </span>
            </div>
          </div>
        </div>

        {/* Option 2: Store Self-Pickup (BOPIS) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleModeSelect('store_pickup')}
          onKeyDown={(e) => e.key === 'Enter' && handleModeSelect('store_pickup')}
          className={`rounded-xl border p-3.5 sm:p-4 text-left cursor-pointer transition-all relative select-none ${
            activeMode === 'store_pickup'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-200 shadow-xs'
              : 'bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {/* Radio Indicator */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  activeMode === 'store_pickup'
                    ? 'border-amber-600 bg-amber-600'
                    : 'border-gray-400 bg-white'
                }`}
              >
                {activeMode === 'store_pickup' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900">
                <Store className="w-4 h-4 text-amber-700" />
                <span>
                  {isBengali ? 'দোকান থেকে সেলফ-পিকআপ' : 'Store Self-Pickup'}
                </span>
              </div>
            </div>

            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              {isBengali ? 'সম্পূর্ণ ফ্রি (₹০)' : 'FREE (₹0)'}
            </span>
          </div>

          {/* Timing Promise */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-950 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {isBengali
                ? readyEstimate.readyTextBn
                : readyEstimate.readyTextEn}
            </span>
          </div>

          {/* Advantages Bullet Points */}
          <div className="mt-2 space-y-1 text-[11px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>
                {isBengali
                  ? 'কোনো ডেলিভারি চার্জ নেই — জিরো ওয়েটিংয়ে সরাসরি গ্রহণ'
                  : 'Zero delivery fee — skip the counter queue'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>
                {isBengali
                  ? 'এম.এম বুক হাউস, নেতাজি সুভাষ রোড, মালদা শোরুম'
                  : 'M.M Book House, Netaji Subhash Road, Malda Town'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
